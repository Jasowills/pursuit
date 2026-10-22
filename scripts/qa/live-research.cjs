// Explicit live read-only Greenhouse smoke test; never submits applications or email.
const { writeFileSync } = require('node:fs');
const target = new URL(process.env.DATABASE_URL || 'postgresql://invalid');
if (target.hostname !== '127.0.0.1' || target.port !== '55439' || target.pathname !== '/pursuit_qa')
  throw Error('Disposable QA database required');
process.env.NODE_ENV = 'test';
process.env.AUTOPILOT_WORKER_ENABLED = 'false';
require('../../apps/api/node_modules/reflect-metadata');
const { Test } = require('../../apps/api/node_modules/@nestjs/testing');
const request = require('../../apps/api/node_modules/supertest');
const { AppModule } = require('../../apps/api/dist/app.module');
const { AutopilotService } = require('../../apps/api/dist/autopilot.service');
(async () => {
  let app;
  try {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/dev-login')
      .send({ email: `live-research-${Date.now()}@pursuit.test`, display_name: 'Research audit' })
      .expect(201);
    const api = () =>
      request.agent(app.getHttpServer()).set('Authorization', `Bearer ${login.body.token}`);
    const status = await api().get('/api/v1/autopilot').expect(200);
    await api()
      .put('/api/v1/autopilot')
      .send({
        ...status.body.settings,
        enabled: true,
        mode: 'research',
        boards: ['cloudflare'],
        min_fit: 0,
      })
      .expect(200);
    await api().post('/api/v1/autopilot/run').expect(201);
    await app.get(AutopilotService).tick();
    const done = await api().get('/api/v1/autopilot').expect(200);
    const run = done.body.runs[0];
    if (!run || run.status !== 'COMPLETED')
      throw Error(`Research did not complete: ${JSON.stringify(run)}`);
    const jobs = await api().get('/api/v1/jobs').expect(200);
    if (jobs.body.items.length !== 25) throw Error('Expected bounded persisted import');
    const applications = await api().get('/api/v1/applications').expect(200);
    if (applications.body.items.length) throw Error('Research created an application');
    const notes = await api().get('/api/v1/notifications').expect(200);
    await api().post('/api/v1/autopilot/pause').expect(201);
    const result = {
      status: run.status,
      mode: done.body.settings.mode,
      discovered: run.discovered,
      prepared: run.prepared,
      skipped: run.skipped,
      jobs_persisted: jobs.body.items.length,
      applications_created: applications.body.items.length,
      notifications: notes.body.items.length,
      external_actions: 'read-only Greenhouse, no model/mail/submission',
    };
    writeFileSync('docs/qa/evidence/live-research.json', JSON.stringify(result, null, 2));
    console.log(result);
  } finally {
    await app?.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
