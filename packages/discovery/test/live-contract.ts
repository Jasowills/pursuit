import { writeFileSync } from 'node:fs';
import { Source } from '../src/contracts.js';
import { pollSource } from '../src/adapters.js';
import { createReader } from '../src/transport.js';
const read = createReader({ minHostDelayMs: 1500 });
const cases = [
  { id: 'live-greenhouse', provider: 'greenhouse', board: 'cloudflare', company: 'Cloudflare' },
  { id: 'live-ashby', provider: 'ashby', board: 'linear', company: 'Linear' },
  { id: 'live-lever', provider: 'lever', board: 'spotify', company: 'Spotify' },
  { id: 'live-himalayas', provider: 'himalayas', query: 'software engineer', company: 'Himalayas' },
];
const reports = [];
for (const input of cases) {
  try {
    const result = await pollSource(Source.parse(input), read, { maxPages: 1 });
    reports.push({
      source: input.id,
      count: result.jobs.length,
      complete: result.complete,
      diagnostics: result.diagnostics,
      sample: result.jobs.slice(0, 2).map((j) => ({
        id: j.externalId,
        title: j.title,
        url: j.sourceUrl,
        countries: j.applicantCountries,
        countryEvidence: j.countryEvidence,
        timezoneRestrictions: j.timezoneRestrictions,
        updatedAt: j.updatedAt,
        publishedAt: j.publishedAt,
        attribution: j.attribution,
      })),
      keys: result.jobs[0] ? Object.keys(result.jobs[0].raw) : [],
    });
  } catch (e) {
    reports.push({ source: input.id, error: e instanceof Error ? e.message : 'failed' });
  }
}
const report = {
  date: '2026-10-23',
  scope:
    'Read-only public endpoint contract check. One page per provider; not global coverage or authorization to apply.',
  reports,
};
writeFileSync(
  process.env.DISCOVERY_LIVE_REPORT ?? '/tmp/pursuit-discovery-live.json',
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
