import { it, expect } from 'vitest';
import { chromium } from 'playwright-core';
import { AshbyAdapter } from '../src/ashby.js';
import { ApplicationQueue } from '../src/queue.js';
import { formHash } from '../src/plan.js';
import { digest, structureResume, tailor } from '@pursuit/tailoring';
import { renderResumePdf } from '@pursuit/tailoring/pdf';
import { writeFile } from 'node:fs/promises';
// An entirely fulfilled browser fixture: no requests leave the browser context.
it('fills a hosted form, uploads the exact PDF and records a confirmation through the real browser adapter', async () => {
  const executable =
    process.env.CHROMIUM_EXECUTABLE ??
    (process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : chromium.executablePath());
  const browser = await chromium.launch({ executablePath: executable, headless: true });
  const context = await browser.newContext();
  let posts = 0;
  await context.route('**/*', async (route) => {
    if (route.request().method() === 'POST') {
      posts++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"accepted":true}',
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<form id="application"><label>Full name<input name="name" required></label><label>Email<input name="email" type="email" required></label><label>Resume<input name="resume" type="file" required></label><button type="submit">Submit application</button></form><script>document.querySelector('form').onsubmit=async(event)=>{event.preventDefault();const response=await fetch('/application-submit',{method:'POST',body:new FormData(event.target)});if(response.ok)document.body.innerHTML='<h1>Application submitted</h1>'};</script>`,
    });
  });
  const page = await context.newPage();
  await page.goto('https://jobs.ashbyhq.com/fixture/role/application');
  const adapter = new AshbyAdapter(page, () => browser.close());
  const form = await adapter.observe();
  const resume = await structureResume(
    'Alex Morgan\nalex@example.com\n\nExperience\nExample | QA Analyst | 2022-2025\n- Tested REST APIs with SQL.',
    'fictional.txt',
  );
  resume.reviewedAt = new Date().toISOString();
  const packet = await tailor(resume, {
    id: 'fixture',
    title: 'QA Analyst',
    company: 'Example',
    description: 'Test APIs with SQL.',
  });
  const generated = await renderResumePdf(packet, resume);
  const pdf = generated.bytes;
  const queue = new ApplicationQueue(':memory:');
  queue.policy(true, 1);
  const row = await queue.add({
    personId: 'synthetic-user',
    jobUrl: form.url,
    packetHash: generated.packetHash,
    pdfHash: await digest(pdf),
    answers: { 'field-0': 'Alex Morgan', 'field-1': 'alex@example.com' },
    formHash: await formHash(form),
  });
  queue.authorize(row.id, row.payload_hash);
  try {
    const result = await queue.run(row.id, pdf, adapter);
    expect(result.state).toBe('CONFIRMED');
    expect(result.receipt.kind).toBe('hosted_confirmation');
    expect(posts).toBe(1);
    await writeFile(
      '/tmp/pursuit-ashby-fixture.json',
      JSON.stringify(
        {
          observedAt: new Date().toISOString(),
          scope:
            'All browser requests intercepted. Real source-backed PDF, form fill, upload and one synthetic confirmation. No Ashby contact or real application.',
          state: result.state,
          receipt: result.receipt,
          postCount: posts,
          pdfBytes: pdf.length,
          sourceFactsPreserved: packet.blocks.every(
            (b) => resume.sourceText.slice(b.start, b.end) === b.text,
          ),
        },
        null,
        2,
      ),
    );
  } finally {
    queue.close();
    await browser.close();
  }
}, 60000);
