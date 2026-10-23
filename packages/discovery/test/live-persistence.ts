import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DiscoveryStore, DiscoveryEngine, createReader } from '../src/index.js';
const path = join(mkdtempSync(join(tmpdir(), 'pursuit-discovery-live-')), 'discovery.sqlite');
let store = new DiscoveryStore(path);
let engine = new DiscoveryEngine(store, createReader({ minHostDelayMs: 1500 }));
store.addSource({
  id: 'live-cloudflare',
  provider: 'greenhouse',
  board: 'cloudflare',
  company: 'Cloudflare',
});
store.addSource({
  id: 'live-himalayas',
  provider: 'himalayas',
  query: 'software engineer',
  company: 'Himalayas',
});
store.addSource({
  id: 'live-wwr',
  provider: 'feed',
  url: 'https://weworkremotely.com/remote-jobs.rss',
  company: 'We Work Remotely',
});
const runs = [];
for (const id of ['live-cloudflare', 'live-himalayas', 'live-wwr'])
  runs.push(await engine.poll(id, 1));
const before = store.jobs({ limit: 5000 });
const sample = before.find((r) => r.job.sourceId === 'live-cloudflare');
const verification = sample ? await engine.verify(sample.id) : null;
store.close();
store = new DiscoveryStore(path);
engine = new DiscoveryEngine(store, createReader());
const matches = engine.matches({
  roles: ['software engineer'],
  skills: [{ name: 'TypeScript', evidence: 'synthetic-qa-profile#project' }],
  residenceCountry: 'NG',
  residenceVerified: true,
  remoteOnly: true,
});
const report = {
  observedAt: new Date().toISOString(),
  scope:
    'Read-only public source poll, persisted SQLite reopen, deterministic matching and one listing verification. Synthetic candidate, no application or messaging.',
  runs,
  storedBeforeRestart: before.length,
  storedAfterRestart: store.jobs({ limit: 5000 }).length,
  verification,
  matchCount: matches.length,
  sampleAssessments: matches.slice(0, 3).map((r) => ({
    title: r.job.title,
    company: r.job.company,
    kind: r.job.kind,
    eligibility: r.assessment.eligibility,
    unknowns: r.assessment.unknowns,
  })),
};
store.close();
writeFileSync('/tmp/pursuit-discovery-persistence.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
