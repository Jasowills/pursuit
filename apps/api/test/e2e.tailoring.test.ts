import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/http-error.filter';
import { ConnectionsService } from '../src/connections.service';
const source =
  'Alex Morgan\nalex@example.com\n\nExperience\nExample | QA Analyst | 2022-2025\n- Tested APIs with SQL.\n- Edited internal training videos.\n\nEducation\nBA Design | Example University | 2020';
describe('document to persisted PDF packet (isolated DB/storage)', () => {
  let app: INestApplication,
    token: string,
    other: string,
    master: string,
    sourceHash: string,
    job: string,
    packet: string,
    storage: string;
  const stamp = Date.now();
  const req = (t = token) =>
    supertest.agent(app.getHttpServer()).set('Authorization', `Bearer ${t}`);
  beforeAll(async () => {
    storage = await mkdtemp(join(tmpdir(), 'pursuit-tailor-api-'));
    process.env.RESUME_STORAGE_DIR = storage;
    process.env.APPLICATION_STORAGE_DIR = join(storage, 'applications');
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    for (const isOther of [false, true]) {
      const r = await supertest(app.getHttpServer())
        .post('/api/v1/auth/dev-login')
        .send({ email: `tailor-${isOther}-${stamp}@pursuit.test`, display_name: 'Tailoring QA' })
        .expect(201);
      if (isOther) other = r.body.token;
      else token = r.body.token;
    }
    await req().get('/api/v1/profile').expect(200);
    const imported = await req()
      .post('/api/v1/jobs')
      .send({
        company_name: `Tailoring Example ${stamp}`,
        title: 'QA Analyst',
        source_url: `https://example.com/tailor-${stamp}`,
        description: 'Test APIs with SQL.',
        location: 'United States',
      })
      .expect(201);
    job = imported.body.job.id;
  });
  afterAll(async () => {
    await app?.close();
    await rm(storage, { recursive: true, force: true });
  });
  it('imports a document in a worker with review pending', async () => {
    const r = await req()
      .post('/api/v1/tailoring/sources')
      .attach('file', Buffer.from(source), 'resume.txt')
      .expect(201);
    master = r.body.id;
    sourceHash = r.body.resume.sourceId;
    expect(r.body.resume.reviewedAt).toBeNull();
  });
  it('rejects other-user access and preparation before review', async () => {
    await req(other).get(`/api/v1/tailoring/sources/${master}`).expect(404);
    const r = await req().post('/api/v1/tailoring/packets').send({ masterId: master, jobId: job });
    expect(r.status).toBe(400);
  });
  it('requires exact source revision and explicit confirmation', async () => {
    await req()
      .post(`/api/v1/tailoring/sources/${master}/review`)
      .send({ text: source, expectedHash: 'a'.repeat(64), confirmed: true })
      .expect(409);
    await req()
      .post(`/api/v1/tailoring/sources/${master}/review`)
      .send({ text: source, expectedHash: sourceHash, confirmed: false })
      .expect(400);
    await req()
      .post(`/api/v1/tailoring/sources/${master}/review`)
      .send({ text: source, expectedHash: sourceHash, confirmed: true })
      .expect(201);
  });
  it('prepares, saves and reuses a PDF with zero inference calls', async () => {
    const spy = jest.spyOn(app.get(ConnectionsService), 'generate');
    const result = await req()
      .post('/api/v1/tailoring/packets')
      .send({
        masterId: master,
        jobId: job,
        voice: { tone: 'direct', motivation: 'I enjoy reliable releases.' },
      })
      .expect(201);
    packet = result.body.id;
    expect(
      result.body.packet.blocks.every((b: any) => source.slice(b.start, b.end) === b.text),
    ).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    const again = await req()
      .post('/api/v1/tailoring/packets')
      .send({
        masterId: master,
        jobId: job,
        voice: { tone: 'direct', motivation: 'I enjoy reliable releases.' },
      })
      .expect(201);
    expect(again.body.id).toBe(packet);
    expect(again.body.cached).toBe(true);
    spy.mockRestore();
  });
  it('retains the original import bytes and denies other owners', async () => {
    const r = await req().get(`/api/v1/tailoring/sources/${master}/original`).expect(200);
    expect(Buffer.from(r.body).toString()).toBe(source);
    await req(other).get(`/api/v1/tailoring/sources/${master}/original`).expect(404);
  });
  it('does not save a model plan containing invented fact IDs', async () => {
    const spy = jest.spyOn(app.get(ConnectionsService), 'generate').mockResolvedValueOnce({
      text: '{"selectedIds":["invented-employer"]}',
      provider: 'ollama',
      model: 'fixture',
    });
    await req()
      .post('/api/v1/tailoring/packets')
      .send({ masterId: master, jobId: job, connectionId: '00000000-0000-4000-8000-000000000001' })
      .expect(502);
    spy.mockRestore();
  });
  it('keeps live browser execution disabled without operator setup', async () => {
    await req()
      .post('/api/v1/application-execution/inspect')
      .send({ packetVersionId: packet })
      .expect(503);
  });
  it('downloads the saved binary PDF only for its owner', async () => {
    const result = await req().get(`/api/v1/tailoring/packets/${packet}/pdf`).expect(200);
    expect(result.headers['content-type']).toContain('application/pdf');
    expect(Buffer.from(result.body).subarray(0, 5).toString()).toBe('%PDF-');
    await req(other).get(`/api/v1/tailoring/packets/${packet}/pdf`).expect(404);
  });
});
