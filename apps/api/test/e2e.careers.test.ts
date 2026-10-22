/**
 * Integration e2e — real Postgres (docker compose), real Nest app.
 * Verifies the spec-critical invariants end-to-end:
 *   1. SUBMITTED requires confirmation_ref evidence (PRD).
 *   2. State machine rejects illegal transitions.
 *   3. Cross-tenant isolation (no leaks).
 *   4. Approvals are single-use.
 * Run: pnpm --filter @pursuit/api test:e2e (docker compose must be up)
 */
import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';

process.env.DATABASE_URL ??=
  process.env['DATABASE_URL'] ??
  'postgresql://pursuit:pursuit@127.0.0.1:54329/pursuit?schema=public';

jest.setTimeout(90_000);

let app: INestApplication;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  await app.init();
});

afterAll(async () => {
  await app.close();
});

interface Login {
  token: string;
  tenant_id: string;
}

async function login(email: string): Promise<Login> {
  const res = await supertest
    .agent(app.getHttpServer())
    .post('/api/v1/auth/dev-login')
    .send({ email, display_name: `Test ${email.split('@')[0]}` })
    .expect(201);
  return { token: res.body.token, tenant_id: res.body.tenant_id };
}

function api(token: string) {
  return supertest.agent(app.getHttpServer()).set('Authorization', `Bearer ${token}`);
}

const JOB = {
  company_name: 'E2E Testing Company',
  title: 'Integration Engineer',
  location: 'Remote',
  remote_restrictions: 'Worldwide',
  source_url: 'https://jobs.example-e2e.com/integration-engineer',
  description: 'Build test infrastructure. Mentions TypeScript and CI.',
  compensation: '$120,000 base',
};

/** Drives app from DISCOVERED to APPLYING via legal transitions. */
async function driveToApplying(token: string, id: string): Promise<void> {
  const chain = ['VERIFIED', 'QUALIFIED', 'DRAFTING', 'READY_FOR_REVIEW', 'APPROVED', 'APPLYING'];
  for (const to of chain) {
    await api(token).patch(`/api/v1/applications/${id}/status`).send({ to_status: to }).expect(200);
  }
}

describe('SUBMITTED evidence gate', () => {
  let a: Login;

  beforeAll(async () => {
    a = await login(`e2e-tenant-a-${Date.now()}@pursuit.test`);
  });

  const stamp = Date.now();

  it('creates a job and dedupes a second identical intake', async () => {
    const first = await api(a.token)
      .post('/api/v1/jobs')
      .send({
        ...JOB,
        company_name: `E2E Testing ${stamp}`,
        source_url: `https://jobs.example-e2e.com/integration-engineer-${stamp}`,
      })
      .expect(201);
    expect(first.body.deduped).toBe(false);
    expect(first.body.match).toBeDefined();

    const second = await api(a.token)
      .post('/api/v1/jobs')
      .send({
        ...JOB,
        company_name: `E2E Testing ${stamp}`,
        source_url: `https://jobs.example-e2e.com/integration-engineer-${stamp}?ref=x`,
      })
      .expect(201);
    expect(second.body.deduped).toBe(true);
    expect(second.body.job.id).toBe(first.body.job.id);
  });

  it('rejects SUBMITTED without confirmation_ref', async () => {
    const job = await api(a.token)
      .post('/api/v1/jobs')
      .send({
        ...JOB,
        title: 'Evidence Gate Engineer',
        source_url: 'https://jobs.example-e2e.com/evidence-gate',
      });
    const appId = (
      await api(a.token).post('/api/v1/applications').send({ job_id: job.body.job.id }).expect(201)
    ).body.application.id;
    await driveToApplying(a.token, appId);
    const res = await api(a.token)
      .patch(`/api/v1/applications/${appId}/status`)
      .send({ to_status: 'SUBMITTED' })
      .expect(403);
    expect(res.body.error).toBe('confirmation_required');
  });

  it('rejects illegal transition DISCOVERED → SUBMITTED', async () => {
    const job = await api(a.token)
      .post('/api/v1/jobs')
      .send({
        ...JOB,
        title: 'Illegal Transition Engineer',
        source_url: 'https://jobs.example-e2e.com/illegal-transition',
      });
    const appId = (
      await api(a.token).post('/api/v1/applications').send({ job_id: job.body.job.id }).expect(201)
    ).body.application.id;
    const res = await api(a.token)
      .patch(`/api/v1/applications/${appId}/status`)
      .send({ to_status: 'SUBMITTED', confirmation_ref: 'email-confirmation-42' })
      .expect(403);
    expect(res.body.error).toBe('transition_not_allowed');
    expect(res.body.detail).toContain('DISCOVERED → SUBMITTED');
  });

  it('accepts SUBMITTED with confirmation evidence and records the event', async () => {
    const job = await api(a.token)
      .post('/api/v1/jobs')
      .send({
        ...JOB,
        title: 'Happy Path Engineer',
        source_url: 'https://jobs.example-e2e.com/happy-path',
      });
    const appId = (
      await api(a.token).post('/api/v1/applications').send({ job_id: job.body.job.id }).expect(201)
    ).body.application.id;
    await driveToApplying(a.token, appId);
    await api(a.token)
      .patch(`/api/v1/applications/${appId}/status`)
      .send({ to_status: 'SUBMITTED', confirmation_ref: 'email-confirmation-happy' })
      .expect(200);
    const detail = await api(a.token).get(`/api/v1/applications/${appId}`).expect(200);
    expect(detail.body.application.status).toBe('SUBMITTED');
    expect(detail.body.events.at(-1).to_status).toBe('SUBMITTED');
    expect(detail.body.events.at(-1).evidence_key).toBe('email-confirmation-happy');
  });
});

