import { z } from 'zod';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import {
  DiscoveryStore,
  DiscoveryEngine,
  SearchProfile,
  Source,
  sourceFromUrl,
  createReader,
  assess,
  canonicalUrl,
  type Reader,
} from '@pursuit/discovery';
import {
  ApplicationQueue,
  AshbyAdapter,
  formHash,
  missingAnswers,
  resolveApplication,
  type ApplicationAdapter,
  type Form,
} from '@pursuit/application';
import { Packet, Resume, validatePacket, digest } from '@pursuit/tailoring';
import type {
  EngineSnapshot,
  EngineProgress,
  SourcedOpportunity,
  ExecutionPlan,
} from './contracts.js';
const id = z.string().min(1).max(200);
function canonicalJobUrl(raw: string) {
  const url = new URL(canonicalUrl(raw));
  if (url.hostname === 'jobs.ashbyhq.com')
    url.pathname = url.pathname.replace(/\/application\/?$/, '').replace(/\/$/, '');
  return url.toString();
}
const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const Request = z.discriminatedUnion('action', [
  z.object({ action: z.literal('snapshot') }).strict(),
  z.object({ action: z.literal('search'), profile: SearchProfile }).strict(),
  z
    .object({
      action: z.literal('source.add'),
      url: z.url().max(2000),
      company: z.string().trim().min(1).max(300).optional(),
    })
    .strict(),
  z.object({ action: z.literal('source.toggle'), id, enabled: z.boolean() }).strict(),
  z.object({ action: z.literal('opportunity'), id }).strict(),
  z
    .object({
      action: z.literal('packet.register'),
      jobId: id,
      resume: Resume,
      packet: Packet,
      pdfHash: hash,
      pdfBase64: z.string().max(3_400_000),
    })
    .strict(),
  z.object({ action: z.literal('application.inspect'), packetHash: hash }).strict(),
  z
    .object({
      action: z.literal('application.stage'),
      packetHash: hash,
      formHash: hash,
      answers: z.record(z.string().max(200), z.union([z.string().max(10000), z.boolean()])),
      eligibilityConfirmed: z.literal(true),
    })
    .strict(),
  z.object({ action: z.literal('application.review'), id }).strict(),
  z.object({ action: z.literal('application.lookup'), jobId: id }).strict(),
  z.object({ action: z.literal('application.authorize'), id, expectedHash: hash }).strict(),
  z.object({ action: z.literal('application.run'), id }).strict(),
  z.object({ action: z.literal('application.pause') }).strict(),
  z
    .object({
      action: z.literal('application.policy'),
      enabled: z.boolean(),
      dailyLimit: z.number().int().min(1).max(100),
    })
    .strict(),
]);
export class CareerEngine {
  readonly discovery: DiscoveryStore;
  private engine: DiscoveryEngine;
  private queue: ApplicationQueue;
  private db: DatabaseSync;
  private read: Reader;
  constructor(
    private root: string,
    private options: {
      read?: Reader;
      progress?: (event: EngineProgress) => void;
      browserExecutable?: string;
      executionEnabled?: boolean;
      adapter?: (url: string) => Promise<ApplicationAdapter>;
    } = {},
  ) {
    mkdirSync(root, { recursive: true, mode: 0o700 });
    this.discovery = new DiscoveryStore(join(root, 'discovery.sqlite'));
    this.read = options.read ?? createReader();
    this.engine = new DiscoveryEngine(this.discovery, this.read);
    this.queue = new ApplicationQueue(join(root, 'applications.sqlite'));
    const path = join(root, 'packets.sqlite');
    this.db = new DatabaseSync(path);
    chmodSync(path, 0o600);
    this.db
      .exec(`PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS packets(hash TEXT PRIMARY KEY,job_id TEXT NOT NULL,packet TEXT NOT NULL,source TEXT NOT NULL,pdf BLOB NOT NULL,pdf_hash TEXT NOT NULL,form TEXT);`);
  }
  close() {
    this.discovery.close();
    this.queue.close();
    this.db.close();
  }
  private setting(key: string, fallback: unknown) {
    const row = this.db.prepare('SELECT value FROM settings WHERE key=?').get(key) as any;
    return row ? JSON.parse(row.value) : fallback;
  }
  private put(key: string, value: unknown) {
    this.db
      .prepare(
        'INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      )
      .run(key, JSON.stringify(value));
  }
  private profile() {
    return SearchProfile.parse(this.setting('profile', {}));
  }
  snapshot(): EngineSnapshot {
    return {
      profile: this.profile(),
      sources: this.discovery.sources().map((s) => ({
        id: s.id,
        company: s.config.company,
        provider: s.config.provider,
        enabled: s.config.enabled,
        lastSuccess: s.last_success,
        lastError: s.last_error,
      })),
      matches: this.engine.matches(this.profile(), 300).map((r) => ({
        id: r.id,
        company: r.job.company,
        title: r.job.title,
        location: r.job.location ?? 'Location not specified',
        url: r.job.sourceUrl,
        observedAt: r.lastSeen,
        status: r.status,
        assessment: r.assessment,
      })),
      runs: this.discovery
        .runs()
        .slice(0, 20)
        .map((r: any) => ({ ...r, diagnostics: JSON.parse(r.diagnostics) })),
      policy: this.setting('policy', { enabled: false, dailyLimit: 100 }),
      plans: this.queue.list().map((r) => {
        const { payload, ...summary } = this.plan(String(r.id));
        return { ...summary, jobUrl: payload.jobUrl };
      }),
    };
  }
  private plan(id: string): ExecutionPlan {
    const row = this.queue.get(id);
    return {
      id: row.id,
      state: row.state,
      payload_hash: row.payload_hash,
      last_error: row.last_error,
      payload: row.payload,
      receipt: row.receipt,
      approval_until: row.approval_until,
    };
  }
  private opportunity(jobId: string): SourcedOpportunity {
    const row = this.discovery.findJob(jobId);
    if (!row) throw Error('job_not_found');
    const j = row.job;
    if (j.description.length > 40000 || j.title.length > 300)
      throw Error('posting_exceeds_review_limit');
    const assessment = assess(j, this.profile());
    return {
      id: jobId,
      company: j.company,
      role: j.title,
      location: j.location ?? 'Location not specified',
      salary: j.compensation
        ? `${j.compensation.currency} ${j.compensation.min ?? '?'}–${j.compensation.max ?? '?'} / ${j.compensation.unit}`
        : 'Not specified',
      posting: j.description,
      status: 'Review',
      reason: [...assessment.reasons, ...assessment.unknowns].join(' '),
      discovery: { jobId, url: j.sourceUrl, observedAt: j.evidence.observedAt, assessment },
    };
  }
  private storedPacket(packetHash: string) {
    const row = this.db.prepare('SELECT * FROM packets WHERE hash=?').get(packetHash) as any;
    if (!row) throw Error('saved_packet_not_found');
    return { ...row, packet: Packet.parse(JSON.parse(row.packet)), pdf: new Uint8Array(row.pdf) };
  }
  private async current(packetHash: string) {
    const stored = this.storedPacket(packetHash);
    const result = await this.engine.verify(stored.job_id);
    if (result.status !== 'observed_open') throw Error('posting_not_verified_open');
    const role = this.opportunity(stored.job_id);
    if (role.discovery.assessment.eligibility === 'ineligible') throw Error('role_ineligible');
    if (
      role.posting !== stored.packet.role.description ||
      role.role !== stored.packet.role.title ||
      role.company !== stored.packet.role.company
    )
      throw Error('posting_changed_retailor_required');
    const resolved = await resolveApplication(role.discovery.url, this.read);
    if (resolved.status !== 'resolved' || resolved.route !== 'ashby_hosted')
      throw Error('application_route_requires_manual_review');
    if (resolved.job.description !== role.posting) throw Error('posting_changed_retailor_required');
    return { stored, url: resolved.applyUrl ?? resolved.job.sourceUrl };
  }
  private adapter(url: string) {
    if (this.options.adapter) return this.options.adapter(url);
    if (!this.options.browserExecutable) throw Error('configure_browser_executable');
    return AshbyAdapter.launch(url, this.options.browserExecutable);
  }
  async dispatch(input: unknown): Promise<unknown> {
    const req = Request.parse(input);
    switch (req.action) {
      case 'snapshot':
        return this.snapshot();
      case 'source.add': {
        if (this.discovery.sources().length >= 30)
          throw Error('source_limit_reached_reuse_existing_sources');
        const url = new URL(req.url);
        if (url.protocol !== 'https:' || url.username || url.password)
          throw Error('public_https_source_required');
        const source =
          sourceFromUrl(req.url) ??
          Source.parse({
            id: `page:${await digest(req.url)}`,
            provider: 'page',
            url: req.url,
            company: url.hostname,
          });
        this.discovery.addSource(req.company ? { ...source, company: req.company } : source);
        return this.snapshot();
      }
      case 'source.toggle':
        this.discovery.setEnabled(req.id, req.enabled);
        return this.snapshot();
      case 'search': {
        if (!req.profile.roles.length) throw Error('choose_target_roles');
        this.put('profile', req.profile);
        this.options.progress?.({
          phase: 'discovering',
          message: 'Preparing public job-board searches. No model calls.',
        });
        await this.engine.discover(req.profile, undefined, 3);
        const due = this.discovery
          .sources()
          .filter((s) => s.config.enabled && s.next_poll <= new Date().toISOString());
        const selected = due.slice(0, 6);
        let completed = 0;
        for (const source of selected) {
          this.options.progress?.({
            phase: 'sourcing',
            message: `Checking ${source.config.company} (${source.config.provider})`,
            completed,
            total: selected.length,
          });
          await this.engine.poll(source.id, 2);
          completed++;
        }
        this.options.progress?.({
          phase: 'complete',
          message: `Checked ${completed} sources. ${Math.max(0, due.length - completed)} deferred; failures and partial runs are listed below.`,
          completed,
          total: selected.length,
        });
        return this.snapshot();
      }
      case 'opportunity':
        return this.opportunity(req.id);
      case 'packet.register': {
        const packet = await validatePacket(req.packet, req.resume);
        const job = this.opportunity(req.jobId);
        if (
          packet.role.id !== job.id ||
          packet.role.description !== job.posting ||
          packet.role.title !== job.role ||
          packet.role.company !== job.company
        )
          throw Error('packet_role_changed');
        const pdf = Buffer.from(req.pdfBase64, 'base64');
        if (
          pdf.length > 2_500_000 ||
          pdf.subarray(0, 5).toString() !== '%PDF-' ||
          (await digest(pdf)) !== req.pdfHash
        )
          throw Error('pdf_changed');
        const packetHash = await digest(JSON.stringify(packet));
        const existing = this.db
          .prepare('SELECT pdf_hash FROM packets WHERE hash=?')
          .get(packetHash) as any;
        if (existing && existing.pdf_hash !== req.pdfHash)
          throw Error('packet_pdf_changed_prepare_new_packet');
        this.db
          .prepare(
            'INSERT OR IGNORE INTO packets(hash,job_id,packet,source,pdf,pdf_hash) VALUES(?,?,?,?,?,?)',
          )
          .run(
            packetHash,
            job.id,
            JSON.stringify(packet),
            JSON.stringify(req.resume),
            pdf,
            req.pdfHash,
          );
        return { packetHash, pdfHash: req.pdfHash, jobId: job.id };
      }
      case 'application.inspect': {
        const { stored, url } = await this.current(req.packetHash);
        const adapter = await this.adapter(url);
        try {
          const form = await adapter.observe();
          if (canonicalJobUrl(form.url) !== canonicalJobUrl(url))
            throw Error('application_role_changed');
          this.db
            .prepare('UPDATE packets SET form=? WHERE hash=?')
            .run(JSON.stringify(form), req.packetHash);
          return {
            form,
            formHash: await formHash(form),
            packetHash: req.packetHash,
            pdfHash: stored.pdf_hash,
          };
        } finally {
          await adapter.close();
        }
      }
      case 'application.stage': {
        const stored = this.storedPacket(req.packetHash);
        if (!stored.form) throw Error('inspect_application_first');
        const form = JSON.parse(stored.form) as Form;
        if ((await formHash(form)) !== req.formHash) throw Error('form_changed_review_required');
        if (this.opportunity(stored.job_id).discovery.assessment.eligibility === 'ineligible')
          throw Error('role_ineligible');
        const payload = {
          personId: 'local-user',
          jobUrl: canonicalJobUrl(this.opportunity(stored.job_id).discovery.url),
          packetHash: req.packetHash,
          pdfHash: stored.pdf_hash,
          answers: req.answers,
          formHash: req.formHash,
        };
        if (
          Object.keys(req.answers).some(
            (key) => !form.fields.some((field) => field.id === key && field.type !== 'file'),
          )
        )
          throw Error('unknown_application_answer');
        if (missingAnswers(form, payload).length) throw Error('required_answers_missing');
        const prior = await this.queue.find('local-user', payload.jobUrl);
        const row =
          prior && ['DRAFT', 'NEEDS_USER'].includes(prior.state)
            ? await this.queue.revise(prior.id, payload)
            : await this.queue.add(payload);
        return this.plan(row.id);
      }
      case 'application.lookup': {
        const url = canonicalJobUrl(this.opportunity(req.jobId).discovery.url);
        const row = await this.queue.find('local-user', url);
        const policy = this.setting('policy', { enabled: false, dailyLimit: 100 });
        if (!row) return { policy, plan: null };
        const reviewed = (await this.dispatch({ action: 'application.review', id: row.id })) as {
          plan: ExecutionPlan;
          packet: Packet;
          form: Form;
        };
        return { ...reviewed, policy };
      }
      case 'application.review': {
        const plan = this.plan(req.id);
        const stored = this.storedPacket(plan.payload.packetHash);
        if (!stored.form || (await formHash(JSON.parse(stored.form))) !== plan.payload.formHash)
          throw Error('form_changed_review_required');
        return { plan, packet: stored.packet, form: JSON.parse(stored.form) };
      }
      case 'application.authorize': {
        if (!this.options.executionEnabled) throw Error('enable_application_execution_in_setup');
        this.queue.authorize(req.id, req.expectedHash);
        return this.plan(req.id);
      }
      case 'application.pause': {
        const policy = this.setting('policy', { enabled: false, dailyLimit: 100 });
        this.queue.policy(false, policy.dailyLimit);
        this.put('policy', { ...policy, enabled: false });
        return { enabled: false, dailyLimit: policy.dailyLimit };
      }
      case 'application.policy': {
        if (req.enabled && !this.options.executionEnabled)
          throw Error('enable_application_execution_in_setup');
        this.queue.policy(req.enabled, req.dailyLimit);
        this.put('policy', { enabled: req.enabled, dailyLimit: req.dailyLimit });
        return this.snapshot();
      }
      case 'application.run': {
        if (!this.options.executionEnabled) throw Error('enable_application_execution_in_setup');
        const row = this.queue.get(req.id);
        if (!this.queue.ready(req.id)) return this.plan(req.id);
        try {
          const { stored, url } = await this.current(row.payload.packetHash);
          if ((await digest(stored.pdf)) !== row.payload.pdfHash) throw Error('pdf_changed');
          await this.queue.run(req.id, stored.pdf, () => this.adapter(url));
          return this.plan(req.id);
        } catch (error) {
          this.queue.hold(req.id, 'posting_or_packet_needs_review');
          throw error;
        }
      }
    }
  }
}
