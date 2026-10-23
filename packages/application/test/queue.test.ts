import { it, expect, vi } from 'vitest';
import { ApplicationQueue } from '../src/queue.js';
import { formHash } from '../src/plan.js';
import { digest } from '@pursuit/tailoring';
import type { ApplicationAdapter, Form } from '../src/contracts.js';
const pdf = new TextEncoder().encode('%PDF-fixture');
const form: Form = {
  url: 'https://jobs.ashbyhq.com/example/role/application',
  fields: [
    { id: 'name', label: 'Full name', type: 'text', required: true, options: [] },
    { id: 'resume', label: 'Resume', type: 'file', required: true, options: [] },
  ],
};
async function setup() {
  const queue = new ApplicationQueue(':memory:');
  queue.policy(true, 1);
  const row = await queue.add({
    personId: 'user',
    jobUrl: form.url,
    packetHash: 'a'.repeat(64),
    pdfHash: await digest(pdf),
    answers: { name: 'Alex' },
    formHash: await formHash(form),
  });
  return { queue, row };
}
function adapter(overrides: Partial<ApplicationAdapter> = {}): ApplicationAdapter {
  return {
    observe: async () => form,
    fill: async () => {},
    submit: async () => ({
      kind: 'hosted_confirmation',
      url: form.url,
      text: 'Application submitted',
      acceptedPostStatus: 200,
      observedAt: new Date().toISOString(),
    }),
    close: async () => {},
    ...overrides,
  };
}
it('will not submit without exact payload authorization', async () => {
  const { queue, row } = await setup();
  let submitted = 0;
  const result = await queue.run(
    row.id,
    pdf,
    adapter({
      submit: async () => {
        submitted++;
        throw Error();
      },
    }),
  );
  expect(result.state).toBe('DRAFT');
  expect(submitted).toBe(0);
  queue.close();
});
it('records a receipt once and never repeats a confirmed submission', async () => {
  const { queue, row } = await setup();
  queue.authorize(row.id, row.payload_hash);
  const result = await queue.run(row.id, pdf, adapter());
  expect(result.state).toBe('CONFIRMED');
  expect((await queue.run(row.id, pdf, adapter())).state).toBe('CONFIRMED');
  queue.close();
});
it('stops on changed form, PDF or missing answers before submit', async () => {
  for (const kind of ['form', 'pdf', 'answer']) {
    const { queue, row } = await setup();
    queue.authorize(row.id, row.payload_hash);
    let submitted = false;
    const changed = {
      ...form,
      fields: [
        ...form.fields,
        {
          id: 'sponsor',
          label: 'Sponsorship required?',
          type: 'text' as const,
          required: true,
          options: [],
        },
      ],
    };
    const result = await queue.run(
      row.id,
      kind === 'pdf' ? new Uint8Array([1]) : pdf,
      adapter({
        observe: async () => (kind === 'pdf' ? form : changed),
        submit: async () => {
          submitted = true;
          throw Error();
        },
      }),
    );
    expect(result.state).toBe('NEEDS_USER');
    expect(submitted).toBe(false);
    queue.close();
  }
});
it('fences a second worker and reserves the daily attempt before browser work', async () => {
  const { queue, row } = await setup();
  queue.authorize(row.id, row.payload_hash);
  let resume!: () => void;
  const gate = new Promise<void>((done) => (resume = done));
  const first = queue.run(row.id, pdf, adapter({ fill: async () => gate }));
  await new Promise((r) => setTimeout(r, 10));
  expect((await queue.run(row.id, pdf, adapter())).state).toBe('PREPARING');
  resume();
  await first;
  const other = await queue.add({ ...row.payload, jobUrl: form.url + '-two' });
  queue.authorize(other.id, other.payload_hash);
  expect((await queue.run(other.id, pdf, adapter())).state).toBe('AUTHORIZED');
  queue.close();
});
it('does not retry an ambiguous submission timeout', async () => {
  const { queue, row } = await setup();
  queue.authorize(row.id, row.payload_hash);
  const result = await queue.run(
    row.id,
    pdf,
    adapter({
      submit: async () => {
        throw new Error('timeout_after_click');
      },
    }),
  );
  expect(result.state).toBe('UNCERTAIN');
  expect(() => queue.authorize(row.id, row.payload_hash)).toThrow();
  expect((await queue.run(row.id, pdf, adapter())).state).toBe('UNCERTAIN');
  queue.close();
});
it('pause revokes pending authorizations', async () => {
  const { queue, row } = await setup();
  queue.authorize(row.id, row.payload_hash);
  queue.policy(false);
  expect((await queue.run(row.id, pdf, adapter())).state).toBe('DRAFT');
  queue.policy(true);
  expect(queue.get(row.id).state).toBe('DRAFT');
  queue.close();
});

it('does not submit when authorization expires while filling the form', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-23T10:00:00Z'));
  const { queue, row } = await setup();
  try {
    queue.authorize(row.id, row.payload_hash);
    vi.setSystemTime(new Date('2026-10-23T10:29:00Z'));
    let submitted = 0;
    const result = await queue.run(
      row.id,
      pdf,
      adapter({
        fill: async () => {
          vi.setSystemTime(new Date('2026-10-23T10:31:00Z'));
        },
        submit: async () => {
          submitted++;
          throw new Error('must_not_submit');
        },
      }),
    );
    expect(submitted).toBe(0);
    expect(result.state).toBe('NEEDS_USER');
  } finally {
    queue.close();
    vi.useRealTimers();
  }
});
