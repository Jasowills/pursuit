import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { CareersService } from '../src/careers.service';
import { DiscoveryService } from '../src/discovery.service';
import { DbService } from '../src/db.service';
import { GlobalExceptionFilter } from '../src/http-error.filter';
import { Job, Source } from '@pursuit/discovery';
process.env.DATABASE_URL ??= 'postgresql://pursuit:pursuit@127.0.0.1:54339/pursuit?schema=public';
describe('sourcing persistence and source trust (isolated Postgres)', () => {
  let app: INestApplication,
    careers: CareersService,
    db: DbService,
    tenant: string,
    user: string,
    token: string;
  const stamp = Date.now();
  const base = {
    company_name: `Discovery QA ${stamp}`,
    title: 'Software Engineer',
    location: 'United States',
    description: 'Build TypeScript services.',
    source_url: `https://example.com/discovery-${stamp}/one`,
  };
  const observation = (raw = 'first', kind = 'greenhouse') => ({
    userId: user,
    source: {
      kind,
      baseUrl: `https://example.com/boards/${stamp}/${kind}`,
      externalId: 'one',
      observedAt: new Date().toISOString(),
      raw: { revision: raw },
      evidence: { method: 'fixture' },
      attribution: null,
    },
  });
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    careers = app.get(CareersService);
    db = app.get(DbService);
    const login = await supertest(app.getHttpServer())
      .post('/api/v1/auth/dev-login')
      .send({ email: `discovery-${stamp}@pursuit.test`, display_name: 'Discovery QA' })
      .expect(201);
    ({ token, tenant_id: tenant } = login.body);
    user = login.body.user.id;
    await careers.getProfile(user, tenant);
  });
  afterAll(async () => {
    await app?.close();
  });
  it('keeps separate requisitions even when company and title match', async () => {
    const a = await careers.intakeJob(tenant, base, observation());
    const b = await careers.intakeJob(
      tenant,
      { ...base, source_url: base.source_url + '-two' },
      { ...observation(), source: { ...observation().source, externalId: 'two' } },
    );
    expect(a.job.id).not.toBe(b.job.id);
    expect(b.deduped).toBe(false);
  });
  it('refreshes source evidence, snapshots and the candidate assessment on repeat intake', async () => {
    const first = await careers.intakeJob(tenant, base, observation());
    await db.db.careerProfile.update({
      where: { tenantId_userId: { tenantId: tenant, userId: user } },
      data: {
        roleFamilies: ['Software Engineer'],
        workAuthorization: [{ jurisdiction: 'US', status: 'authorized', verified: true }],
      },
    });
    const second = await careers.intakeJob(
      tenant,
      { ...base, description: 'Build TypeScript and PostgreSQL services.' },
      observation('updated'),
    );
    expect(second.job.id).toBe(first.job.id);
    expect(second.match?.eligibility).toBe('VERIFIED_ELIGIBLE');
    const snapshots = await db.db.jobSnapshot.findMany({
      where: { jobId: first.job.id },
      orderBy: { observedAt: 'desc' },
    });
    expect(snapshots.length).toBe(2);
    expect(snapshots[0]?.description).toContain('PostgreSQL');
    await careers.intakeJob(
      tenant,
      { ...base, description: 'Build TypeScript and PostgreSQL services.' },
      observation('updated'),
    );
    expect(await db.db.jobSnapshot.count({ where: { jobId: first.job.id } })).toBe(2);
  });
  it('prevents manual and secondary-source reintake from overwriting primary evidence', async () => {
    const existing = await careers.intakeJob(tenant, base, observation());
    await careers.intakeJob(tenant, {
      ...base,
      title: 'Poisoned title',
      company_name: 'Forged employer',
    });
    await careers.intakeJob(
      tenant,
      { ...base, title: 'Poisoned secondary title' },
      observation('forged', 'himalayas'),
    );
    const stored = await db.db.job.findUniqueOrThrow({
      where: { id: existing.job.id },
      include: { company: true },
    });
    expect(stored.title).toBe(base.title);
    expect(stored.company.name).toBe(base.company_name);
  });
  it('does not mix source content when different sources concurrently claim the same URL', async () => {
    const url = base.source_url + '-race';
    const results = await Promise.all(
      ['greenhouse', 'himalayas'].map((kind) =>
        careers.intakeJob(
          tenant,
          {
            ...base,
            source_url: url,
            title: kind + ' source title',
            description: kind + ' source description',
          },
          {
            ...observation('race', kind),
            source: { ...observation('race', kind).source, externalId: 'race' },
          },
        ),
      ),
    );
    expect(results[0]?.job.id).toBe(results[1]?.job.id);
    const stored = await db.db.job.findUniqueOrThrow({
      where: { id: results[0]!.job.id },
      include: { source: true, snapshots: true },
    });
    expect(stored.title).toBe(stored.source!.kind + ' source title');
    expect(
      stored.snapshots.every(
        (snapshot) => snapshot.description === stored.source!.kind + ' source description',
      ),
    ).toBe(true);
  });
  it('closes an explicitly expired source observation instead of reopening it', async () => {
    const result = await careers.intakeJob(
      tenant,
      { ...base, source_url: base.source_url + '-expired' },
      {
        ...observation(),
        source: {
          ...observation().source,
          externalId: 'expired',
          validThrough: '2000-01-01T00:00:00.000Z',
        },
      },
    );
    expect(result.job.status).toBe('CLOSED');
  });
  it('requires authentication and rejects unrecognized discovery fields', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/workflow/discover-source')
      .send({ provider: 'lever', board: 'fixture' })
      .expect(401);
    await supertest(app.getHttpServer())
      .post('/api/v1/workflow/discover-source')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'lever', board: 'fixture', headers: { Authorization: 'forbidden' } })
      .expect(400);
  });
  it('imports through the real authenticated route with source transport stubbed', async () => {
    const source = Source.parse({
      id: 'fixture',
      provider: 'ashby',
      board: 'fixture',
      company: base.company_name,
      url: 'https://api.ashbyhq.com/posting-api/job-board/fixture',
    });
    const job = Job.parse({
      provider: 'ashby',
      sourceId: source.id,
      externalId: 'route',
      title: 'Product Designer',
      company: base.company_name,
      sourceUrl: base.source_url + '-route',
      applyUrl: null,
      description: 'Design customer workflows.',
      location: null,
      workplace: 'unknown',
      applicantCountries: [],
      countryEvidence: null,
      timezoneRestrictions: null,
      raw: { id: 'route' },
      publishedAt: null,
      updatedAt: null,
      validThrough: null,
      compensation: null,
      employmentType: null,
      evidence: {
        url: base.source_url + '-route',
        method: 'fixture',
        parserVersion: 'test',
        observedAt: new Date().toISOString(),
      },
    });
    const spy = jest.spyOn(app.get(DiscoveryService), 'fetch').mockResolvedValue({
      source,
      poll: {
        jobs: [job],
        complete: false,
        diagnostics: ['fixture_partial'],
        observedAt: new Date().toISOString(),
      },
    });
    const result = await supertest(app.getHttpServer())
      .post('/api/v1/workflow/discover-source')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'ashby', board: 'fixture' })
      .expect(201);
    expect(result.body.imported).toBe(1);
    expect(result.body.complete).toBe(false);
    expect(result.body.diagnostics).toEqual(['fixture_partial']);
    spy.mockRestore();
  });
});
