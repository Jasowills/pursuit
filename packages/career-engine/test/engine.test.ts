import { it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CareerEngine } from '../src/index.js';
import { structureResume, tailor, digest } from '@pursuit/tailoring';
import { renderResumePdf } from '@pursuit/tailoring/pdf';
import type { ApplicationAdapter, Form } from '@pursuit/application';
import type { EngineSnapshot, SourcedOpportunity } from '../src/contracts.js';
const url = 'https://jobs.ashbyhq.com/fixture/qa-role';
const form: Form = {
  url,
  fields: [
    { id: 'name', label: 'Full name', type: 'text', required: true, options: [] },
    { id: 'resume', label: 'Resume', type: 'file', required: true, options: [] },
  ],
};
export function fixtureRead(changed = () => false) {
  return async (address: string) => ({
    url: address,
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(
      address.includes('api.ashbyhq.com')
        ? {
            jobs: [
              {
                id: 'qa-role',
                title: 'QA Analyst',
                jobUrl: url,
                applyUrl: url,
                isListed: true,
                location: 'Remote',
                workplaceType: 'Remote',
                descriptionPlain: changed()
                  ? 'Changed role requiring a medical license.'
                  : 'Test REST APIs using SQL and Postman.',
              },
            ],
          }
        : { jobs: [] },
    ),
  });
}
export async function packet(engine: CareerEngine) {
  await engine.dispatch({ action: 'source.add', url });
  const s = (await engine.dispatch({
    action: 'search',
    profile: {
      roles: ['QA Analyst'],
      skills: [{ name: 'SQL', evidence: 'Tested APIs using SQL in source resume.' }],
    },
  })) as EngineSnapshot;
  const match = s.matches.find((j) => j.title === 'QA Analyst')!;
  expect(match).toBeTruthy();
  const role = (await engine.dispatch({
    action: 'opportunity',
    id: match.id,
  })) as SourcedOpportunity;
  const resume = await structureResume(
    'Alex Morgan\nalex@example.com\n\nExperience\nExample | QA Analyst | 2022-2025\n- Tested APIs using SQL and Postman.\n\nEducation\nBA Design | Example | 2020',
    'source.txt',
  );
  resume.reviewedAt = new Date().toISOString();
  const p = await tailor(resume, {
    id: role.id,
    title: role.role,
    company: role.company,
    description: role.posting,
  });
  const pdf = await renderResumePdf(p, resume);
  const registered = (await engine.dispatch({
    action: 'packet.register',
    jobId: role.id,
    resume,
    packet: p,
    pdfHash: pdf.hash,
    pdfBase64: Buffer.from(pdf.bytes).toString('base64'),
  })) as any;
  return { role, resume, packet: p, pdf, ...registered };
}
function adapter(
  submit: () => Promise<any> = async () => ({
    kind: 'hosted_confirmation',
    url,
    text: 'Application submitted',
    acceptedPostStatus: 200,
    observedAt: new Date().toISOString(),
  }),
): ApplicationAdapter {
  return { observe: async () => form, fill: async () => {}, submit, close: async () => {} };
}
function setup(options: any = {}) {
  const root = mkdtempSync(join(tmpdir(), 'pursuit-native-engine-'));
  const engine = new CareerEngine(root, {
    read: fixtureRead(),
    adapter: async () => adapter(),
    ...options,
  });
  return {
    root,
    engine,
    close: () => {
      engine.close();
      rmSync(root, { recursive: true, force: true });
    },
  };
}
it('sources actual fixture records, emits source progress and retains preferences after restart', async () => {
  const events: any[] = [];
  const { engine, root, close } = setup({ progress: (event: any) => events.push(event) });
  try {
    const p = await packet(engine);
    expect(p.role.discovery.assessment.eligibility).toBe('unknown');
    expect(events.some((e) => e.phase === 'sourcing')).toBe(true);
    const reopened = new CareerEngine(root, { read: fixtureRead() });
    try {
      const state = reopened.snapshot();
      expect(state.profile.roles).toEqual(['QA Analyst']);
      expect(state.matches.map((j) => j.id)).toContain(p.role.id);
      expect(state.runs.some((r) => r.status === 'complete')).toBe(true);
    } finally {
      reopened.close();
    }
  } finally {
    close();
  }
});
it('requires required answers and exact application approval before submitting', async () => {
  let submitted = 0;
  const { engine, close } = setup({
    executionEnabled: true,
    adapter: async () =>
      adapter(async () => {
        submitted++;
        return {
          kind: 'hosted_confirmation',
          url,
          text: 'Application submitted',
          acceptedPostStatus: 200,
          observedAt: new Date().toISOString(),
        };
      }),
  });
  try {
    const p = await packet(engine);
    const inspected = (await engine.dispatch({
      action: 'application.inspect',
      packetHash: p.packetHash,
    })) as any;
    await expect(
      engine.dispatch({
        action: 'application.stage',
        packetHash: p.packetHash,
        formHash: inspected.formHash,
        answers: {},
        eligibilityConfirmed: true,
      }),
    ).rejects.toThrow('required_answers_missing');
    const plan = (await engine.dispatch({
      action: 'application.stage',
      packetHash: p.packetHash,
      formHash: inspected.formHash,
      answers: { name: 'Alex Morgan' },
      eligibilityConfirmed: true,
    })) as any;
    expect(((await engine.dispatch({ action: 'application.run', id: plan.id })) as any).state).toBe(
      'DRAFT',
    );
    expect(submitted).toBe(0);
    await engine.dispatch({ action: 'application.policy', enabled: true, dailyLimit: 100 });
    await expect(
      engine.dispatch({
        action: 'application.authorize',
        id: plan.id,
        expectedHash: '0'.repeat(64),
      }),
    ).rejects.toThrow();
    await engine.dispatch({
      action: 'application.authorize',
      id: plan.id,
      expectedHash: plan.payload_hash,
    });
    const completed = (await engine.dispatch({ action: 'application.run', id: plan.id })) as any;
    expect(completed.state).toBe('CONFIRMED');
    expect(submitted).toBe(1);
    await engine.dispatch({ action: 'application.run', id: plan.id });
    expect(submitted).toBe(1);
    const review = (await engine.dispatch({ action: 'application.review', id: plan.id })) as any;
    expect(review.packet.blocks.map((b: any) => b.text).join('\n')).toContain(
      'Tested APIs using SQL',
    );
    expect(review.plan.payload.answers).toEqual({ name: 'Alex Morgan' });
  } finally {
    close();
  }
});
it('stops when employer requirements change after tailoring', async () => {
  let changed = false,
    submitted = 0;
  const { engine, close } = setup({
    executionEnabled: true,
    read: fixtureRead(() => changed),
    adapter: async () =>
      adapter(async () => {
        submitted++;
        throw Error('forbidden');
      }),
  });
  try {
    const p = await packet(engine);
    const f = (await engine.dispatch({
      action: 'application.inspect',
      packetHash: p.packetHash,
    })) as any;
    const plan = (await engine.dispatch({
      action: 'application.stage',
      packetHash: p.packetHash,
      formHash: f.formHash,
      answers: { name: 'Alex' },
      eligibilityConfirmed: true,
    })) as any;
    await engine.dispatch({ action: 'application.policy', enabled: true, dailyLimit: 100 });
    await engine.dispatch({
      action: 'application.authorize',
      id: plan.id,
      expectedHash: plan.payload_hash,
    });
    changed = true;
    await expect(engine.dispatch({ action: 'application.run', id: plan.id })).rejects.toThrow(
      'posting_changed',
    );
    expect(submitted).toBe(0);
    expect(engine.snapshot().plans[0]?.state).toBe('NEEDS_USER');
  } finally {
    close();
  }
});
it('rejects changed PDF bytes and unsupported native actions', async () => {
  const { engine, close } = setup();
  try {
    const p = await packet(engine);
    await expect(
      engine.dispatch({
        action: 'packet.register',
        jobId: p.role.id,
        resume: p.resume,
        packet: p.packet,
        pdfHash: p.pdf.hash,
        pdfBase64: Buffer.from('%PDF-tampered').toString('base64'),
      }),
    ).rejects.toThrow('pdf_changed');
    await expect(engine.dispatch({ action: 'shell', command: 'anything' })).rejects.toThrow();
  } finally {
    close();
  }
});
it('execution is disabled by default even for a complete inspected plan', async () => {
  const { engine, close } = setup();
  try {
    const p = await packet(engine);
    const f = (await engine.dispatch({
      action: 'application.inspect',
      packetHash: p.packetHash,
    })) as any;
    const plan = (await engine.dispatch({
      action: 'application.stage',
      packetHash: p.packetHash,
      formHash: f.formHash,
      answers: { name: 'Alex' },
      eligibilityConfirmed: true,
    })) as any;
    await expect(
      engine.dispatch({
        action: 'application.authorize',
        id: plan.id,
        expectedHash: plan.payload_hash,
      }),
    ).rejects.toThrow('enable_application_execution');
    await expect(
      engine.dispatch({ action: 'application.policy', enabled: true, dailyLimit: 100 }),
    ).rejects.toThrow();
  } finally {
    close();
  }
});

