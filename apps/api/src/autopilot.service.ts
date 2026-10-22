import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { baselineFitScore, evaluateEligibility } from '@pursuit/shared';
import type { AutopilotConfig, AutopilotRun, Prisma } from '@pursuit/database';
import type { SessionPrincipal } from './auth.service';
import { DbService } from './db.service';
import { WorkflowService } from './workflow.service';
import { CareersService } from './careers.service';
import { ConnectionsService } from './connections.service';

export const AutopilotSettings = z
  .object({
    revision: z.number().int().positive(),
    enabled: z.boolean(),
    mode: z.enum(['research', 'prepare', 'apply']),
    boards: z.array(z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/)).max(5),
    keywords: z.array(z.string().trim().min(1).max(100)).max(20),
    interval_minutes: z.number().int().min(60).max(1440),
    max_drafts: z.number().int().min(1).max(5),
    min_fit: z.number().int().min(0).max(100),
    connection_id: z.string().uuid().nullable(),
    resume: z.string().max(30000),
  })
  .strict();
export type AutopilotSettingsInput = z.infer<typeof AutopilotSettings>;
export interface AutopilotStatus {
  settings: {
    revision: number;
    enabled: boolean;
    mode: string;
    boards: Prisma.JsonValue;
    keywords: Prisma.JsonValue;
    interval_minutes: number;
    max_drafts: number;
    min_fit: number;
    connection_id: string | null;
    resume: string;
  };
  next_run_at: Date | null;
  running: boolean;
  capabilities: {
    research: boolean;
    prepare: boolean;
    apply: boolean;
    notifications: string;
    requires_running_server: boolean;
  };
  runs: AutopilotRun[];
}
const LEASE_MS = 15 * 60_000;

