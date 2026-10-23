import { it, expect } from 'vitest';
import { chromium } from 'playwright-core';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CareerEngine } from '../src/index.js';
import { AshbyAdapter } from '@pursuit/application';
import { structureResume, tailor } from '@pursuit/tailoring';
import { renderResumePdf } from '@pursuit/tailoring/pdf';
it('runs the local source-to-PDF-to-approved-form flow with every browser request intercepted', async () => {
  const root = mkdtempSync(join(tmpdir(), 'pursuit-engine-browser-'));
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_EXECUTABLE ??
      (process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : chromium.executablePath()),
    headless: true,
  });
  const url = 'https://jobs.ashbyhq.com/fixture/qa';
  let submitted = 0,
    uploaded = 0;
  const engine = new CareerEngine(root, {
    executionEnabled: true,
    read: async (address) => ({
      url: address,
      status: 200,
      headers: {},
      body: JSON.stringify(
        address.includes('api.ashbyhq.com')
          ? {
              jobs: [
                {
                  id: 'qa',
                  title: 'QA Analyst',
                  jobUrl: url,
                  applyUrl: url,
                  isListed: true,
                  descriptionPlain: 'Test SQL APIs.',
                  location: 'Remote',
                },
              ],
            }
          : { jobs: [] },
      ),
    }),
    adapter: async () => {
      const context = await browser.newContext();
      await context.route('**/*', async (route) => {
        if (route.request().method() === 'POST') {
          submitted++;
          const data = route.request().postDataBuffer()!;
          expect(data.toString()).toContain('Alex');
          expect(data.toString()).toContain('%PDF-');
          uploaded = data.length;
          await route.fulfill({ status: 200, body: '{}', contentType: 'application/json' });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `<form><label>Full name<input name="name" required></label><label>Resume<input type="file" name="resume" required></label><button>Submit application</button></form><script>document.querySelector('form').onsubmit=async e=>{e.preventDefault();await fetch('/application/submit',{method:'POST',body:new FormData(e.target)});document.body.innerHTML='<h1>Application submitted</h1>'}</script>`,
        });
      });
      const page = await context.newPage();
      await page.goto(url);
      return new AshbyAdapter(page, () => context.close());
    },
  });
  try {
    await engine.dispatch({ action: 'source.add', url });
    const s = (await engine.dispatch({
      action: 'search',
      profile: { roles: ['QA Analyst'] },
    })) as any;
    const role = (await engine.dispatch({ action: 'opportunity', id: s.matches[0].id })) as any;
    const resume = await structureResume(
      'Alex Morgan\nalex@example.com\n\nExperience\nExample | QA Analyst | 2022-2025\n- Tested SQL APIs.',
      'source.txt',
    );
    resume.reviewedAt = new Date().toISOString();
    const packet = await tailor(resume, {
      id: role.id,
      title: role.role,
      company: role.company,
      description: role.posting,
    });
    const pdf = await renderResumePdf(packet, resume);
    const p = (await engine.dispatch({
      action: 'packet.register',
      jobId: role.id,
      resume,
      packet,
      pdfHash: pdf.hash,
      pdfBase64: Buffer.from(pdf.bytes).toString('base64'),
    })) as any;
    const inspected = (await engine.dispatch({
      action: 'application.inspect',
      packetHash: p.packetHash,
    })) as any;
    const plan = (await engine.dispatch({
      action: 'application.stage',
      packetHash: p.packetHash,
      formHash: inspected.formHash,
      answers: { 'field-0': 'Alex Morgan' },
      eligibilityConfirmed: true,
    })) as any;
    await engine.dispatch({ action: 'application.policy', enabled: true, dailyLimit: 100 });
    await engine.dispatch({
      action: 'application.authorize',
      id: plan.id,
      expectedHash: plan.payload_hash,
    });
    const result = (await engine.dispatch({ action: 'application.run', id: plan.id })) as any;
    expect(result.state).toBe('CONFIRMED');
    expect(submitted).toBe(1);
    expect(uploaded).toBeGreaterThan(pdf.bytes.length);
    await engine.dispatch({ action: 'application.run', id: plan.id });
    expect(submitted).toBe(1);
  } finally {
    engine.close();
    await browser.close();
    rmSync(root, { recursive: true, force: true });
  }
}, 60000);