it('records failed sources without claiming complete coverage or losing other matches', async () => {
  const read = fixtureRead();
  const { engine, close } = setup({
    read: async (address: string) =>
      address.includes('himalayas.app')
        ? { url: address, status: 503, headers: {}, body: 'unavailable' }
        : read(address),
  });
  try {
    await packet(engine);
    const state = engine.snapshot();
    expect(state.matches.some((m) => m.title === 'QA Analyst')).toBe(true);
    expect(state.runs.some((r) => r.status === 'failed')).toBe(true);
    expect(state.sources.some((s) => s.lastError)).toBe(true);
  } finally {
    close();
  }
});
it('refuses an Ashby form that resolves to a different role', async () => {
  const { engine, close } = setup({
    adapter: async () => ({
      ...adapter(),
      observe: async () => ({ ...form, url: 'https://jobs.ashbyhq.com/fixture/other-role' }),
    }),
  });
  try {
    const p = await packet(engine);
    await expect(
      engine.dispatch({ action: 'application.inspect', packetHash: p.packetHash }),
    ).rejects.toThrow('application_role_changed');
  } finally {
    close();
  }
});

it('allows a separate pause request to fence a form that is still being filled', async () => {
  let release!: () => void,
    entered!: () => void,
    submitted = 0;
  const filling = new Promise<void>((r) => (entered = r)),
    gate = new Promise<void>((r) => (release = r));
  const { engine, root, close } = setup({
    executionEnabled: true,
    adapter: async () => ({
      ...adapter(),
      fill: async () => {
        entered();
        await gate;
      },
      submit: async () => {
        submitted++;
        throw Error('forbidden');
      },
    }),
  });
  try {
    const p = await packet(engine);
    const f = (await engine.dispatch({
      action: 'application.inspect',
      packetHash: p.packetHash,
    })) as any;
    const plan = (await engine.dispatch({
      action: 'application.stage',
      packetHash: p.packetHash,
      formHash: f.formHash,
      answers: { name: 'Alex' },
      eligibilityConfirmed: true,
    })) as any;
    await engine.dispatch({ action: 'application.policy', enabled: true, dailyLimit: 7 });
    await engine.dispatch({
      action: 'application.authorize',
      id: plan.id,
      expectedHash: plan.payload_hash,
    });
    const running = engine.dispatch({ action: 'application.run', id: plan.id });
    await filling;
    const other = new CareerEngine(root);
    try {
      expect(await other.dispatch({ action: 'application.pause' })).toEqual({
        enabled: false,
        dailyLimit: 7,
      });
    } finally {
      other.close();
    }
    release();
    await running;
    expect(submitted).toBe(0);
    expect(engine.snapshot().policy).toEqual({ enabled: false, dailyLimit: 7 });
  } finally {
    release?.();
    close();
  }
});