@Injectable()
export class AutopilotService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private busy = false;
  private readonly logger = new Logger(AutopilotService.name);
  constructor(
    private readonly db: DbService,
    private readonly workflow: WorkflowService,
    private readonly careers: CareersService,
    private readonly connections: ConnectionsService,
  ) {}

  onModuleInit() {
    if (process.env['NODE_ENV'] === 'test' || process.env['AUTOPILOT_WORKER_ENABLED'] === 'false')
      return;
    this.timer = setInterval(() => {
      void this.tick().catch(() =>
        this.logger.error(
          'Autopilot worker could not poll; check database connectivity and migrations.',
        ),
      );
    }, 30_000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  private scope(a: Pick<SessionPrincipal, 'tenantId' | 'userId'>) {
    return { tenantId: a.tenantId, userId: a.userId };
  }
  private config(a: SessionPrincipal) {
    const scope = this.scope(a);
    return this.db.db.autopilotConfig.upsert({
      where: { tenantId_userId: scope },
      create: scope,
      update: {},
    });
  }
  async status(a: SessionPrincipal): Promise<AutopilotStatus> {
    const c = await this.config(a);
    const runs = await this.db.db.autopilotRun.findMany({
      where: { configId: c.id },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
    return {
      settings: {
        revision: c.revision,
        enabled: c.enabled,
        mode: c.mode,
        boards: c.boards,
        keywords: c.keywords,
        interval_minutes: c.intervalMinutes,
        max_drafts: c.maxDrafts,
        min_fit: c.minFit,
        connection_id: c.connectionId,
        resume: c.resume,
      },
      next_run_at: c.nextRunAt,
      running: Boolean(c.leaseUntil && c.leaseUntil > new Date()),
      capabilities: {
        research: true,
        prepare: true,
        apply: false,
        notifications: 'in_app',
        requires_running_server: true,
      },
      runs,
    };
  }
  async save(a: SessionPrincipal, input: AutopilotSettingsInput): Promise<AutopilotStatus> {
    if (input.mode === 'apply')
      throw new BadRequestException({
        error: 'automatic_applications_unavailable',
        detail:
          'A verified application executor is not installed. Research and draft preparation are available.',
      });
    if (input.enabled && !input.boards.length)
      throw new BadRequestException({ error: 'add_a_greenhouse_board_first' });
    if (input.enabled && input.mode === 'prepare') {
      if (!input.connection_id || input.resume.trim().length < 50)
        throw new BadRequestException({ error: 'resume_and_tested_model_required' });
      const connection = await this.connections.get(a, input.connection_id);
      if (!connection.model || !connection.testedAt)
        throw new BadRequestException({ error: 'test_model_connection_first' });
    }
    const c = await this.config(a);
    const updated = await this.db.db.autopilotConfig.updateMany({
      where: { id: c.id, ...this.scope(a), revision: input.revision },
      data: {
        enabled: input.enabled,
        mode: input.mode,
        boards: [...new Set(input.boards)],
        keywords: input.keywords,
        intervalMinutes: input.interval_minutes,
        maxDrafts: input.max_drafts,
        minFit: input.min_fit,
        connectionId: input.connection_id,
        resume: input.resume,
        revision: { increment: 1 },
        nextRunAt: input.enabled ? new Date() : null,
      },
    });
    if (!updated.count) throw new ConflictException({ error: 'autopilot_changed_reload' });
    return this.status(a);
  }
  async pause(a: SessionPrincipal): Promise<AutopilotStatus> {
    await this.db.db.autopilotConfig.updateMany({
      where: this.scope(a),
      data: { enabled: false, nextRunAt: null, revision: { increment: 1 } },
    });
    return this.status(a);
  }
  async runSoon(a: SessionPrincipal) {
    const c = await this.config(a);
    if (!c.enabled) throw new BadRequestException({ error: 'enable_autopilot_first' });
    const updated = await this.db.db.autopilotConfig.updateMany({
      where: {
        id: c.id,
        ...this.scope(a),
        enabled: true,
        OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
      },
      data: { nextRunAt: new Date() },
    });
    if (!updated.count) throw new ConflictException({ error: 'autopilot_already_running' });
    return { queued: true };
  }
  async tick() {
    if (this.busy) return;
    this.busy = true;
    try {
      const due = await this.db.db.autopilotConfig.findMany({
        where: {
          enabled: true,
          nextRunAt: { lte: new Date() },
          OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
        },
        orderBy: { nextRunAt: 'asc' },
        take: 5,
      });
      for (const candidate of due) {
        const token = randomUUID();
        const claim = await this.db.db.autopilotConfig.updateMany({
          where: {
            id: candidate.id,
            revision: candidate.revision,
            enabled: true,
            nextRunAt: { lte: new Date() },
            OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
          },
          data: { leaseToken: token, leaseUntil: new Date(Date.now() + LEASE_MS) },
        });
        if (claim.count) await this.execute(candidate, token);
      }
    } finally {
      this.busy = false;
    }
  }
  private async stillActive(c: AutopilotConfig, token: string) {
    return Boolean(
      await this.db.db.autopilotConfig.findFirst({
        where: {
          id: c.id,
          enabled: true,
          revision: c.revision,
          leaseToken: token,
          leaseUntil: { gt: new Date() },
        },
      }),
    );
  }
  private async execute(c: AutopilotConfig, token: string) {
    let runId: string | undefined;
    let attempts = 0;
    let discovered = 0,
      prepared = 0,
      skipped = 0;
    const summary: { board?: string; job_id?: string; status: string }[] = [];
    let status = 'COMPLETED';
    try {
      await this.db.db.autopilotRun.updateMany({
        where: { configId: c.id, status: 'RUNNING' },
        data: { status: 'INTERRUPTED', finishedAt: new Date() },
      });
      const run = await this.db.db.autopilotRun.create({ data: { configId: c.id } });
      runId = run.id;
      const user = await this.db.db.user.findUniqueOrThrow({ where: { id: c.userId } });
      const membership = await this.db.db.membership.findUnique({
        where: { tenantId_userId: { tenantId: c.tenantId, userId: c.userId } },
      });
      if (!membership) throw new Error('membership_revoked');
      const a: SessionPrincipal = {
        tenantId: c.tenantId,
        userId: c.userId,
        email: user.email,
        displayName: user.displayName,
        sessionId: 'autopilot',
      };
      const profile = await this.careers.getProfile(c.userId, c.tenantId);
      const seen = new Set<string>();
      for (const board of c.boards as string[]) {
        if (!(await this.stillActive(c, token))) {
          status = 'PAUSED';
          break;
        }
        let items;
        try {
          items = (await this.workflow.discover(a, board)).items;
        } catch {
          summary.push({ board, status: 'SOURCE_FAILED' });
          status = 'PARTIAL';
          continue;
        }
        for (const item of items) {
          if (seen.has(item.job.id)) continue;
          seen.add(item.job.id);
          discovered++;
          if (!(await this.stillActive(c, token))) {
            status = 'PAUSED';
            break;
          }
          const job = item.job;
          const source = await this.db.db.jobSnapshot.findFirst({
            where: { jobId: job.id },
            orderBy: { observedAt: 'desc' },
          });
          const keywords = c.keywords as string[];
          if (
            keywords.length &&
            !keywords.some((k) => job.title.toLowerCase().includes(k.toLowerCase()))
          ) {
            skipped++;
            continue;
          }
          const eligibility = evaluateEligibility({
            job: {
              title: job.title,
              location: job.location,
              remote_restrictions: job.remote_restrictions,
              description: source?.description ?? null,
              compensation: job.compensation,
            },
            profile,
          });
          const fit = baselineFitScore(
            { title: job.title, description: source?.description ?? null },
            { skills: profile.skills, role_families: profile.role_families },
          );
          if (eligibility.eligibility !== 'VERIFIED_ELIGIBLE' || fit.score < c.minFit) {
            skipped++;
            continue;
          }
          if (c.mode === 'research') {
            summary.push({ job_id: job.id, status: 'MATCHED' });
            continue;
          }
          if (attempts >= c.maxDrafts) {
            skipped++;
            continue;
          }
          const key = `autopilot:${c.id}:${job.id}`;
          const existing = await this.db.db.workflowDraft.findUnique({
            where: { automationKey: key },
          });
          const app = await this.db.db.application.findUnique({
            where: { tenantId_jobId: { tenantId: c.tenantId, jobId: job.id } },
          });
          if (existing || app) {
            skipped++;
            continue;
          }
          attempts++;
          try {
            await this.workflow.prepare(
              a,
              { job_id: job.id, connection_id: c.connectionId!, resume: c.resume },
              { key, configId: c.id, revision: c.revision, leaseToken: token },
            );
            prepared++;
            summary.push({ job_id: job.id, status: 'DRAFT_READY' });
          } catch {
            if (!(await this.stillActive(c, token))) {
              status = 'PAUSED';
              break;
            }
            summary.push({ job_id: job.id, status: 'PREPARATION_FAILED' });
            status = 'PARTIAL';
          }
        }
        if (status === 'PAUSED') break;
      }
    } catch {
      status = 'FAILED';
      summary.push({ status: 'RUN_FAILED_CHECK_CONFIGURATION' });
    } finally {
      if (runId) {
        await this.db.db.$transaction(async (tx) => {
          await tx.autopilotRun.update({
            where: { id: runId },
            data: { status, discovered, prepared, skipped, summary, finishedAt: new Date() },
          });
          await tx.notification.create({
            data: {
              tenantId: c.tenantId,
              userId: c.userId,
              type: 'AUTOPILOT_COMPLETED',
              entityRef: `autopilot:${runId}`,
              title:
                status === 'COMPLETED'
                  ? 'Career research finished'
                  : `Career research: ${status.toLowerCase()}`,
              body: `Checked ${discovered} postings; prepared ${prepared} drafts; skipped ${skipped}. No applications were submitted. View Autopilot for results and source errors.`,
            },
          });
        });
      }
      await this.db.db.autopilotConfig.updateMany({
        where: { id: c.id, leaseToken: token, revision: c.revision, enabled: true },
        data: {
          nextRunAt: new Date(Date.now() + c.intervalMinutes * 60_000),
        },
      });
      // A newer save/pause owns nextRunAt; only release this worker's lease.
      await this.db.db.autopilotConfig.updateMany({
        where: { id: c.id, leaseToken: token },
        data: { leaseToken: null, leaseUntil: null },
      });
      // Notification persists before the event; a disconnected browser sees it on its next visit.
      if (runId) await this.db.emit(c.tenantId, 'autopilot.finished', null, { user_id: c.userId });
    }
  }
}