describe('cross-tenant isolation', () => {
  it('cannot read or mutate another tenant’s application', async () => {
    const tenantA = await login(`e2e-iso-a-${Date.now()}@pursuit.test`);
    const tenantB = await login(`e2e-iso-b-${Date.now()}@pursuit.test`);

    const job = await api(tenantA.token)
      .post('/api/v1/jobs')
      .send({
        ...JOB,
        title: 'Isolation Engineer',
        source_url: `https://jobs.example-e2e.com/isolation-${Date.now()}`,
      });
    const appId = (
      await api(tenantA.token)
        .post('/api/v1/applications')
        .send({ job_id: job.body.job.id })
        .expect(201)
    ).body.application.id;

    await api(tenantB.token).get(`/api/v1/applications/${appId}`).expect(404);
    await api(tenantB.token)
      .patch(`/api/v1/applications/${appId}/status`)
      .send({ to_status: 'VERIFIED' })
      .expect(404);

    const bList = await api(tenantB.token).get('/api/v1/applications').expect(200);
    expect(bList.body.items).toHaveLength(0);
  });
});

describe('approval single-use lifecycle', () => {
  it('consumes an approval exactly once', async () => {
    const a = await login(`e2e-appr-${Date.now()}@pursuit.test`);

    const job = await api(a.token)
      .post('/api/v1/jobs')
      .send({
        ...JOB,
        title: 'Approval Engineer',
        source_url: `https://jobs.example-e2e.com/approval-${Date.now()}`,
      });
    const appId = (
      await api(a.token).post('/api/v1/applications').send({ job_id: job.body.job.id }).expect(201)
    ).body.application.id;
    await driveToApplying(a.token, appId);

    // agent run (dev runtime) gives the approval a valid entity ref
    const run = await api(a.token)
      .post('/api/v1/agent/runs')
      .send({
        goal: 'Prepare the submission payload for the application',
        allowed_tools: [],
        context_refs: [],
      })
      .expect(201);
    const runRow = await api(a.token).get(`/api/v1/agent/runs/${run.body.run.id}`).expect(200);

    const approval = await api(a.token)
      .post('/api/v1/approvals')
      .send({
        action_type: 'SUBMIT_APPLICATION',
        entity_id: runRow.body.run.id,
        preview: {
          destination: 'https://jobs.example-e2e.com/approval-apply',
          recipient: null,
          summary: 'Submit application for Approval Engineer',
          answers: [],
          attachments: ['resume_v1.pdf'],
          payload_hash: 'placeholder-sha256',
        },
        ttl_minutes: 30,
      })
      .expect(201);
    expect(approval.body.approval.status).toBe('PENDING');

    // un-approved evidence rejected
    await api(a.token)
      .patch(`/api/v1/applications/${appId}/status`)
      .send({
        to_status: 'SUBMITTED',
        confirmation_ref: 'conf-1',
        evidence_key: approval.body.approval.id,
      })
      .expect(403);

    await api(a.token)
      .post(`/api/v1/approvals/${approval.body.approval.id}/decision`)
      .send({ decision: 'approve' })
      .expect(201);

    // first use succeeds and consumes it
    await api(a.token)
      .patch(`/api/v1/applications/${appId}/status`)
      .send({
        to_status: 'SUBMITTED',
        confirmation_ref: 'conf-1',
        evidence_key: approval.body.approval.id,
      })
      .expect(200);

    // second application in APPLYING tries the same evidence → rejected as used
    const job2 = await api(a.token)
      .post('/api/v1/jobs')
      .send({
        ...JOB,
        title: 'Approval Reuse Engineer',
        source_url: `https://jobs.example-e2e.com/approval-reuse-${Date.now()}`,
      });
    const appId2 = (
      await api(a.token).post('/api/v1/applications').send({ job_id: job2.body.job.id }).expect(201)
    ).body.application.id;
    await driveToApplying(a.token, appId2);
    const res = await api(a.token)
      .patch(`/api/v1/applications/${appId2}/status`)
      .send({
        to_status: 'SUBMITTED',
        confirmation_ref: 'conf-2',
        evidence_key: approval.body.approval.id,
      })
      .expect(403);
    expect(res.body.error).toBe('approval_already_used');
  });
});

