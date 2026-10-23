import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { DiscoveryStore, DiscoveryEngine } from '../src/index.js';
import { source, job, profile, reader } from './fixtures.js';
const store = new DiscoveryStore(':memory:');
store.addSource(source());
const jobs = Array.from({ length: 5000 }, (_, i) =>
  job({
    externalId: String(i),
    sourceUrl: `https://example.com/jobs/${i}`,
    description: `Build TypeScript and PostgreSQL services, support customer workflows and maintain applications. ${'Discuss requirements, review changes, measure reliability and improve tests. '.repeat(35)}`,
  }),
);
const startImport = performance.now();
store.commit(store.claim(source().id)!, {
  jobs,
  complete: true,
  diagnostics: [],
  observedAt: new Date().toISOString(),
});
const importMs = performance.now() - startImport;
const engine = new DiscoveryEngine(
  store,
  reader(() => ({})),
);
const start = performance.now();
const matches = engine.matches(profile());
const rankingMs = performance.now() - start;
const report = {
  observedAt: new Date().toISOString(),
  node: process.version,
  scenario:
    '5,000 synthetic source observations, roughly 2.7KB descriptions, two evidence-backed candidate skills; in-memory SQLite; single process; no network or model.',
  inputCount: jobs.length,
  outputCount: matches.length,
  importMs: Math.round(importMs),
  rankingMs: Math.round(rankingMs),
  rssMiB: Math.round(process.memoryUsage().rss / 1024 / 1024),
  limitation:
    'A local smoke benchmark, not a production concurrency, recall or quality evaluation.',
};
store.close();
writeFileSync('/tmp/pursuit-discovery-benchmark.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
