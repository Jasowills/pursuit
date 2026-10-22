/**
 * Careers REST surface (M1). All routes tenant-scoped; mutations are
 * audited; request bodies validated by shared Zod contracts.
 */
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApplicationCreateInput,
  ApplicationStatus,
  AgentStartInput,
  ApprovalCreateInput,
  JobCreateInput,
  WatcherCreateInput,
} from '@pursuit/shared';
import { CareersService } from './careers.service';
import { DbService } from './db.service';
import { createRuntimeFromEnv } from './agent-runtime.factory';
import { ZodValidationPipe } from './zod.pipe';
import { mapNotification, mapResumeVersion, mapWatcher } from './map';

import { authOf } from './ctx';
import { z } from 'zod';

const transitionSchema = z.object({
  to_status: ApplicationStatus,
  reason: z.string().max(500).optional(),
  confirmation_ref: z.string().max(500).optional(),
  evidence_key: z.string().max(200).optional(),
});

const decisionSchema = z.object({ decision: z.enum(['approve', 'reject']) });

const profilePatchSchema = z
  .object({
    location: z.string().max(200).nullable().optional(),
    work_authorization: z
      .array(
        z.object({
          jurisdiction: z.string().min(1),
          status: z.string().min(1),
          verified: z.boolean(),
        }),
      )
      .optional(),
    desired_compensation: z
      .object({ min_amount: z.number().int(), currency: z.string().default('USD') })
      .nullable()
      .optional(),
    role_families: z.array(z.string()).optional(),
    seniority: z.array(z.string()).optional(),
    work_arrangements: z.array(z.string()).optional(),
    hard_exclusions: z.array(z.string()).optional(),
    preferences: z.array(z.string()).optional(),
  })
  .strict();

type ProfilePatch = import('zod').infer<typeof profilePatchSchema>;

type Auth = ReturnType<typeof authOf>;

function au(req: Request): Auth {
  return authOf(req);
}

@Controller()
export class CareersController {
  constructor(
    private readonly svc: CareersService,
    private readonly dbw: DbService,
  ) {}

  /* profile ---------------------------------------------------------------- */

  @Get('profile')
  async getProfile(@Req() req: Request) {
    const a = au(req);
    return {
      user: { id: a.userId, email: a.email, display_name: a.displayName },
      tenant_id: a.tenantId,
      profile: await this.svc.getProfile(a.userId, a.tenantId),
    };
  }

  @Put('profile')
  async putProfile(
    @Req() req: Request,
    @Body(new ZodValidationPipe(profilePatchSchema)) body: Record<string, unknown>,
  ) {
    const a = au(req);
    const existing = await this.svc.getProfile(a.userId, a.tenantId);
    const merged = mergeProfilePatch(existing, body);
    await this.dbw.db.careerProfile.update({
      where: { id: existing.id },
      data: {
        location: merged.location,
        workAuthorization: merged.work_authorization as never,
        desiredCompensation: merged.desired_compensation as never,
        roleFamilies: merged.role_families as never,
        seniority: merged.seniority as never,
        workArrangements: merged.work_arrangements as never,
        hardExclusions: merged.hard_exclusions as never,
        preferences: merged.preferences as never,
      },
    });
    return { profile: merged };
  }

  /* jobs ------------------------------------------------------------------- */

  @Get('jobs')
  async listJobs(@Req() req: Request) {
    const a = au(req);
    const rows = await this.svc.listJobs(a.tenantId);
    return { items: rows };
  }

  @Post('jobs')
  async intake(
    @Req() req: Request,
    @Body(new ZodValidationPipe(JobCreateInput)) body: import('@pursuit/shared').JobCreateInput,
  ) {
    const a = au(req);
    // intakeJob already emits the canonical job.intake outbox event
    await this.svc.getProfile(a.userId, a.tenantId);
    const result = await this.svc.intakeJob(a.tenantId, body);
    return { ...result, dedupe: result.deduped };
  }

  /* applications ------------------------------------------------------------- */

  @Get('applications')
  async listApplications(@Req() req: Request) {
    const a = au(req);
    return { items: await this.svc.listApplications(a.tenantId) };
  }

  @Get('applications/:id')
  async getApplication(@Req() req: Request, @Param('id') id: string) {
    const a = au(req);
    return this.svc.getApplication(a.tenantId, id);
  }

  @Post('applications')
  async createApplication(
    @Req() req: Request,
    @Body(new ZodValidationPipe(ApplicationCreateInput))
    body: { job_id: string; resume_version_id?: string | null },
  ) {
    const a = au(req);
    try {
      const application = await this.svc.createApplication(a.tenantId, a.userId, body);
      return { application };
    } catch (err) {
      if (err instanceof Error && err.message.includes('Unique constraint')) {
        throw new ConflictException({ error: 'application_exists' });
      }
      throw err;
    }
  }

