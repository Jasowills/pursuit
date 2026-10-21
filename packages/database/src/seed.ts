/**
 * Development seed — FICTIONAL data only.
 * Every seeded company/person is invented ("ExampleCorp", demo@pursuit.local).
 * Never fabricated real application activity: the seeded application sits in
 * DISCOVERED with no submission evidence; nothing was ever submitted.
 */
import { randomUUID, createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import {
  canonicalizeUrl,
  jobFingerprint,
  evaluateEligibility,
  baselineFitScore,
} from '@pursuit/shared';
import 'dotenv/config';

const db = new PrismaClient();

const SEED_PROFILE = {
  work_authorization: [{ jurisdiction: 'US', status: 'CITIZEN', verified: true }],
  desired_compensation: { min_amount: 140000, currency: 'USD' },
  role_families: ['Software Engineer', 'Full-stack Engineer', 'Platform Engineer'],
  seniority: ['SENIOR', 'STAFF'],
  hard_exclusions: ['boeing', 'defense contract', 'onsite only'],
};

const FIT_SKILLS = [
  { name: 'TypeScript', level: 'EXPERT' },
  { name: 'React', level: 'EXPERT' },
  { name: 'Node.js', level: 'PROFICIENT' },
  { name: 'Rust', level: 'FAMILIAR' },
] as const;

interface SeedJob {
  company: { id: string; name: string };
  title: string;
  location: string | null;
  remote: string | null;
  comp: string | null;
  rawUrl: string;
  description: string;
}

async function upsertCompany(name: string, domain: string) {
  return db.company.upsert({
    where: { name },
    update: {},
    create: {
      name,
      canonicalDomain: domain,
      isSeed: true,
      aliases: JSON.parse(JSON.stringify([])),
    },
  });
}

async function upsertJobAndMatch(tenantId: string, sourceId: string, masterId: string, j: SeedJob) {
  const canonicalUrl = canonicalizeUrl(j.rawUrl);
  const fingerprint = jobFingerprint('(fictional seed)', j.title);
  void fingerprint;
  const descriptionHash = createHash('sha256').update(j.description).digest('hex').slice(0, 32);

  let job = await db.job.findFirst({ where: { canonicalUrl } });
  const data = {
    companyId: j.company.id,
    sourceId,
    externalId: `seed:${Hash(j.rawUrl)}`,
    canonicalUrl,
    title: j.title,
    location: j.location,
    remoteRestrictions: j.remote,
    descriptionHash,
    compensation: j.comp,
    status: 'OPEN',
  };
  if (job) {
    job = await db.job.update({ where: { id: job.id }, data });
  } else {
    job = await db.job.create({ data });
  }
  await db.jobSnapshot.create({
    data: { jobId: job.id, description: j.description, metadata: { source: 'seed' } },
  });

  const eligibility = evaluateEligibility({
    job: {
      title: j.title,
      location: j.location,
      remote_restrictions: j.remote,
      description: j.description,
      compensation: j.comp,
    },
    profile: SEED_PROFILE,
  });
  const fit = baselineFitScore(
    { title: j.title, description: j.description },
    {
      skills: FIT_SKILLS.map((s) => ({ ...s })),
      role_families: SEED_PROFILE.role_families,
    },
  );

  await db.jobMatch.upsert({
    where: { tenantId_jobId: { tenantId, jobId: job.id } },
    update: {
      eligibility: eligibility.eligibility,
      eligibilityEvidence: JSON.parse(JSON.stringify(eligibility.eligibility_evidence)),
      fitScore: fit.score,
      fitRationale: fit.rationale,
      hardFailures: JSON.parse(JSON.stringify(eligibility.hard_failures)),
    },
    create: {
      tenantId,
      jobId: job.id,
      eligibility: eligibility.eligibility,
      eligibilityEvidence: JSON.parse(JSON.stringify(eligibility.eligibility_evidence)),
      fitScore: fit.score,
      fitRationale: fit.rationale,
      hardFailures: JSON.parse(JSON.stringify(eligibility.hard_failures)),
    },
  });

  const rv = await db.resumeVersion.findFirst({
    where: { tenantId, jobId: job.id, masterId },
  });
  if (!rv) {
    await db.resumeVersion.create({
      data: {
        tenantId,
        masterId,
        jobId: job.id,
        label: `Tailored — ${j.company.name} · ${j.title}`,
        templateVersion: 'v1',
        status: 'DRAFT',
        isSeed: true,
      },
    });
  }
  return job;
}

function Hash(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 12);
}