it('does not silently replace the PDF attached to an existing packet', async () => {
  const { engine, close } = setup();
  try {
    const p = await packet(engine);
    const bytes = Buffer.concat([Buffer.from(p.pdf.bytes), Buffer.from('\n% second rendition')]);
    await expect(
      engine.dispatch({
        action: 'packet.register',
        jobId: p.role.id,
        resume: p.resume,
        packet: p.packet,
        pdfHash: await digest(bytes),
        pdfBase64: bytes.toString('base64'),
      }),
    ).rejects.toThrow('packet_pdf_changed_prepare_new_packet');
  } finally {
    close();
  }
});

it('uses the canonical posting for lookup when the hosted form adds an application path', async () => {
  const { engine, close } = setup({
    adapter: async () => ({
      ...adapter(),
      observe: async () => ({ ...form, url: form.url + '/application' }),
    }),
  });
  try {
    const p = await packet(engine);
    const inspected = (await engine.dispatch({
      action: 'application.inspect',
      packetHash: p.packetHash,
    })) as any;
    const staged = (await engine.dispatch({
      action: 'application.stage',
      packetHash: p.packetHash,
      formHash: inspected.formHash,
      answers: { name: 'Alex' },
      eligibilityConfirmed: true,
    })) as any;
    expect(staged.payload.jobUrl).toBe(url);
    const found = (await engine.dispatch({
      action: 'application.lookup',
      jobId: p.role.id,
    })) as any;
    expect(found.plan.id).toBe(staged.id);
  } finally {
    close();
  }
});
it('keeps a hundred verbose application records out of the history transport payload', async () => {
  const { engine, root, close } = setup();
  const { ApplicationQueue } = await import('@pursuit/application');
  const queue = new ApplicationQueue(join(root, 'applications.sqlite'));
  const answer = 'A'.repeat(10000);
  let first = '';
  try {
    for (let i = 0; i < 100; i++) {
      const row = await queue.add({
        personId: 'local-user',
        jobUrl: `https://jobs.ashbyhq.com/fixture/role-${i}`,
        packetHash: 'a'.repeat(64),
        pdfHash: 'b'.repeat(64),
        formHash: 'c'.repeat(64),
        answers: {
          one: answer,
          two: answer,
          three: answer,
          four: answer,
          five: answer,
          six: answer,
        },
      });
      if (!first) first = row.id;
    }
    const snapshot = engine.snapshot();
    expect(snapshot.plans).toHaveLength(100);
    expect(JSON.stringify(snapshot).length).toBeLessThan(200000);
    expect(JSON.stringify(snapshot)).not.toContain('A'.repeat(100));
    expect(queue.get(first).payload.answers.one).toBe(answer);
  } finally {
    queue.close();
    close();
  }
});
