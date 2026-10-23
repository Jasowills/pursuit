import { it, expect } from 'vitest';
import { verifyListing } from '../src/verify.js';
import { source, job, reader } from './fixtures.js';
import { DiscoveryStore } from '../src/store.js';
it('does not treat HTTP 200 with changed identity as a verified posting', async () => {
  const r = await verifyListing(
    source(),
    job(),
    reader(() => ({
      id: 999,
      title: 'Other',
      absolute_url: 'https://example.com/other',
      location: { name: 'Remote' },
    })),
  );
  expect(r.verification.status).toBe('unknown');
});
it('records a definite source closure, but keeps failed checks unknown', async () => {
  const closed = await verifyListing(source(), job(), async (url) => ({
    status: 410,
    url,
    headers: {},
    body: '',
  }));
  expect(closed.verification.status).toBe('closed');
  const failed = await verifyListing(source(), job(), async () => {
    throw new Error('network');
  });
  expect(failed.verification.status).toBe('unknown');
});
it('never upgrades an unstructured signal into a vacancy verification', async () => {
  let calls = 0;
  const r = await verifyListing(
    source(),
    job({ kind: 'hiring_lead' }),
    reader(() => {
      calls++;
      return {};
    }),
  );
  expect(r.verification.status).toBe('unknown');
  expect(calls).toBe(0);
});
it('fences a stale verification after a posting URL migration', () => {
  const s = new DiscoveryStore(':memory:');
  s.addSource(source());
  s.commit(s.claim(source().id)!, {
    jobs: [job()],
    complete: true,
    diagnostics: [],
    observedAt: new Date().toISOString(),
  });
  const row = s.jobs()[0];
  s.commit(s.claim(source().id)!, {
    jobs: [job({ sourceUrl: 'https://example.com/jobs/moved' })],
    complete: true,
    diagnostics: [],
    observedAt: new Date().toISOString(),
  });
  expect(
    s.recordVerification(row.id, row.duplicateCluster, {
      status: 'closed',
      url: 'https://example.com/jobs/1',
      observedAt: new Date().toISOString(),
      reason: 'Old URL 404',
    }),
  ).toBe(false);
  expect(s.jobs()).toHaveLength(1);
  s.close();
});