async function main() {
  console.log('seed: starting (fictional data only)');

  const user = await db.user.upsert({
    where: { email: 'demo@pursuit.local' },
    update: {},
    create: { email: 'demo@pursuit.local', displayName: 'Demo Operator', isSeedUser: true },
  });
  let tenant = await db.tenant.findFirst({ where: { name: 'Pursuit Private' } });
  if (!tenant) {
    tenant = await db.tenant.create({ data: { name: 'Pursuit Private', isSeed: true } });
  }
  await db.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    update: {},
    create: { tenantId: tenant.id, userId: user.id, role: 'OWNER' },
  });

  const existingProfile = await db.careerProfile.findFirst({ where: { tenantId: tenant.id } });
  if (!existingProfile) {
    await db.careerProfile.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        location: 'Austin, TX (remote OK)',
        workAuthorization: JSON.parse(JSON.stringify(SEED_PROFILE.work_authorization)),
        desiredCompensation: JSON.parse(JSON.stringify(SEED_PROFILE.desired_compensation)),
        roleFamilies: JSON.parse(JSON.stringify(SEED_PROFILE.role_families)),
        seniority: JSON.parse(JSON.stringify(SEED_PROFILE.seniority)),
        workArrangements: JSON.parse(JSON.stringify(['REMOTE', 'HYBRID'])),
        hardExclusions: JSON.parse(JSON.stringify(SEED_PROFILE.hard_exclusions)),
        preferences: JSON.parse(JSON.stringify(['typescript-heavy teams', 'async-first'])),
      },
    });
  }

  const example = await upsertCompany('ExampleCorp (fictional seed)', 'exampleco.example');
  const onion = await upsertCompany('GraphiteWorks (fictional seed)', 'graphiteworks.example');
  const vine = await upsertCompany('TerraVine (fictional seed)', 'terravine.example');
  const notAllowed = await upsertCompany('DefenseRay (fictional seed)', 'defenseray.example');

  const source = await db.jobSource.upsert({
    where: { kind_baseUrl: { kind: 'MANUAL_ENTRY', baseUrl: 'https://exampleco.example/careers' } },
    update: {},
    create: {
      kind: 'MANUAL_ENTRY',
      baseUrl: 'https://exampleco.example/careers',
      termsStatus: 'PERMITTED',
    },
  });

  const master = await db.resumeMaster.create({
    data: {
      tenantId: tenant.id,
      ownerId: user.id,
      fileName: 'demo-master-resume.pdf',
      objectKey: `seed/${randomUUID()}/demo-master-resume.pdf`,
      contentType: 'application/pdf',
      bytes: 0,
      parsedFactsVersion: 'v1',
    },
  });

  const jobs: SeedJob[] = [
    {
      company: example,
      title: 'Senior Software Engineer, Growth',
      location: 'Remote — US',
      remote: 'remote',
      comp: '$165,000/yr',
      rawUrl: 'https://jobs.exampleco.example/listings/1001?utm_source=pursuit_seed',
      description:
        'ExampleCorp is hiring a Senior Software Engineer to build high-throughput growth tooling in TypeScript. React, Node.js, PostgreSQL. We cannot provide visa sponsorship.',
    },
    {
      company: onion,
      title: 'Platform Engineer II',
      location: 'Austin, TX',
      remote: 'hybrid',
      comp: '$150,000/yr',
      rawUrl: 'https://graphiteworks.example/careers/platform-engineer-ii',
      description:
        'GraphiteWorks seeks a Platform Engineer II for CI/CD platform ownership. Python. Kubernetes.',
    },
    {
      company: vine,
      title: 'Full-stack Engineer, Product',
      location: 'Remote',
      remote: 'remote',
      comp: null,
      rawUrl: 'https://terravine.example/join/fullstack-product',
      description:
        'Ship product features with React and Rust. Full-stack Engineer focusing on merchant tooling. Compensation disclosed in interview.',
    },
    {
      company: notAllowed,
      title: 'Defense Software Developer',
      location: 'Onsite — Colorado Springs',
      remote: 'onsite only',
      comp: '$180,000/yr',
      rawUrl: 'https://defenseray.example/careers/defense-sw',
      description:
        'DefenseRay develops defense contract tooling with Boeing integrations. Onsite only. Security clearance required.',
    },
    {
      company: example,
      title: 'Staff Full-stack Engineer',
      location: 'Remote — US',
      remote: 'remote',
      comp: '$195,000/yr + equity',
      rawUrl: 'https://jobs.exampleco.example/listings/1042',
      description:
        'Own major surfaces of a mass-market product. TypeScript, GraphQL, Postgres. No relocation.',
    },
  ];

  for (const j of jobs) {
    await upsertJobAndMatch(tenant.id, source.id, master.id, j);
  }

  const watcherExists = await db.watcher.findFirst({
    where: { tenantId: tenant.id, sourceUrl: { contains: 'exampleco' } },
  });
  if (!watcherExists) {
    await db.watcher.create({
      data: {
        tenantId: tenant.id,
        kind: 'COMPANY_URL',
        sourceUrl: 'https://jobs.exampleco.example/listings',
        frequencyMinutes: 120,
        keywords: JSON.parse(JSON.stringify(['Software Engineer'])),
        nextCheckAt: new Date(Date.now() + 60 * 60_000),
        enabled: true,
        isSeed: true,
      },
    });
  }

  const seededApp = await db.application.findFirst({
    where: { tenantId: tenant.id, isSeed: true },
  });
  if (!seededApp) {
    const firstJob = await db.job.findFirst({
      where: { canonicalUrl: canonicalizeUrl(jobs[0]!.rawUrl) },
    });
    if (firstJob) {
      await db.application.create({
        data: {
          tenantId: tenant.id,
          jobId: firstJob.id,
          status: 'DISCOVERED',
          sourceUrl: canonicalizeUrl(jobs[0]!.rawUrl),
          isSeed: true,
        },
      });
    }
  }

  const notifCount = await db.notification.count({ where: { tenantId: tenant.id } });
  if (notifCount === 0) {
    await db.notification.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        type: 'WELCOME',
        title: 'Welcome to Pursuit',
        body: 'Fictional demo data seeded. No real applications exist.',
      },
    });
  }

  console.log('seed: done');
}

main()
  .catch((e: unknown) => {
    console.error('seed failed:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
