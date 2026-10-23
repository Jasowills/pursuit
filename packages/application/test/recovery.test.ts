import { it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ApplicationQueue } from '../src/queue.js';
import { formHash } from '../src/plan.js';
import { digest } from '@pursuit/tailoring';
it('reopens an interrupted submission as uncertain and never retries it', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pursuit-apply-recovery-'));
  const path = join(dir, 'queue.sqlite');
  let q = new ApplicationQueue(path);
  const form = { url: 'https://jobs.ashbyhq.com/a/b', fields: [] };
  const pdf = new TextEncoder().encode('%PDF-fixture');
  const row = await q.add({
    personId: 'user',
    jobUrl: form.url,
    packetHash: 'a'.repeat(64),
    pdfHash: await digest(pdf),
    formHash: await formHash(form),
    answers: {},
  });
  q.policy(true);
  q.authorize(row.id, row.payload_hash);
  q.close();
  const crash = new DatabaseSync(path);
  crash
    .prepare(
      "UPDATE apply_jobs SET state='SUBMITTING',lease='interrupted-worker',lease_until='2000-01-01T00:00:00.000Z' WHERE id=?",
    )
    .run(row.id);
  crash.close();
  q = new ApplicationQueue(path);
  let started = false;
  const result = await q.run(row.id, pdf, async () => {
    started = true;
    throw Error();
  });
  expect(result.state).toBe('UNCERTAIN');
  expect(started).toBe(false);
  q.close();
  rmSync(dir, { recursive: true, force: true });
});