  @Patch('applications/:id/status')
  async transition(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionSchema))
    body: {
      to_status: ApplicationStatus;
      reason?: string;
      confirmation_ref?: string;
      evidence_key?: string;
    },
  ) {
    const a = au(req);
    const result = await this.svc.transitionApplication(
      a.tenantId,
      `user:${a.userId}`,
      id,
      body.to_status,
      body.reason,
      body.confirmation_ref,
      body.evidence_key,
    );
    return result;
  }

  /* watchers ----------------------------------------------------------------- */

  @Get('watchers')
  async listWatchers(@Req() req: Request) {
    const a = au(req);
    const rows = await this.dbw.db.watcher.findMany({
      where: { tenantId: a.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return { items: rows.map((r) => mapWatcher(r)) };
  }

  @Post('watchers')
  async createWatcher(
    @Req() req: Request,
    @Body(new ZodValidationPipe(WatcherCreateInput))
    body: import('@pursuit/shared').WatcherCreateInput,
  ) {
    const a = au(req);
    const row = await this.dbw.db.watcher.create({
      data: {
        tenantId: a.tenantId,
        kind: body.kind,
        sourceUrl: body.source_url,
        frequencyMinutes: body.frequency_minutes,
        keywords: body.keywords as never,
        enabled: body.enabled,
        nextCheckAt: new Date(Date.now() + body.frequency_minutes * 60_000),
      },
    });
    await this.dbw.emit(a.tenantId, 'watcher.created', `watcher:${row.id}`, {
      watcher_id: row.id,
    });
    return { watcher: mapWatcher(row) };
  }

  @Patch('watchers/:id')
  async patchWatcher(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { enabled?: boolean; frequency_minutes?: number },
  ) {
    const a = au(req);
    const existing = await this.dbw.db.watcher.findFirst({
      where: { id, tenantId: a.tenantId },
    });
    if (!existing) throw new NotFoundException({ error: 'watcher_not_found' });
    const row = await this.dbw.db.watcher.update({
      where: { id: existing.id },
      data: {
        enabled: body.enabled ?? undefined,
        frequencyMinutes: body.frequency_minutes ?? undefined,
        nextCheckAt: body.enabled
          ? new Date(Date.now() + existing.frequencyMinutes * 60_000)
          : null,
      },
    });
    return { watcher: mapWatcher(row) };
  }

  /* agent runs + approvals ----------------------------------------------------- */

  @Get('agent/runs')
  async listRuns(@Req() req: Request) {
    const a = au(req);
    return { items: await this.svc.listAgentRuns(a.tenantId) };
  }

  @Get('agent/runs/:id')
  async getRun(@Req() req: Request, @Param('id') id: string) {
    const a = au(req);
    return { run: await this.svc.getAgentRun(a.tenantId, id) };
  }

  @Post('agent/runs')
  async startRun(
    @Req() req: Request,
    @Body(new ZodValidationPipe(AgentStartInput)) body: import('@pursuit/shared').AgentStartInput,
  ) {
    const a = au(req);
    const factory = createRuntimeFromEnv();
    return await this.svc.startAgentRun(a.tenantId, a.userId, body, factory);
  }

  @Get('approvals')
  async listApprovals(@Req() req: Request) {
    const a = au(req);
    return { items: await this.svc.listApprovals(a.tenantId) };
  }

  @Post('approvals')
  async createApproval(
    @Req() req: Request,
    @Body(new ZodValidationPipe(ApprovalCreateInput))
    body: import('@pursuit/shared').ApprovalCreateInput,
  ) {
    const a = au(req);
    return { approval: await this.svc.createApproval(a.tenantId, body) };
  }

  @Post('approvals/:id/decision')
  async decideApproval(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(decisionSchema)) body: { decision: 'approve' | 'reject' },
  ) {
    const a = au(req);
    if (body.decision !== 'approve' && body.decision !== 'reject') {
      throw new BadRequestException({ error: 'decision_must_be_approve_or_reject' });
    }
    return {
      approval: await this.svc.decideApproval(a.tenantId, `user:${a.userId}`, id, body.decision),
    };
  }

  /* notifications --------------------------------------------------------------- */

  @Get('notifications')
  async listNotifications(@Req() req: Request) {
    const a = au(req);
    const rows = await this.svc.listNotifications(a.tenantId, a.userId);
    return { items: rows.map((r) => mapNotification(r)) };
  }

  @Post('notifications/:id/read')
  async readNotification(@Req() req: Request, @Param('id') id: string) {
    const a = au(req);
    return this.svc.markNotificationRead(a.tenantId, id, a.userId);
  }

  /* resume vault (metadata listing; upload/tailoring lands in M2) ---------------- */

  @Get('resumes/versions')
  async listResumeVersions(@Req() req: Request) {
    const a = au(req);
    const rows = await this.dbw.db.resumeVersion.findMany({
      where: { tenantId: a.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return { items: rows.map((r) => mapResumeVersion(r)) };
  }
}

function mergeProfilePatch(
  existing: import('@pursuit/shared').CareerProfile,
  patch: ProfilePatch,
): import('@pursuit/shared').CareerProfile {
  return {
    ...existing,
    location: patch.location !== undefined ? patch.location : existing.location,
    work_authorization:
      patch.work_authorization !== undefined
        ? patch.work_authorization
        : existing.work_authorization,
    desired_compensation:
      patch.desired_compensation !== undefined
        ? patch.desired_compensation
        : existing.desired_compensation,
    role_families: patch.role_families ?? existing.role_families,
    seniority: patch.seniority ?? existing.seniority,
    work_arrangements: patch.work_arrangements ?? existing.work_arrangements,
    hard_exclusions: patch.hard_exclusions ?? existing.hard_exclusions,
    preferences: patch.preferences ?? existing.preferences,
    updated_at: new Date().toISOString(),
  };
}
