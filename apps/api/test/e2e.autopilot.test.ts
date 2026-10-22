import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { randomBytes } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { AutopilotService, AutopilotSettings } from '../src/autopilot.service';
import { WorkflowService } from '../src/workflow.service';
import { CareersService } from '../src/careers.service';
import { ConnectionsService } from '../src/connections.service';
import { DbService } from '../src/db.service';
import { GlobalExceptionFilter } from '../src/http-error.filter';

process.env['DATABASE_URL'] ??=
  'postgresql://pursuit:pursuit@127.0.0.1:54329/pursuit?schema=public';

describe('persistent opt-in autopilot (real Postgres, external providers mocked)', () => {
  let app: INestApplication,
    db: DbService,
    service: AutopilotService,
    workflow: WorkflowService,
    careers: CareersService,
    connections: ConnectionsService;
  let token: string,
    other: string,
    tenant: string,
    user: string,
    otherTenant: string,
    connection: string;
  let source: jest.SpyInstance;
  const stamp = Date.now();
  const oldKey = process.env['CONNECTION_ENCRYPTION_KEY'];
  const resume =
    'Fictional engineer. Built TypeScript services and supported a PostgreSQL application.';
  const api = (t = token) =>
    supertest.agent(app.getHttpServer()).set('Authorization', `Bearer ${t}`);
  const draft = {
    resume,
    cover_letter: 'I build TypeScript services and would welcome a discussion.',
    match_explanation: 'TypeScript is supported by the resume.',
    gaps: [],
    outreach: {
      subject: 'Engineering conversation',
      body: 'Hello, I build TypeScript services and would welcome a conversation.',
    },
  };
  beforeAll(async () => {
    process.env['CONNECTION_ENCRYPTION_KEY'] = randomBytes(32).toString('hex');
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    db = app.get(DbService);
    service = app.get(AutopilotService);
    workflow = app.get(WorkflowService);
    careers = app.get(CareersService);
    connections = app.get(ConnectionsService);
    for (const isOther of [false, true]) {
      const res = await supertest(app.getHttpServer())
        .post('/api/v1/auth/dev-login')
        .send({
          email: `auto-${isOther}-${stamp}@pursuit.test`,
          display_name: 'Fictional Autopilot Tester',
        })
        .expect(201);
      if (isOther) {
        other = res.body.token;
        otherTenant = res.body.tenant_id;
      } else {
        token = res.body.token;
        tenant = res.body.tenant_id;
        user = res.body.user.id;
      }
    }
    await careers.getProfile(user, tenant);
    await db.db.careerProfile.update({
      where: { tenantId_userId: { tenantId: tenant, userId: user } },
      data: {
        roleFamilies: ['Software Engineer'],
        workAuthorization: [{ jurisdiction: 'US', status: 'authorized', verified: true }],
      },
    });
    jest.spyOn(connections.gateway, 'models').mockResolvedValue(['test-model']);
    jest
      .spyOn(connections.gateway, 'generate')
      .mockImplementation(async (_p, _k, _m, prompt) =>
        prompt.startsWith('Connection test') ? 'PURSUIT_OK' : JSON.stringify(draft),
      );
    const connected = await api()
      .post('/api/v1/connections/models')
      .send({ provider: 'openai', api_key: 'fictional-key' });
    // Use the service for provider setup to keep this suite independent of the connection route shape.
    if (connected.status === 201) connection = connected.body.id;
    else
      connection = (
        await connections.connect(
          { userId: user, tenantId: tenant, email: 'test', displayName: 'test', sessionId: 'test' },
          'openai',
          'fictional-key',
        )
      ).id;
    await connections.test(
      { userId: user, tenantId: tenant, email: 'test', displayName: 'test', sessionId: 'test' },
      connection,
      'test-model',
    );
    source = jest.spyOn(workflow, 'discover').mockImplementation(async (a, board) => ({
      items: [
        await careers.intakeJob(a.tenantId, {
          company_name: `Fictional Auto ${stamp} ${board}`,
          title: 'Software Engineer',
          source_url: `https://autopilot.example/${stamp}/${board}`,
          description: 'Build TypeScript services.',
          location: 'Remote',
        }),
      ],
      imported: 1,
      total_available: 1,
      limit: 25,
    }));
  });
  afterAll(async () => {
    jest.restoreAllMocks();
    await db.db.workflowDraft.deleteMany({ where: { tenantId: tenant } });
    await db.db.tenant.deleteMany({ where: { id: { in: [tenant, otherTenant] } } });
    await db.db.user.deleteMany({ where: { email: { endsWith: `${stamp}@pursuit.test` } } });
    const companies = await db.db.company.findMany({
      where: { name: { startsWith: `Fictional Auto ${stamp}` } },
    });
    await db.db.job.deleteMany({ where: { companyId: { in: companies.map((c) => c.id) } } });
    await db.db.company.deleteMany({ where: { id: { in: companies.map((c) => c.id) } } });
    if (oldKey === undefined) delete process.env['CONNECTION_ENCRYPTION_KEY'];
    else process.env['CONNECTION_ENCRYPTION_KEY'] = oldKey;
    await app.close();
  });
  async function save(extra: Record<string, unknown> = {}) {
    const current = await api().get('/api/v1/autopilot').expect(200);
    return api()
      .put('/api/v1/autopilot')
      .send({ ...current.body.settings, boards: ['test-board'], min_fit: 0, ...extra });
  }
  it('defaults off, isolates owners, and rejects unsupported application mode and unsafe sources', async () => {
    const own = await api().get('/api/v1/autopilot').expect(200);
    expect(own.body.settings.enabled).toBe(false);
    expect(own.body.capabilities.apply).toBe(false);
    await save({ mode: 'apply', enabled: true }).then((r) => expect(r.status).toBe(400));
    await save({ boards: ['https://internal.example/secret'] }).then((r) =>
      expect(r.status).toBe(400),
    );
    await save({ enabled: true }).then((r) => expect(r.status).toBe(200));
    expect((await api(other).get('/api/v1/autopilot').expect(200)).body.settings.enabled).toBe(
      false,
    );
  });
  it('claims one background run across competing workers and persists completion notifications', async () => {
    const competitor = new AutopilotService(db, workflow, careers, connections);
    source.mockClear();
    await Promise.all([service.tick(), competitor.tick()]);
    expect(source).toHaveBeenCalledTimes(1);
    const status = await api().get('/api/v1/autopilot').expect(200);
    expect(status.body.runs[0]).toMatchObject({ status: 'COMPLETED', discovered: 1, prepared: 0 });
    expect(new Date(status.body.next_run_at).getTime()).toBeGreaterThan(Date.now());
    const notifications = await api().get('/api/v1/notifications').expect(200);
    expect(notifications.body.items.some((n: any) => n.type === 'AUTOPILOT_COMPLETED')).toBe(true);
    const otherNotes = await api(other).get('/api/v1/notifications').expect(200);
    expect(otherNotes.body.items.some((n: any) => n.type === 'AUTOPILOT_COMPLETED')).toBe(false);
  });
  it('prepares one draft per opportunity and never submits it', async () => {
    await save({ mode: 'prepare', enabled: true, connection_id: connection, resume }).then((r) =>
      expect(r.status).toBe(200),
    );
    await service.tick();
    expect(await db.db.workflowDraft.count({ where: { tenantId: tenant, userId: user } })).toBe(1);
    await api().post('/api/v1/autopilot/run').send({}).expect(201);
    await service.tick();
    expect(await db.db.workflowDraft.count({ where: { tenantId: tenant, userId: user } })).toBe(1);
    expect(
      await db.db.application.count({ where: { tenantId: tenant, status: 'SUBMITTED' } }),
    ).toBe(0);
  });
  it('fences pause during model generation so no draft is saved after pause', async () => {
    await save({
      boards: ['pause-board'],
      mode: 'prepare',
      enabled: true,
      connection_id: connection,
      resume,
    }).then((r) => expect(r.status).toBe(200));
    const generate = jest.spyOn(connections, 'generate');
    generate.mockImplementationOnce(async () => {
      await api().post('/api/v1/autopilot/pause').send({}).expect(201);
      return { provider: 'openai' as const, model: 'test-model', text: JSON.stringify(draft) };
    });
    await service.tick();
    expect(await db.db.workflowDraft.count({ where: { tenantId: tenant, userId: user } })).toBe(1);
    const state = await api().get('/api/v1/autopilot').expect(200);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(state.body.settings.enabled).toBe(false);
    expect(state.body.next_run_at).toBeNull();
    expect(state.body.runs[0].status).toBe('PAUSED');
    generate.mockRestore();
  });
  it('does not overwrite a newer schedule when an older request finishes', async () => {
    await save({
      boards: ['revision-board'],
      enabled: true,
      mode: 'prepare',
      connection_id: connection,
      resume,
    }).then((r) => expect(r.status).toBe(200));
    const generate = jest.spyOn(connections, 'generate').mockImplementationOnce(async () => {
      await save({ enabled: true, mode: 'research', interval_minutes: 60 }).then((r) =>
        expect(r.status).toBe(200),
      );
      return { provider: 'openai', model: 'test-model', text: JSON.stringify(draft) };
    });
    await service.tick();
    const state = await api().get('/api/v1/autopilot').expect(200);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(state.body.settings.enabled).toBe(true);
    expect(new Date(state.body.next_run_at).getTime()).toBeLessThanOrEqual(Date.now());
    expect(state.body.running).toBe(false);
    generate.mockRestore();
  });
  it('counts failed model requests toward the per-run preparation limit', async () => {
    await save({
      boards: ['budget-board'],
      enabled: true,
      mode: 'prepare',
      connection_id: connection,
      resume,
      max_drafts: 1,
    }).then((r) => expect(r.status).toBe(200));
    source.mockImplementationOnce(async (a, board) => {
      const items = [];
      for (let i = 0; i < 3; i++)
        items.push(
          await careers.intakeJob(a.tenantId, {
            company_name: `Fictional Auto ${stamp} ${board}-${i}`,
            title: 'Software Engineer',
            source_url: `https://autopilot.example/${stamp}/budget-${i}`,
            description: 'Build services',
            location: 'Remote',
          }),
        );
      return { items, imported: 3, total_available: 3, limit: 25 };
    });
    const generate = jest
      .spyOn(connections, 'generate')
      .mockRejectedValue(new Error('provider unavailable'));
    await service.tick();
    expect(generate).toHaveBeenCalledTimes(1);
    const state = await api().get('/api/v1/autopilot').expect(200);
    expect(state.body.runs[0]).toMatchObject({ status: 'PARTIAL', prepared: 0, skipped: 2 });
    generate.mockRestore();
  });
  it('records source failures instead of reporting success and recovers stale leases', async () => {
    await save({ enabled: true, mode: 'research' }).then((r) => expect(r.status).toBe(200));
    await db.db.autopilotConfig.updateMany({
      where: { tenantId: tenant, userId: user },
      data: { leaseToken: 'dead-worker', leaseUntil: new Date(Date.now() - 1000) },
    });
    source.mockRejectedValueOnce(new Error('unavailable'));
    await service.tick();
    const state = await api().get('/api/v1/autopilot').expect(200);
    expect(state.body.runs[0].status).toBe('PARTIAL');
    expect(state.body.runs[0].summary).toContainEqual({
      board: 'test-board',
      status: 'SOURCE_FAILED',
    });
  });
  it('rejects stale settings writes and empty enabled source lists', async () => {
    await save({ revision: 1 }).then((r) => expect(r.status).toBe(409));
    await save({ boards: [], enabled: true }).then((r) => expect(r.status).toBe(400));
    await api().post('/api/v1/autopilot/pause').send({}).expect(201);
    source.mockClear();
    await service.tick();
    expect(source).not.toHaveBeenCalled();
  });
});
