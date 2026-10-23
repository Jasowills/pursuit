import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { randomBytes } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { ConnectionsService } from '../src/connections.service';
import { GmailService } from '../src/gmail.service';
import { DbService } from '../src/db.service';
import { GlobalExceptionFilter } from '../src/http-error.filter';

process.env['DATABASE_URL'] ??=
  'postgresql://pursuit:pursuit@127.0.0.1:54329/pursuit?schema=public';

describe('BYOM career workflow (real Postgres, mocked external services)', () => {
  let app: INestApplication;
  let connections: ConnectionsService;
  let gmail: GmailService;
  let db: DbService;
  let token: string;
  let other: string;
  let tenant: string;
  let otherTenant: string;
  let connectionId: string;
  let draftId: string;
  let content: any;
  let send: jest.SpyInstance;
  const previous = process.env['CONNECTION_ENCRYPTION_KEY'];
  const stamp = Date.now();
  const generated = {
    resume: 'Fictional Tester\nBuilt TypeScript services and PostgreSQL workflows.',
    cover_letter: 'I build TypeScript services and would welcome a conversation.',
    match_explanation:
      'TypeScript is supported by the supplied resume. Work authorization is unknown.',
    gaps: ['Work authorization requires verification.'],
    outreach: {
      subject: 'Engineering role conversation',
      body: 'Hello, I build TypeScript services. Could we discuss this role?',
    },
  };
  const api = (t = token) =>
    supertest.agent(app.getHttpServer()).set('Authorization', `Bearer ${t}`);

  beforeAll(async () => {
    process.env['CONNECTION_ENCRYPTION_KEY'] = randomBytes(32).toString('hex');
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    connections = app.get(ConnectionsService);
    gmail = app.get(GmailService);
    db = app.get(DbService);
    jest.spyOn(connections.gateway, 'models').mockResolvedValue(['gpt-test']);
    jest
      .spyOn(connections.gateway, 'generate')
      .mockImplementation(async (_p, _k, _m, prompt) =>
        prompt.startsWith('Connection test') ? 'PURSUIT_OK' : JSON.stringify(generated),
      );
    jest.spyOn(gmail, 'configured').mockReturnValue(true);
    jest
      .spyOn(gmail, 'account')
      .mockResolvedValue({ id: 'test-account', status: 'ACTIVE', disabled: false });
    send = jest.spyOn(gmail, 'send').mockResolvedValue('mock-receipt-not-live');
    const a = await supertest(app.getHttpServer())
      .post('/api/v1/auth/dev-login')
      .send({ email: `workflow-${stamp}@pursuit.test`, display_name: 'Fictional Workflow Tester' })
      .expect(201);
    const b = await supertest(app.getHttpServer())
      .post('/api/v1/auth/dev-login')
      .send({ email: `workflow-other-${stamp}@pursuit.test`, display_name: 'Other Tester' })
      .expect(201);
    token = a.body.token;
    tenant = a.body.tenant_id;
    other = b.body.token;
    otherTenant = b.body.tenant_id;
    await api().get('/api/v1/profile').expect(200);
  });
  afterAll(async () => {
    jest.restoreAllMocks();
    if (db) {
      await db.db.workflowDraft.deleteMany({ where: { tenantId: { in: [tenant, otherTenant] } } });
      await db.db.userConnection.deleteMany({ where: { tenantId: { in: [tenant, otherTenant] } } });
      await db.db.tenant.deleteMany({ where: { id: { in: [tenant, otherTenant] } } });
    }
    await app?.close();
    if (previous === undefined) delete process.env['CONNECTION_ENCRYPTION_KEY'];
    else process.env['CONNECTION_ENCRYPTION_KEY'] = previous;
  });

  it('stores a user-owned encrypted connection and requires an inference test', async () => {
    const created = await api()
      .post('/api/v1/connections/models')
      .send({ provider: 'openai', api_key: 'test-key-never-echo' })
      .expect(201);
    connectionId = created.body.id;
    const listed = await api().get('/api/v1/connections/models').expect(200);
    expect(JSON.stringify(listed.body)).not.toContain('test-key-never-echo');
    expect(JSON.stringify(listed.body)).not.toContain('ciphertext');
    expect(
      (await db.db.userConnection.findUniqueOrThrow({ where: { id: connectionId } })).ciphertext,
    ).not.toContain('test-key-never-echo');
    await api(other)
      .post(`/api/v1/connections/models/${connectionId}/test`)
      .send({ model: 'gpt-test' })
      .expect(404);
    await api()
      .post(`/api/v1/connections/models/${connectionId}/test`)
      .send({ model: 'not-in-catalog' })
      .expect(400);
    await api()
      .post(`/api/v1/connections/models/${connectionId}/test`)
      .send({ model: 'gpt-test' })
      .expect(201);
  });
  it('prepares and persists materials and prevents cross-user access', async () => {
    const job = await api()
      .post('/api/v1/jobs')
      .send({
        title: 'Workflow Engineer',
        company_name: `Fictional Workflow ${stamp}`,
        source_url: `https://example.test/workflow-${stamp}`,
        description: 'Build TypeScript services.',
      })
      .expect(201);
    const draft = await api()
      .post('/api/v1/workflow')
      .send({
        job_id: job.body.job.id,
        connection_id: connectionId,
        resume: 'Fictional Tester has built TypeScript services and PostgreSQL workflows.',
      })
      .expect(201);
    draftId = draft.body.id;
    content = draft.body.content;
    expect(content.resume).toBe(
      'Fictional Tester has built TypeScript services and PostgreSQL workflows.',
    );
    expect(content.resume).not.toBe(generated.resume);
    expect(draft.body.status).toBe('DRAFT');
    await api(other).get(`/api/v1/workflow/${draftId}`).expect(404);
    expect((await api(other).get('/api/v1/workflow').expect(200)).body.items).toEqual([]);
    await api().post(`/api/v1/workflow/${draftId}/send`).expect(409);
    expect(send).not.toHaveBeenCalled();
  });
  it('binds approvals to saved content and invalidates them on edit', async () => {
    content.recipient = 'verified@example.test';
    await api().patch(`/api/v1/workflow/${draftId}`).send(content).expect(200);
    let preview = await api().get(`/api/v1/workflow/${draftId}`).expect(200);
    await api()
      .post(`/api/v1/workflow/${draftId}/approve`)
      .send({ payload_hash: '0'.repeat(64) })
      .expect(409);
    await api()
      .post(`/api/v1/workflow/${draftId}/approve`)
      .send({ payload_hash: preview.body.payload_hash })
      .expect(201);
    content.outreach.body += ' Updated after review.';
    await api().patch(`/api/v1/workflow/${draftId}`).send(content).expect(200);
    await api().post(`/api/v1/workflow/${draftId}/send`).expect(409);
    preview = await api().get(`/api/v1/workflow/${draftId}`).expect(200);
    expect(preview.body.draft.status).toBe('DRAFT');
    await api()
      .post(`/api/v1/workflow/${draftId}/approve`)
      .send({ payload_hash: preview.body.payload_hash })
      .expect(201);
  });
  it('consumes an approval only once under concurrent sends', async () => {
    const responses = await Promise.all([
      api().post(`/api/v1/workflow/${draftId}/send`),
      api().post(`/api/v1/workflow/${draftId}/send`),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(send).toHaveBeenCalledTimes(1);
    const row = await db.db.workflowDraft.findUniqueOrThrow({ where: { id: draftId } });
    expect(row.status).toBe('SENT');
    expect(row.receipt).toBe('mock-receipt-not-live');
    await api().patch(`/api/v1/workflow/${draftId}`).send(content).expect(409);
  });
  it('locks ambiguous delivery and never retries it', async () => {
    const original = await db.db.workflowDraft.findUniqueOrThrow({ where: { id: draftId } });
    const copy = await db.db.workflowDraft.create({
      data: {
        tenantId: tenant,
        userId: original.userId,
        jobId: original.jobId,
        connectionId,
        model: original.model,
        sourceResume: original.sourceResume,
        content: original.content as any,
      },
    });
    const preview = await api().get(`/api/v1/workflow/${copy.id}`).expect(200);
    await api()
      .post(`/api/v1/workflow/${copy.id}/approve`)
      .send({ payload_hash: preview.body.payload_hash })
      .expect(201);
    send.mockRejectedValueOnce(new Error('timeout after provider may have accepted'));
    await api().post(`/api/v1/workflow/${copy.id}/send`).expect(502);
    expect((await db.db.workflowDraft.findUniqueOrThrow({ where: { id: copy.id } })).status).toBe(
      'NEEDS_VERIFICATION',
    );
    await api().post(`/api/v1/workflow/${copy.id}/send`).expect(409);
    expect(send).toHaveBeenCalledTimes(2);
  });
});
