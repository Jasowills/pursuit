import { it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ApplicationQueue } from '../src/queue.js';
import { formHash } from '../src/plan.js';
import { digest } from '@pursuit/tailoring';
async function savedQueue(path: string) {
  const queue = new ApplicationQueue(path);
  const form = { url: 'https://jobs.ashbyhq.com/fixture/qa', fields: [] };
  const pdf = new TextEncoder().encode('%PDF-fixture');
  const row = await queue.add({
    personId: 'fixture',
    jobUrl: form.url,
    packetHash: 'a'.repeat(64),
    pdfHash: await digest(pdf),
    formHash: await formHash(form),
    answers: {},
  });
  queue.policy(true, 1);
  queue.authorize(row.id, row.payload_hash);
  return { queue, row, form, pdf };
}
it('rolls back policy changes if pending approval revocation cannot be written', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pursuit-policy-atomic-'));
  const path = join(dir, 'queue.sqlite');
  const { queue, row } = await savedQueue(path);
  const observer = new DatabaseSync(path);
  try {
    observer.exec(
      "CREATE TRIGGER refuse_revoke BEFORE UPDATE ON apply_jobs BEGIN SELECT RAISE(ABORT, 'fixture_write_failure'); END;",
    );
    expect(() => queue.policy(false, 17)).toThrow();
    expect(queue.executionPolicy()).toEqual({ enabled: true, dailyLimit: 1 });
    expect(queue.get(row.id).state).toBe('AUTHORIZED');
  } finally {
    observer.close();
    queue.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
it('expired preparation loses ownership and cannot overwrite a revised draft from another connection', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pursuit-lease-fence-'));
  const path = join(dir, 'queue.sqlite');
  const { queue, row, pdf, form } = await savedQueue(path);
  let filled!: () => void, release!: () => void;
  const filling = new Promise<void>((r) => {
    filled = r;
  });
  const gate = new Promise<void>((r) => {
    release = r;
  });
  let submitted = false;
  const running = queue.run(row.id, pdf, {
    observe: async () => form,
    fill: async () => {
      filled();
      await gate;
    },
    submit: async () => {
      submitted = true;
      throw Error('must_not_submit');
    },
    close: async () => {},
  });
  await filling;
  const editor = new DatabaseSync(path);
  editor
    .prepare("UPDATE apply_jobs SET lease_until='2000-01-01T00:00:00.000Z' WHERE id=?")
    .run(row.id);
  editor.close();
  const recovered = new ApplicationQueue(path);
  try {
    await recovered.revise(row.id, { ...row.payload, packetHash: 'b'.repeat(64) });
    release();
    await running;
    expect(submitted).toBe(false);
    expect(recovered.get(row.id).state).toBe('DRAFT');
    expect(recovered.get(row.id).last_error).toBeNull();
    expect(recovered.get(row.id).payload.packetHash).toBe('b'.repeat(64));
    expect(recovered.get(row.id).lease).toBeNull();
  } finally {
    release();
    await running;
    recovered.close();
    queue.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
it('two independent connections share the attempt ceiling before any browser work starts', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pursuit-worker-ceiling-'));
  const path = join(dir, 'queue.sqlite');
  const { queue, row, pdf, form } = await savedQueue(path);
  const other = new ApplicationQueue(path);
  let filled!: () => void, release!: () => void;
  const filling = new Promise<void>((r) => {
    filled = r;
  });
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const running = queue.run(row.id, pdf, {
    observe: async () => form,
    fill: async () => {
      filled();
      await gate;
    },
    submit: async () => ({
      kind: 'hosted_confirmation',
      url: form.url,
      text: 'Fixture confirmation',
      acceptedPostStatus: 200,
      observedAt: new Date().toISOString(),
    }),
    close: async () => {},
  });
  await filling;
  try {
    const next = await other.add({ ...row.payload, jobUrl: form.url + '-two' });
    other.authorize(next.id, next.payload_hash);
    let opened = false;
    await other.run(next.id, pdf, async () => {
      opened = true;
      throw Error('must_not_open');
    });
    expect(opened).toBe(false);
    release();
    await running;
    expect(queue.get(row.id).state).toBe('CONFIRMED');
    expect(other.ready(next.id)).toBe(false);
    expect(other.get(next.id).state).toBe('AUTHORIZED');
  } finally {
    release();
    await running;
    other.close();
    queue.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
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
