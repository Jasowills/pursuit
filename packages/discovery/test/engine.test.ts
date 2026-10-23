import { it, expect } from 'vitest';
import { DiscoveryStore } from '../src/store.js';
import { DiscoveryEngine } from '../src/engine.js';
import { Source } from '../src/contracts.js';
import { profile, reader, job, source } from './fixtures.js';
it('hunts without a model key or known employer board and persists actual sourced records', async () => {
  const store = new DiscoveryStore(':memory:');
  const read = reader((url) => {
    expect(url).toContain('himalayas.app/jobs/api/search');
    return url.includes('page=2')
      ? { jobs: [] }
      : {
          jobs: [
            {
              guid: 'https://himalayas.app/companies/example/jobs/engineer',
              title: 'Software Engineer',
              companyName: 'Example',
              description: 'React TypeScript',
              locationRestrictions: [{ alpha2: 'NG', name: 'Nigeria' }],
              applicationLink: 'https://example.com/apply',
            },
          ],
        };
  });
  const engine = new DiscoveryEngine(store, read);
  const result = await engine.hunt(profile(), undefined, { maxSources: 2, maxPages: 2 });
  expect(result.matches.length).toBeGreaterThan(0);
  expect(result.matches[0].assessment.eligibility).not.toBe('confirmed_eligible');
  expect(result.discovery.searchQueries).toBe(0);
  expect(store.runs().length).toBe(2);
  store.close();
});
it('does not fetch disabled sources even when explicitly requested', async () => {
  const store = new DiscoveryStore(':memory:');
  store.addSource(
    Source.parse({
      id: 'gh:disabled',
      provider: 'greenhouse',
      board: 'test',
      company: 'Fixture',
      enabled: false,
    }),
  );
  let calls = 0;
  const engine = new DiscoveryEngine(
    store,
    reader(() => {
      calls++;
      return { jobs: [] };
    }),
  );
  expect((await engine.poll('gh:disabled')).status).toBe('busy_or_disabled');
  expect(calls).toBe(0);
  store.close();
});

it('clusters the same URL across sources while preserving separate same-title requisitions', () => {
  const store = new DiscoveryStore(':memory:');
  for (const provider of ['greenhouse', 'ashby'] as const) {
    const s = source(provider);
    store.addSource(s);
    const claim = store.claim(s.id)!;
    store.commit(claim, {
      complete: true,
      diagnostics: [],
      observedAt: new Date().toISOString(),
      jobs: [
        job({ sourceId: s.id, provider }),
        job({ sourceId: s.id, provider, externalId: '2', sourceUrl: 'https://example.com/jobs/2' }),
      ],
    });
  }
  const results = new DiscoveryEngine(
    store,
    reader(() => ({})),
  ).matches(profile());
  expect(results).toHaveLength(2);
  expect(results.every((r) => r.sourceObservations.length === 2)).toBe(true);
  expect(store.jobs()).toHaveLength(4);
  store.close();
});

it('bounds indexed search, searches outside ATS domains, and does not leak the provider key to a result URL', async () => {
  const store = new DiscoveryStore(':memory:');
  const requests: { url: string; headers?: Record<string, string> }[] = [];
  const engine = new DiscoveryEngine(store, async (url, options) => {
    requests.push({ url, headers: options?.headers });
    return {
      url,
      status: 200,
      headers: {},
      body: JSON.stringify({
        web: {
          results: [
            { url: 'https://jobs.ashbyhq.com/fixture/one' },
            { url: 'https://example.com/careers' },
          ],
        },
      }),
    };
  });
  const result = await engine.discover(profile(), 'fixture-only-key', 2);
  expect(result.searchQueries).toBe(2);
  expect(requests).toHaveLength(2);
  expect(requests.every((r) => new URL(r.url).hostname === 'api.search.brave.com')).toBe(true);
  expect(requests.every((r) => new URL(r.url).searchParams.get('country') === 'ALL')).toBe(true);
  expect(new URL(requests[1]!.url).searchParams.get('q')).not.toContain('site:');
  expect(store.frontier()).toHaveLength(2);
  expect(store.sources().some((r) => r.config.provider === 'ashby')).toBe(true);
  store.close();
});
