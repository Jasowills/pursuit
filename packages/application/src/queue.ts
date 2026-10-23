import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Payload, type ApplicationAdapter } from './contracts.js';
import { formHash, payloadHash, missingAnswers } from './plan.js';
import { digest } from '@pursuit/tailoring';
import { canonicalUrl } from '@pursuit/discovery';
export class ApplicationQueue {
  private db: DatabaseSync;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    if (path !== ':memory:') chmodSync(path, 0o600);
    this.db.exec(`PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS apply_jobs(id TEXT PRIMARY KEY,identity TEXT UNIQUE NOT NULL,payload TEXT NOT NULL,payload_hash TEXT NOT NULL,state TEXT NOT NULL,approval TEXT,approval_until TEXT,lease TEXT,lease_until TEXT,receipt TEXT,last_error TEXT,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS apply_attempts(id TEXT PRIMARY KEY,job_id TEXT NOT NULL,day TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS apply_policy(id INTEGER PRIMARY KEY CHECK(id=1),enabled INTEGER NOT NULL DEFAULT 0,daily_limit INTEGER NOT NULL DEFAULT 100); INSERT OR IGNORE INTO apply_policy(id) VALUES(1);`);
    this.recover();
  }
  private recover() {
    const now = new Date().toISOString();
    this.db
      .prepare(
        "UPDATE apply_jobs SET state='UNCERTAIN',last_error='interrupted_submission' WHERE state='SUBMITTING' AND lease_until < ?",
      )
      .run(now);
    this.db
      .prepare(
        "UPDATE apply_jobs SET state='DRAFT',approval=NULL,approval_until=NULL,lease=NULL,lease_until=NULL,last_error='interrupted_preparation' WHERE state='PREPARING' AND lease_until < ?",
      )
      .run(now);
    this.db
      .prepare(
        "UPDATE apply_jobs SET state='DRAFT',approval=NULL,last_error='approval_expired' WHERE state='AUTHORIZED' AND approval_until < ?",
      )
      .run(now);
  }

  close() {
    this.db.close();
  }
  policy(enabled: boolean, dailyLimit = 100) {
    if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 100)
      throw new Error('invalid_daily_limit');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db
        .prepare('UPDATE apply_policy SET enabled=?,daily_limit=? WHERE id=1')
        .run(Number(enabled), dailyLimit);
      if (!enabled)
        this.db
          .prepare(
            "UPDATE apply_jobs SET state='DRAFT',approval=NULL,approval_until=NULL,lease=NULL,lease_until=NULL WHERE state IN ('AUTHORIZED','PREPARING')",
          )
          .run();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  executionPolicy(): { enabled: boolean; dailyLimit: number } {
    const row = this.db.prepare('SELECT enabled,daily_limit FROM apply_policy WHERE id=1').get() as
      { enabled: number; daily_limit: number } | undefined;
    if (
      !row ||
      ![0, 1].includes(row.enabled) ||
      !Number.isInteger(row.daily_limit) ||
      row.daily_limit < 1 ||
      row.daily_limit > 100
    )
      throw new Error('invalid_saved_execution_policy');
    return { enabled: row.enabled === 1, dailyLimit: row.daily_limit };
  }
  async find(personId: string, jobUrl: string) {
    const identity = await digest(personId + '\0' + canonicalUrl(jobUrl));
    const row = this.db.prepare('SELECT id FROM apply_jobs WHERE identity=?').get(identity) as
      { id: string } | undefined;
    return row ? this.get(row.id) : undefined;
  }
  async add(input: unknown) {
    const payload = Payload.parse(input);
    const identity = await digest(payload.personId + '\0' + canonicalUrl(payload.jobUrl));
    const id = randomUUID();
    const hash = await payloadHash(payload);
    const old = this.db
      .prepare('SELECT id,payload_hash,state FROM apply_jobs WHERE identity=?')
      .get(identity) as any;
    if (old) {
      if (old.payload_hash !== hash) throw new Error('application_already_exists_review_previous');
      return this.get(old.id);
    }
    this.db
      .prepare(
        "INSERT INTO apply_jobs(id,identity,payload,payload_hash,state,updated_at) VALUES(?,?,?,?,'DRAFT',?)",
      )
      .run(id, identity, JSON.stringify(payload), hash, new Date().toISOString());
    return this.get(id);
  }
  hold(id: string, reason: string) {
    this.db
      .prepare(
        "UPDATE apply_jobs SET state='NEEDS_USER',approval=NULL,last_error=? WHERE id=? AND state='AUTHORIZED'",
      )
      .run(reason, id);
  }
  list() {
    return this.db
      .prepare(
        'SELECT id,state,payload_hash,last_error,updated_at FROM apply_jobs ORDER BY updated_at DESC LIMIT 100',
      )
      .all();
  }
  get(id: string) {
    const row = this.db.prepare('SELECT * FROM apply_jobs WHERE id=?').get(id) as any;
    if (!row) throw new Error('application_not_found');
    return {
      ...row,
      payload: Payload.parse(JSON.parse(row.payload)),
      receipt: row.receipt ? JSON.parse(row.receipt) : null,
    };
  }
  async revise(id: string, input: unknown) {
    const payload = Payload.parse(input);
    const old = this.get(id);
    if (
      old.payload.personId !== payload.personId ||
      canonicalUrl(old.payload.jobUrl) !== canonicalUrl(payload.jobUrl)
    )
      throw new Error('application_identity_changed');
    const hash = await payloadHash(payload);
    const changed = this.db
      .prepare(
        "UPDATE apply_jobs SET payload=?,payload_hash=?,state='DRAFT',approval=NULL,last_error=NULL WHERE id=? AND state IN ('DRAFT','NEEDS_USER')",
      )
      .run(JSON.stringify(payload), hash, id);
    if (!changed.changes) throw new Error('application_locked');
    return this.get(id);
  }
  authorize(id: string, expectedHash: string) {
    const changed = this.db
      .prepare(
        "UPDATE apply_jobs SET state='AUTHORIZED',approval=payload_hash,approval_until=? WHERE id=? AND payload_hash=? AND state='DRAFT'",
      )
      .run(new Date(Date.now() + 30 * 60000).toISOString(), id, expectedHash);
    if (!changed.changes) throw new Error('application_changed_or_locked');
    return this.get(id);
  }
  ready(id: string) {
    const row = this.get(id);
    const p = this.executionPolicy();
    const count = this.db
      .prepare('SELECT count(*) AS n FROM apply_attempts WHERE day=?')
      .get(new Date().toISOString().slice(0, 10)) as any;
    return Boolean(
      p.enabled &&
      row.state === 'AUTHORIZED' &&
      row.approval === row.payload_hash &&
      row.approval_until > new Date().toISOString() &&
      Number(count.n) < p.dailyLimit,
    );
  }
  private claim(id: string) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      // A crashed submission is ambiguous: never put it back into the execution queue.
      this.db
        .prepare(
          "UPDATE apply_jobs SET state='UNCERTAIN',last_error='interrupted_submission' WHERE state='SUBMITTING' AND lease_until < ?",
        )
        .run(new Date().toISOString());
      this.db
        .prepare(
          "UPDATE apply_jobs SET state='DRAFT',approval=NULL,approval_until=NULL,lease=NULL,lease_until=NULL,last_error='interrupted_preparation' WHERE state='PREPARING' AND lease_until < ?",
        )
        .run(new Date().toISOString());
      const row = this.get(id);
      const policy = this.executionPolicy();
      const day = new Date().toISOString().slice(0, 10);
      const count = this.db
        .prepare('SELECT count(*) AS n FROM apply_attempts WHERE day=?')
        .get(day) as any;
      if (
        this.db
          .prepare(
            "SELECT 1 FROM apply_jobs WHERE state IN ('PREPARING','SUBMITTING') AND lease_until>? LIMIT 1",
          )
          .get(new Date().toISOString()) ||
        !policy.enabled ||
        row.state !== 'AUTHORIZED' ||
        row.approval !== row.payload_hash ||
        !row.approval_until ||
        row.approval_until < new Date().toISOString() ||
        Number(count.n) >= policy.dailyLimit
      ) {
        this.db.exec('COMMIT');
        return null;
      }
      const token = randomUUID();
      this.db
        .prepare(
          "UPDATE apply_jobs SET state='PREPARING',lease=?,lease_until=?,updated_at=? WHERE id=?",
        )
        .run(token, new Date(Date.now() + 15 * 60000).toISOString(), new Date().toISOString(), id);
      this.db
        .prepare('INSERT INTO apply_attempts(id,job_id,day) VALUES(?,?,?)')
        .run(randomUUID(), id, day);
      this.db.exec('COMMIT');
      return { token, payload: row.payload };
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
  async run(
    id: string,
    pdf: Uint8Array,
    adapterInput: ApplicationAdapter | (() => Promise<ApplicationAdapter>),
  ) {
    const claim = this.claim(id);
    if (!claim) {
      if (typeof adapterInput !== 'function') await adapterInput.close();
      return this.get(id);
    }
    let submitting = false;
    let adapter: ApplicationAdapter | undefined;
    try {
      adapter = typeof adapterInput === 'function' ? await adapterInput() : adapterInput;
      if ((await digest(pdf)) !== claim.payload.pdfHash) throw new Error('pdf_changed');
      let form = await adapter.observe();
      if ((await formHash(form)) !== claim.payload.formHash)
        throw new Error('form_changed_review_required');
      if (missingAnswers(form, claim.payload).length) throw new Error('answers_required');
      await adapter.fill(claim.payload, pdf);
      form = await adapter.observe();
      if ((await formHash(form)) !== claim.payload.formHash)
        throw new Error('conditional_form_changed_review_required');
      if (missingAnswers(form, claim.payload).length) throw new Error('answers_required');
      const policy = this.db.prepare('SELECT enabled FROM apply_policy WHERE id=1').get() as any;
      if (!policy.enabled) throw new Error('application_execution_paused');
      const changed = this.db
        .prepare(
          "UPDATE apply_jobs SET state='SUBMITTING' WHERE id=? AND state='PREPARING' AND lease=? AND approval=payload_hash AND lease_until>? AND approval_until>? AND EXISTS(SELECT 1 FROM apply_policy WHERE enabled=1)",
        )
        .run(id, claim.token, new Date().toISOString(), new Date().toISOString());
      if (!changed.changes) throw new Error('execution_lease_lost');
      submitting = true;
      const receipt = await adapter.submit();
      if (
        new URL(receipt.url).origin !== new URL(claim.payload.jobUrl).origin ||
        receipt.kind !== 'hosted_confirmation' ||
        receipt.acceptedPostStatus < 200 ||
        receipt.acceptedPostStatus >= 300 ||
        !receipt.text.trim()
      )
        throw new Error('receipt_missing');
      this.db
        .prepare(
          "UPDATE apply_jobs SET state='CONFIRMED',receipt=?,lease=NULL,lease_until=NULL WHERE id=? AND lease=?",
        )
        .run(JSON.stringify(receipt), id, claim.token);
    } catch (e) {
      const message =
        e instanceof Error && /^[a-z_]+$/.test(e.message) ? e.message : 'execution_failed';
      this.db
        .prepare(
          'UPDATE apply_jobs SET state=?,approval=NULL,last_error=?,lease=NULL,lease_until=NULL WHERE id=? AND lease=?',
        )
        .run(submitting ? 'UNCERTAIN' : 'NEEDS_USER', message, id, claim.token);
    } finally {
      await adapter?.close().catch(() => {});
    }
    return this.get(id);
  }
}
