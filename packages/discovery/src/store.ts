import type { Verification } from './verify.js';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';
import { Source, type Job, type Poll } from './contracts.js';
import { canonicalUrl } from './text.js';
import { contentHash } from './adapters.js';
export class DiscoveryStore {
  readonly db: DatabaseSync;
  constructor(path: string) {
    if (path !== ':memory:') {
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    }
    this.db = new DatabaseSync(path);
    if (path !== ':memory:') chmodSync(path, 0o600);
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
  CREATE TABLE IF NOT EXISTS discovery_sources(id TEXT PRIMARY KEY,config TEXT NOT NULL,next_poll TEXT NOT NULL,lease TEXT,lease_until TEXT,failures INTEGER NOT NULL DEFAULT 0,last_success TEXT,last_error TEXT);
  CREATE TABLE IF NOT EXISTS discovery_jobs(id TEXT PRIMARY KEY,source_id TEXT NOT NULL REFERENCES discovery_sources(id),external_id TEXT NOT NULL,canonical_url TEXT NOT NULL,body TEXT NOT NULL,hash TEXT NOT NULL,status TEXT NOT NULL,first_seen TEXT NOT NULL,last_seen TEXT NOT NULL,missing_polls INTEGER NOT NULL DEFAULT 0, UNIQUE(source_id,external_id));
  CREATE INDEX IF NOT EXISTS discovery_job_url ON discovery_jobs(canonical_url);
  CREATE INDEX IF NOT EXISTS discovery_job_status ON discovery_jobs(status,last_seen);
  CREATE TABLE IF NOT EXISTS discovery_snapshots(id INTEGER PRIMARY KEY,job_id TEXT NOT NULL REFERENCES discovery_jobs(id),hash TEXT NOT NULL,body TEXT NOT NULL,observed_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS discovery_runs(id TEXT PRIMARY KEY,source_id TEXT NOT NULL REFERENCES discovery_sources(id),started_at TEXT NOT NULL,finished_at TEXT,status TEXT NOT NULL,complete INTEGER NOT NULL DEFAULT 0,count INTEGER NOT NULL DEFAULT 0,diagnostics TEXT NOT NULL DEFAULT '[]');
  CREATE TABLE IF NOT EXISTS discovery_frontier(url TEXT PRIMARY KEY,origin TEXT NOT NULL,observed_at TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',note TEXT);
  CREATE TABLE IF NOT EXISTS discovery_verifications(id INTEGER PRIMARY KEY,job_id TEXT NOT NULL REFERENCES discovery_jobs(id),body TEXT NOT NULL,observed_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS discovery_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
  `);
  }
  close() {
    this.db.close();
  }
  setEnabled(id: string, enabled: boolean) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row = this.db.prepare('SELECT config FROM discovery_sources WHERE id=?').get(id) as any;
      if (!row) throw new Error('source_not_found');
      const previous = Source.parse(JSON.parse(row.config));
      if (previous.enabled && enabled) {
        this.db.exec('COMMIT');
        return;
      }
      const source = Source.parse({ ...previous, enabled });
      this.db
        .prepare('UPDATE discovery_sources SET config=?,lease=NULL,lease_until=NULL WHERE id=?')
        .run(JSON.stringify(source), id);
      this.db
        .prepare(
          "UPDATE discovery_runs SET status='interrupted',finished_at=?,diagnostics=? WHERE source_id=? AND status='running'",
        )
        .run(
          new Date().toISOString(),
          JSON.stringify([enabled ? 'source_reenabled' : 'source_disabled']),
          id,
        );
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  addSource(input: unknown) {
    const source = Source.parse(input);
    const previous = this.db
      .prepare('SELECT config FROM discovery_sources WHERE id=?')
      .get(source.id) as any;
    if (previous && previous.config !== JSON.stringify(source))
      throw new Error('source_id_already_has_different_configuration');
    this.db
      .prepare('INSERT OR IGNORE INTO discovery_sources(id,config,next_poll) VALUES(?,?,?)')
      .run(source.id, JSON.stringify(source), new Date().toISOString());
    return source;
  }
  sources(): any[] {
    return this.db
      .prepare(
        'SELECT id,config,next_poll,last_success,last_error,failures FROM discovery_sources ORDER BY id',
      )
      .all()
      .map((r: any) => ({ ...r, config: JSON.parse(r.config) }));
  }
  claim(
    sourceId: string,
    now = new Date(),
  ): { source: Source; token: string; runId: string } | null {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row = this.db
        .prepare('SELECT config FROM discovery_sources WHERE id=?')
        .get(sourceId) as any;
      if (!row) {
        this.db.exec('COMMIT');
        return null;
      }
      const source = Source.parse(JSON.parse(row.config));
      if (!source.enabled) {
        this.db.exec('COMMIT');
        return null;
      }
      const token = randomUUID();
      const updated = this.db
        .prepare(
          'UPDATE discovery_sources SET lease=?,lease_until=? WHERE id=? AND (lease_until IS NULL OR lease_until < ?)',
        )
        .run(
          token,
          new Date(now.getTime() + 15 * 60_000).toISOString(),
          sourceId,
          now.toISOString(),
        );
      if (!updated.changes) {
        this.db.exec('COMMIT');
        return null;
      }
      const runId = randomUUID();
      this.db
        .prepare(
          "UPDATE discovery_runs SET status='interrupted',finished_at=? WHERE source_id=? AND status='running'",
        )
        .run(now.toISOString(), sourceId);
      this.db
        .prepare(
          "INSERT INTO discovery_runs(id,source_id,started_at,status) VALUES(?,?,?,'running')",
        )
        .run(runId, sourceId, now.toISOString());
      this.db.exec('COMMIT');
      return { source, token, runId };
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  private release(id: string, token: string) {
    this.db
      .prepare('UPDATE discovery_sources SET lease=NULL,lease_until=NULL WHERE id=? AND lease=?')
      .run(id, token);
  }
  commit(claim: { source: Source; token: string; runId: string }, poll: Poll) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const current = this.db
        .prepare('SELECT lease,lease_until FROM discovery_sources WHERE id=?')
        .get(claim.source.id) as any;
      if (current?.lease !== claim.token || current.lease_until < new Date().toISOString())
        throw new Error('source_lease_lost');
      const seen = new Set<string>();
      for (const job of poll.jobs) {
        if (job.sourceId !== claim.source.id) throw new Error('job_source_mismatch');
        const id = createHash('sha256').update(`${job.sourceId}\0${job.externalId}`).digest('hex');
        seen.add(id);
        const hash = contentHash(job);
        const old = this.db.prepare('SELECT hash FROM discovery_jobs WHERE id=?').get(id) as any;
        const status = job.validThrough && job.validThrough < poll.observedAt ? 'expired' : 'open';
        this.db
          .prepare(
            `INSERT INTO discovery_jobs(id,source_id,external_id,canonical_url,body,hash,status,first_seen,last_seen) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(source_id,external_id) DO UPDATE SET canonical_url=excluded.canonical_url,body=excluded.body,hash=excluded.hash,status=excluded.status,last_seen=excluded.last_seen,missing_polls=0`,
          )
          .run(
            id,
            job.sourceId,
            job.externalId,
            canonicalUrl(job.sourceUrl),
            JSON.stringify(job),
            hash,
            status,
            poll.observedAt,
            poll.observedAt,
          );
        if (!old || old.hash !== hash)
          this.db
            .prepare(
              'INSERT INTO discovery_snapshots(job_id,hash,body,observed_at) VALUES(?,?,?,?)',
            )
            .run(id, hash, JSON.stringify(job), poll.observedAt);
      }
      // Only an authoritative, complete board snapshot can contribute absence evidence.
      if (poll.complete) {
        const rows = this.db
          .prepare(
            "SELECT id,missing_polls FROM discovery_jobs WHERE source_id=? AND status IN ('open','unconfirmed_missing')",
          )
          .all(claim.source.id) as any[];
        for (const row of rows)
          if (!seen.has(row.id))
            this.db
              .prepare('UPDATE discovery_jobs SET missing_polls=?,status=? WHERE id=?')
              .run(
                row.missing_polls + 1,
                row.missing_polls >= 1 ? 'closed' : 'unconfirmed_missing',
                row.id,
              );
      }
      const next = new Date(
        Date.parse(poll.observedAt) + claim.source.intervalMinutes * 60_000,
      ).toISOString();
      this.db
        .prepare(
          'UPDATE discovery_sources SET last_success=?,last_error=NULL,failures=0,next_poll=?,lease=NULL,lease_until=NULL WHERE id=? AND lease=?',
        )
        .run(poll.observedAt, next, claim.source.id, claim.token);
      this.db
        .prepare(
          'UPDATE discovery_runs SET finished_at=?,status=?,complete=?,count=?,diagnostics=? WHERE id=?',
        )
        .run(
          poll.observedAt,
          poll.complete ? 'complete' : 'partial',
          Number(poll.complete),
          poll.jobs.length,
          JSON.stringify(poll.diagnostics),
          claim.runId,
        );
      this.db.exec('COMMIT');
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
  fail(claim: { source: Source; token: string; runId: string }, code: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const now = new Date();
      const row = this.db
        .prepare('SELECT failures,lease FROM discovery_sources WHERE id=?')
        .get(claim.source.id) as any;
      if (row?.lease !== claim.token) {
        this.db.exec('COMMIT');
        return;
      }
      const attempts = Number(row.failures) + 1;
      const delay = Math.min(24 * 60, 15 * 2 ** Math.min(attempts, 7));
      this.db
        .prepare(
          'UPDATE discovery_sources SET failures=?,last_error=?,next_poll=? WHERE id=? AND lease=?',
        )
        .run(
          attempts,
          code,
          new Date(now.getTime() + delay * 60_000).toISOString(),
          claim.source.id,
          claim.token,
        );
      this.db
        .prepare("UPDATE discovery_runs SET finished_at=?,status='failed',diagnostics=? WHERE id=?")
        .run(now.toISOString(), JSON.stringify([code]), claim.runId);
      this.release(claim.source.id, claim.token);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  jobs(options: { status?: string; query?: string; limit?: number } = {}): any[] {
    this.db
      .prepare(
        "UPDATE discovery_jobs SET status='expired' WHERE status IN ('open','unconfirmed_missing') AND json_extract(body,'$.validThrough') IS NOT NULL AND json_extract(body,'$.validThrough') < ?",
      )
      .run(new Date().toISOString());
    const status = options.status ?? 'open';
    const rows = this.db
      .prepare(
        'SELECT id,body,status,first_seen,last_seen,canonical_url FROM discovery_jobs WHERE status=? ORDER BY last_seen DESC LIMIT 5000',
      )
      .all(status) as any[];
    const terms = (options.query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    return rows
      .filter((r) => terms.every((t) => r.body.toLowerCase().includes(t)))
      .slice(0, Math.min(options.limit ?? 300, 5000))
      .map((r) => ({
        id: r.id,
        job: JSON.parse(r.body) as Job,
        status: r.status,
        firstSeen: r.first_seen,
        lastSeen: r.last_seen,
        duplicateCluster: r.canonical_url,
      }));
  }
  findJob(id: string): { job: Job; canonicalUrl: string } | null {
    const row = this.db
      .prepare('SELECT body,canonical_url FROM discovery_jobs WHERE id=?')
      .get(id) as any;
    return row ? { job: JSON.parse(row.body), canonicalUrl: row.canonical_url } : null;
  }
  recordVerification(id: string, expectedUrl: string, value: Verification, updated?: Job): boolean {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row = this.db
        .prepare('SELECT canonical_url,hash FROM discovery_jobs WHERE id=?')
        .get(id) as any;
      if (!row || row.canonical_url !== expectedUrl) {
        this.db.exec('ROLLBACK');
        return false;
      }
      this.db
        .prepare('INSERT INTO discovery_verifications(job_id,body,observed_at) VALUES(?,?,?)')
        .run(id, JSON.stringify(value), value.observedAt);
      if (value.status === 'closed')
        this.db.prepare("UPDATE discovery_jobs SET status='closed' WHERE id=?").run(id);
      if (value.status === 'observed_open' && updated) {
        const hash = contentHash(updated);
        this.db
          .prepare(
            "UPDATE discovery_jobs SET body=?,hash=?,status='open',last_seen=?,missing_polls=0 WHERE id=?",
          )
          .run(JSON.stringify(updated), hash, value.observedAt, id);
        if (hash !== row.hash)
          this.db
            .prepare(
              'INSERT INTO discovery_snapshots(job_id,hash,body,observed_at) VALUES(?,?,?,?)',
            )
            .run(id, hash, JSON.stringify(updated), value.observedAt);
      }
      this.db.exec('COMMIT');
      return true;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
  runs() {
    return this.db.prepare('SELECT * FROM discovery_runs ORDER BY started_at DESC LIMIT 50').all();
  }
  addFrontier(url: string, origin: string) {
    const canonical = canonicalUrl(url);
    this.db
      .prepare('INSERT OR IGNORE INTO discovery_frontier(url,origin,observed_at) VALUES(?,?,?)')
      .run(canonical, origin, new Date().toISOString());
  }
  frontier() {
    return this.db
      .prepare('SELECT * FROM discovery_frontier ORDER BY observed_at DESC LIMIT 1000')
      .all();
  }
}
