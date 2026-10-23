import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DiscoveryStore } from '../src/store.js';
import { source, job } from './fixtures.js';
const poll = (jobs: ReturnType<typeof job>[], complete = true) => ({
  jobs,
  complete,
  diagnostics: [],
  observedAt: new Date().toISOString(),
});
function setup() {
  const store = new DiscoveryStore(':memory:');
  store.addSource(source());
  return store;
}
describe('durable sourcing', () => {
  it('survives restart, refreshes content and creates snapshots only on changes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pursuit-discovery-'));
    const path = join(dir, 'test.sqlite');
    let s = new DiscoveryStore(path);
    s.addSource(source());
    s.commit(s.claim(source().id)!, poll([job()]));
    s.close();
    s = new DiscoveryStore(path);
    expect(s.jobs()).toHaveLength(1);
    s.commit(s.claim(source().id)!, poll([job()]));
    expect(s.db.prepare('SELECT count(*) AS n FROM discovery_snapshots').get()?.n).toBe(1);
    s.commit(s.claim(source().id)!, poll([job({ description: 'Changed requirements' })]));
    expect(s.jobs()[0].job.description).toBe('Changed requirements');
    expect(s.db.prepare('SELECT count(*) AS n FROM discovery_snapshots').get()?.n).toBe(2);
    s.close();
    rmSync(dir, { recursive: true });
  });
  it('keeps different requisitions/locations despite identical titles', () => {
    const s = setup();
    s.commit(
      s.claim(source().id)!,
      poll([
        job(),
        job({ externalId: '2', sourceUrl: 'https://example.com/jobs/2', location: 'New York' }),
      ]),
    );
    expect(s.jobs()).toHaveLength(2);
    s.close();
  });
  it('never closes jobs after network failure or partial polls', () => {
    const s = setup();
    s.commit(s.claim(source().id)!, poll([job()]));
    s.fail(s.claim(source().id)!, 'source_http_503');
    expect(s.jobs()).toHaveLength(1);
    s.commit(s.claim(source().id)!, poll([], false));
    expect(s.jobs()).toHaveLength(1);
    s.close();
  });
  it('uses two complete missing observations before closure', () => {
    const s = setup();
    s.commit(s.claim(source().id)!, poll([job()]));
    s.commit(s.claim(source().id)!, poll([]));
    expect(s.jobs({ status: 'unconfirmed_missing' })).toHaveLength(1);
    s.commit(s.claim(source().id)!, poll([]));
    expect(s.jobs({ status: 'closed' })).toHaveLength(1);
    s.close();
  });
  it('fences concurrent workers and disabled-source commits', () => {
    const s = setup();
    const claim = s.claim(source().id)!;
    expect(s.claim(source().id)).toBeNull();
    s.setEnabled(source().id, false);
    expect(() => s.commit(claim, poll([job()]))).toThrow('source_lease_lost');
    expect(s.jobs()).toHaveLength(0);
    expect(s.runs()[0]?.status).toBe('interrupted');
    expect(s.runs()[0]?.finished_at).toBeTruthy();
    s.close();
  });
  it('does not revoke an active poll when the existing enabled value is saved again', () => {
    const s = setup();
    const claim = s.claim(source().id)!;
    s.setEnabled(source().id, true);
    expect(s.claim(source().id)).toBeNull();
    s.commit(claim, poll([job()]));
    expect(s.jobs()).toHaveLength(1);
    s.close();
  });
  it('rolls back a claim if its durable run record cannot be written', () => {
    const s = setup();
    s.db.exec(
      "CREATE TEMP TRIGGER refuse_run BEFORE INSERT ON discovery_runs BEGIN SELECT RAISE(ABORT, 'fixture_write_failure'); END;",
    );
    expect(() => s.claim(source().id)).toThrow();
    expect(
      s.db.prepare('SELECT lease FROM discovery_sources WHERE id=?').get(source().id)?.lease,
    ).toBeNull();
    expect(s.runs()).toHaveLength(0);
    s.db.exec('DROP TRIGGER refuse_run');
    expect(s.claim(source().id)).not.toBeNull();
    s.close();
  });
  it('rolls back a disabled-source transition if its run history cannot be updated', () => {
    const s = setup();
    const claim = s.claim(source().id)!;
    s.db.exec(
      "CREATE TEMP TRIGGER refuse_finish BEFORE UPDATE ON discovery_runs BEGIN SELECT RAISE(ABORT, 'fixture_write_failure'); END;",
    );
    expect(() => s.setEnabled(source().id, false)).toThrow();
    expect(s.sources()[0].config.enabled).toBe(true);
    s.db.exec('DROP TRIGGER refuse_finish');
    s.commit(claim, poll([job()]));
    expect(s.jobs()).toHaveLength(1);
    s.close();
  });
  it('rolls back source failure/backoff if its durable run history cannot be written', () => {
    const s = setup();
    const claim = s.claim(source().id)!;
    const before = s.sources()[0];
    s.db.exec(
      "CREATE TEMP TRIGGER refuse_failure BEFORE UPDATE ON discovery_runs BEGIN SELECT RAISE(ABORT, 'fixture_write_failure'); END;",
    );
    expect(() => s.fail(claim, 'fixture_failure')).toThrow();
    expect(s.sources()[0].last_error).toBe(before.last_error);
    expect(s.sources()[0].next_poll).toBe(before.next_poll);
    s.db.exec('DROP TRIGGER refuse_failure');
    s.fail(claim, 'fixture_failure');
    expect(s.runs()[0]?.status).toBe('failed');
    s.close();
  });
  it('claims and recovers expired polls across independent SQLite connections', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pursuit-source-workers-'));
    const path = join(dir, 'test.sqlite');
    const a = new DiscoveryStore(path),
      b = new DiscoveryStore(path);
    try {
      a.addSource(source());
      const old = a.claim(source().id, new Date(Date.now() - 16 * 60000))!;
      const current = b.claim(source().id)!;
      expect(a.claim(source().id)).toBeNull();
      expect(() => a.commit(old, poll([job({ description: 'stale' })]))).toThrow(
        'source_lease_lost',
      );
      b.commit(current, poll([job({ description: 'current' })]));
      expect(a.jobs()[0].job.description).toBe('current');
      expect(
        a
          .runs()
          .map((r) => r.status)
          .sort(),
      ).toEqual(['complete', 'interrupted']);
      expect(a.runs().every((r) => r.finished_at)).toBe(true);
    } finally {
      a.close();
      b.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('rolls back the entire poll on source identity mismatch', () => {
    const s = setup();
    const c = s.claim(source().id)!;
    expect(() =>
      s.commit(c, poll([job(), job({ externalId: '2', sourceId: 'attacker' })])),
    ).toThrow('job_source_mismatch');
    expect(s.jobs()).toHaveLength(0);
    s.fail(c, 'invalid_poll');
    expect(s.runs()[0]?.status).toBe('failed');
    s.close();
  });
  it('removes expired listings from active results without another network poll', () => {
    const s = setup();
    s.commit(s.claim(source().id)!, poll([job({ validThrough: '2000-01-01T00:00:00.000Z' })]));
    expect(s.jobs()).toHaveLength(0);
    expect(s.jobs({ status: 'expired' })).toHaveLength(1);
    s.close();
  });
});