describe('watcher configuration integrity', () => {
  it('validates patches and reschedules enabled watchers with the new interval', async () => {
    const owner = await login(`watcher-owner-${Date.now()}@pursuit.test`);
    const other = await login(`watcher-other-${Date.now()}@pursuit.test`);
    const created = await api(owner.token)
      .post('/api/v1/watchers')
      .send({
        kind: 'COMPANY_URL',
        source_url: 'https://example.com/careers',
        frequency_minutes: 60,
      })
      .expect(201);
    const id = created.body.watcher.id;
    for (const patch of [
      { frequency_minutes: -1 },
      {},
      { frequency_minutes: 15.5 },
      { enabled: 'yes' },
      { unknown: true },
    ]) {
      await api(owner.token).patch(`/api/v1/watchers/${id}`).send(patch).expect(400);
    }
    await api(other.token).patch(`/api/v1/watchers/${id}`).send({ enabled: false }).expect(404);
    const before = Date.now();
    const changed = await api(owner.token)
      .patch(`/api/v1/watchers/${id}`)
      .send({ frequency_minutes: 30 })
      .expect(200);
    expect(changed.body.watcher.enabled).toBe(true);
    expect(new Date(changed.body.watcher.next_check_at).getTime()).toBeGreaterThanOrEqual(
      before + 30 * 60000,
    );
    expect(new Date(changed.body.watcher.next_check_at).getTime()).toBeLessThan(
      Date.now() + 31 * 60000,
    );
    const initiallyDisabled = await api(owner.token)
      .post('/api/v1/watchers')
      .send({
        kind: 'COMPANY_URL',
        source_url: 'https://example.com/disabled',
        enabled: false,
      })
      .expect(201);
    expect(initiallyDisabled.body.watcher.next_check_at).toBeNull();
    const disabled = await api(owner.token)
      .patch(`/api/v1/watchers/${id}`)
      .send({ enabled: false })
      .expect(200);
    expect(disabled.body.watcher.next_check_at).toBeNull();
  });
});
