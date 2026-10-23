/**
 * Careers domain service: profile, jobs (manual intake + dedupe + eligibility
 * hook), applications (state machine + confirmation-evidence enforcement),
 * agent runs and approvals. Consolidated for M1; split into Nest modules as
 * surface area grows.
 */
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  AgentRun,
  ApplicationStatus,
  assertTransition,
  Approval,
  AUTO_TOOLS,
  evaluateEligibility,
  baselineFitScore,
  jobFingerprint,
  normalizeCompanyName,
  normalizeRoleTitle,
  canonicalizeUrl,
} from '@pursuit/shared';
import { approvalPayloadHash } from '@pursuit/shared/server';
import type {
  ApprovalCreateInput,
  CareerProfile as CareerProfileContract,
  JobCreateInput,
} from '@pursuit/shared';
import type { AgentRuntime, RuntimeStepRecord } from '@pursuit/agent-core';
import { DbService } from './db.service';
import {
  mapAgentRun,
  mapApplication,
  mapApplicationEvent,
  mapApproval,
  mapCareerProfile,
  mapJob,
  mapJobMatch,
} from './map';

@Injectable()
export class CareersService {
  constructor(readonly db: DbService) {}

  /* profile ------------------------------------------------------------- */

  async getProfile(userId: string, tenantId: string): Promise<CareerProfileContract> {
    const row = await this.db.db.careerProfile.findFirst({
      where: { tenantId, userId },
      include: { experiences: true, education: true, skills: true, projects: true },
    });
    const full =
      row ??
      (await this.db.db.careerProfile.create({ data: { tenantId, userId } }).then(() =>
        this.db.db.careerProfile.findFirstOrThrow({
          where: { tenantId, userId },
          include: { experiences: true, education: true, skills: true, projects: true },
        }),
      ))!;
    return mapCareerProfile(full as object, userId);
  }

  /* jobs ----------------------------------------------------------------- */

  async intakeJob(
    tenantId: string,
    input: JobCreateInput,
    observation?: {
      userId?: string;
      source?: {
        kind: string;
        baseUrl: string;
        externalId: string;
        observedAt: string;
        raw: Record<string, unknown>;
        evidence: unknown;
        attribution: string | null;
        validThrough?: string | null;
      };
    },
  ): Promise<{
    job: ReturnType<typeof mapJob>;
    match: ReturnType<typeof mapJobMatch> | null;
    deduped: boolean;
  }> {
    const fingerprint = jobFingerprint(
      normalizeCompanyName(input.company_name),
      normalizeRoleTitle(input.title),
    );
    const canonicalUrl = canonicalizeUrl(input.source_url);

    // A company/title is a similarity hint, never a unique requisition identity.
    const source = observation?.source
      ? await this.db.db.jobSource.upsert({
          where: {
            kind_baseUrl: { kind: observation.source.kind, baseUrl: observation.source.baseUrl },
          },
          create: {
            kind: observation.source.kind,
            baseUrl: observation.source.baseUrl,
            termsStatus: 'DOCUMENTED_OR_USER_SUPPLIED',
          },
          update: {},
        })
      : null;
    const existing = await this.db.db.job.findFirst({
      where: {
        OR: [
          { canonicalUrl },
          ...(source && observation?.source
            ? [{ sourceId: source.id, externalId: observation.source.externalId }]
            : []),
        ],
      },
    });
    const company =
      existing && !observation?.source
        ? await this.db.db.company.findUniqueOrThrow({ where: { id: existing.companyId } })
        : await this.db.db.company.upsert({
            where: { name: input.company_name },
            create: { name: input.company_name },
            update: {},
          });
    const canRefresh = Boolean(
      observation?.source && (!existing?.sourceId || existing.sourceId === source?.id),
    );
    const descriptionHash = createHash('sha256')
      .update(
        JSON.stringify({
          description: input.description ?? null,
          title: input.title,
          location: input.location ?? null,
          restrictions: input.remote_restrictions ?? null,
          compensation: input.compensation ?? null,
          source: observation?.source
            ? {
                kind: observation.source.kind,
                baseUrl: observation.source.baseUrl,
                externalId: observation.source.externalId,
                raw: observation.source.raw,
              }
            : null,
        }),
      )
      .digest('hex');
    const data = {
      companyId: company.id,
      title: input.title,
      location: input.location ?? null,
      remoteRestrictions: input.remote_restrictions ?? null,
      compensation: input.compensation ?? null,
      descriptionHash,
      lastSeenAt: new Date(),
      status:
        observation?.source?.validThrough &&
        Date.parse(observation.source.validThrough) <= Date.now()
          ? 'CLOSED'
          : existing?.status === 'CLOSED'
            ? 'REOPENED'
            : 'OPEN',
    };
    const job = existing
      ? canRefresh
        ? await this.db.db.job
            .updateMany({
              // Compare-and-set the primary source so concurrent first observations
              // cannot both claim an unowned canonical role.
              where: { id: existing.id, sourceId: existing.sourceId },
              data: {
                ...data,
                sourceId: existing.sourceId ?? source?.id,
                externalId: existing.externalId ?? observation?.source?.externalId,
              },
            })
            .then(() => this.db.db.job.findUniqueOrThrow({ where: { id: existing.id } }))
        : existing
      : await this.db.db.job.upsert({
          where: { canonicalUrl },
          create: {
            ...data,
            companyId: company.id,
            canonicalUrl,
            sourceId: source?.id,
            externalId: observation?.source?.externalId ?? null,
          },
          update: {},
        });
    if (
      (!existing || (canRefresh && existing.descriptionHash !== descriptionHash)) &&
      job.descriptionHash === descriptionHash &&
      (!observation?.source || job.sourceId === source?.id)
    ) {
      await this.db.db.jobSnapshot.create({
        data: {
          jobId: job.id,
          description: input.description ?? null,
          metadata: JSON.parse(
            JSON.stringify({
              posting_id: input.posting_id ?? null,
              fingerprint,
              provenance: observation?.source ?? null,
            }),
          ),
        },
      });
    }

    const storedDescription =
      (
        await this.db.db.jobSnapshot.findFirst({
          where: { jobId: job.id },
          orderBy: { observedAt: 'desc' },
        })
      )?.description ?? null;
    const storedCompany =
      job.companyId === company.id
        ? company
        : await this.db.db.company.findUniqueOrThrow({ where: { id: job.companyId } });
    // eligibility hook — unknown never silently passes (PRD)
    const profileRow = await this.db.db.careerProfile.findFirst({
      where: { tenantId, ...(observation?.userId ? { userId: observation.userId } : {}) },
    });
    let match: ReturnType<typeof mapJobMatch> | null = null;
    if (profileRow) {
      const el = evaluateEligibility({
        job: {
          title: job.title,
          location: job.location,
          remote_restrictions: job.remoteRestrictions,
          description: storedDescription,
          compensation: job.compensation,
        },
        profile: {
          work_authorization: (profileRow.workAuthorization as never) ?? [],
          desired_compensation: (profileRow.desiredCompensation as never) ?? null,
          role_families: (profileRow.roleFamilies as never) ?? [],
          seniority: (profileRow.seniority as never) ?? [],
          hard_exclusions: (profileRow.hardExclusions as never) ?? [],
        },
      });
      const fit = baselineFitScore(
        { title: job.title, description: storedDescription },
        { skills: [], role_families: (profileRow.roleFamilies as never) ?? [] },
      );
      const matchData = {
        tenantId,
        jobId: job.id,
        eligibility: el.eligibility,
        eligibilityEvidence: el.eligibility_evidence,
        hardFailures: el.hard_failures,
        fitScore: fit.score,
        fitRationale: el.eligibility_evidence.join('; ') || fit.rationale,
      };
      const matchRow = await this.db.db.jobMatch.upsert({
        where: { tenantId_jobId: { tenantId, jobId: job.id } },
        create: matchData,
        update: matchData,
      });
      match = mapJobMatch(matchRow);
    }

    await this.db.emit(tenantId, 'job.intake', `job:${job.id}`, {
      job_id: job.id,
      deduped: Boolean(existing),
    });
    return { job: mapJob(job, storedCompany, fingerprint), match, deduped: Boolean(existing) };
  }

  async listJobs(tenantId: string) {
    const rows = await this.db.db.job.findMany({
      where: { matches: { some: { tenantId } } },
      include: { company: true, matches: { where: { tenantId } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => ({
      job: mapJob(
        r,
        r.company,
        jobFingerprint(normalizeCompanyName(r.company.name), normalizeRoleTitle(r.title)),
      ),
      match: r.matches[0] ? mapJobMatch(r.matches[0]) : null,
    }));
  }

  /* applications ---------------------------------------------------------- */

  async createApplication(
    tenantId: string,
    userId: string,
    input: { job_id: string; resume_version_id?: string | null },
  ): Promise<ReturnType<typeof mapApplication>> {
    const job = await this.db.db.job.findUnique({
      where: { id: input.job_id },
      include: { company: true },
    });
    if (!job) throw new NotFoundException({ error: 'job_not_found' });
    const dupe = await this.db.db.application.findUnique({
      where: { tenantId_jobId: { tenantId, jobId: job.id } },
    });
    if (dupe) {
      throw new ForbiddenException({ error: 'application_exists', detail: dupe.id });
    }
    const app = await this.db.db.application.create({
      data: {
        tenantId,
        jobId: job.id,
        resumeVersionId: input.resume_version_id ?? null,
        status: 'DISCOVERED',
      },
    });
    await this.db.db.applicationEvent.create({
      data: {
        applicationId: app.id,
        toStatus: 'DISCOVERED',
        actor: `user:${userId}`,
        reason: 'application created',
      },
    });
    await this.db.emit(tenantId, 'application.created', `application:${app.id}`, {
      application_id: app.id,
    });
    return mapApplication(app, { title: job.title, companyName: job.company.name });
  }

  async listApplications(tenantId: string) {
    const rows = await this.db.db.application.findMany({
      where: { tenantId },
      include: { job: { include: { company: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) =>
      mapApplication(r, { title: r.job.title, companyName: r.job.company.name }),
    );
  }

  async getApplication(tenantId: string, id: string) {
    const app = await this.db.db.application.findFirst({
      where: { id, tenantId },
      include: { job: { include: { company: true } }, events: { orderBy: { createdAt: 'asc' } } },
    });
    if (!app) throw new NotFoundException({ error: 'application_not_found' });
    return {
      application: mapApplication(app, { title: app.job.title, companyName: app.job.company.name }),
      events: app.events.map((e) => mapApplicationEvent(e)),
    };
  }

  /**
   * Transition with state machine + confirmation-evidence enforcement.
   * SUBMITTED requires confirmation_ref — the PRD gate that prevents
   * applications from being marked submitted without real evidence.
   */
  async transitionApplication(
    tenantId: string,
    actor: string,
    id: string,
    to: ApplicationStatus,
    reason?: string,
    confirmationRef?: string,
    evidenceKey?: string,
  ) {
    const app = await this.db.db.application.findFirst({ where: { id, tenantId } });
    if (!app) throw new NotFoundException({ error: 'application_not_found' });
    if (app.status === to) {
      return this.getApplication(tenantId, id); // idempotent no-op
    }

    const job = await this.db.db.job.findUnique({
      where: { id: app.jobId },
      include: { company: true },
    });
    const toStatus = to;
    try {
      assertTransition(app.status as ApplicationStatus, toStatus);
    } catch {
      throw new ForbiddenException({
        error: 'transition_not_allowed',
        detail: `illegal transition ${app.status} → ${toStatus}`,
      });
    }

    let approval: { id: string } | null = null;
    if (evidenceKey) {
      const found = await this.db.db.approval.findFirst({ where: { id: evidenceKey, tenantId } });
      if (!found) throw new NotFoundException({ error: 'approval_not_found' });
      if (found.status === 'USED') throw new ForbiddenException({ error: 'approval_already_used' });
      if (found.status !== 'APPROVED')
        throw new ForbiddenException({
          error: 'approval_not_approved',
          detail: `status=${found.status}`,
        });
      if (found.expiresAt.getTime() < Date.now())
        throw new ForbiddenException({ error: 'approval_expired' });
      approval = found;
    }

    // approval gating for SUBMITTED — evidence is mandatory
    if (toStatus === 'SUBMITTED' && !confirmationRef) {
      throw new ForbiddenException({
        error: 'confirmation_required',
        detail: 'SUBMITTED requires confirmation_ref evidence (PRD: no fabricated submissions)',
      });
    }

    const updated = await this.db.db.application.update({
      where: { id: app.id },
      data: {
        status: toStatus,
        submittedAt: toStatus === 'SUBMITTED' ? new Date() : undefined,
        confirmationRef: toStatus === 'SUBMITTED' ? (confirmationRef ?? null) : undefined,
        version: { increment: 1 },
      },
    });
    const event = await this.db.db.applicationEvent.create({
      data: {
        applicationId: app.id,
        fromStatus: app.status,
        toStatus,
        actor,
        reason: reason ?? null,
        evidenceKey: evidenceKey ?? confirmationRef ?? null,
      },
    });
    // approvals are single-use (SECURITY_AND_POLICY)
    if (approval) {
      await this.db.db.approval.update({
        where: { id: approval.id },
        data: { status: 'USED', usedAt: new Date() },
      });
    }
    await this.db.emit(tenantId, 'application.updated', `application:${app.id}`, {
      application_id: app.id,
      to_status: toStatus,
    });
    return {
      application: mapApplication(
        updated,
        job ? { title: job.title, companyName: job.company.name } : null,
      ),
      events: [mapApplicationEvent(event)],
    };
  }

  /* agent runs ------------------------------------------------------------ */

  async listAgentRuns(tenantId: string): Promise<AgentRun[]> {
    const rows = await this.db.db.agentRun.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { steps: { orderBy: { createdAt: 'asc' } } },
      take: 50,
    });
    return rows.map((r) => mapAgentRun(r, r.steps));
  }

  async getAgentRun(tenantId: string, id: string): Promise<AgentRun> {
    const row = await this.db.db.agentRun.findFirst({
      where: { id, tenantId },
      include: { steps: { orderBy: { createdAt: 'asc' } } },
    });
    if (!row) throw new NotFoundException({ error: 'agent_run_not_found' });
    return mapAgentRun(row, row.steps);
  }

  /** Persist a run and execute it via the selected runtime (dev default). */
  async startAgentRun(
    tenantId: string,
    userId: string,
    input: { goal: string; allowed_tools: string[]; context_refs: string[] },
    runtime: AgentRuntime,
  ): Promise<{ run: AgentRun }> {
    const created = await this.db.db.agentRun.create({
      data: {
        tenantId,
        initiator: `user:${userId}`,
        goal: input.goal,
        status: 'QUEUED',
        runtime: runtime.name,
        modelProvider: runtime.name === 'opencode' ? (process.env['OPENCODE_MODEL'] ?? null) : null,
      },
    });
    // background execution — status updates stream via SSE
    void this.executeRun(created.id, tenantId, userId, input, runtime);
    return { run: await this.getAgentRun(tenantId, created.id) };
  }

  private async executeRun(
    runId: string,
    tenantId: string,
    userId: string,
    input: { goal: string; allowed_tools: string[]; context_refs: string[] },
    runtime: AgentRuntime,
  ): Promise<void> {
    await this.db.db.agentRun.update({
      where: { id: runId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });
    await this.db.emit(tenantId, 'agent.status', `agent_run:${runId}`, { status: 'RUNNING' });
    try {
      const info = await runtime.startRun({
        tenantId,
        actorId: 'api',
        goal: input.goal,
        allowedTools: input.allowed_tools.length > 0 ? input.allowed_tools : AUTO_TOOLS,
        contextRefs: input.context_refs,
      });
      for (const step of info.steps as RuntimeStepRecord[]) {
        await this.db.db.agentStep.create({
          data: {
            runId,
            tool: step.tool,
            argumentsRedacted: step.argumentsRedacted,
            status: step.status,
            resultRef: step.resultRef ?? null,
          },
        });
      }
      const finalStatus = info.status === 'SUCCEEDED' ? 'SUCCEEDED' : 'FAILED';
      await this.db.db.agentRun.update({
        where: { id: runId },
        data: {
          status: finalStatus,
          finishedAt: new Date(),
          proposal: info.proposal ?? null,
          budgetTokens: info.usage ? info.usage.input + info.usage.output : undefined,
        },
      });
      await this.db.db.notification.create({
        data: {
          tenantId,
          userId,
          type: 'AGENT_RUN_FINISHED',
          entityRef: `agent_run:${runId}`,
          title: finalStatus === 'SUCCEEDED' ? 'Agent run finished' : 'Agent run failed',
          body: input.goal.slice(0, 200),
        },
      });
      await this.db.emit(tenantId, 'agent.status', `agent_run:${runId}`, {
        status: finalStatus,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.db.db.agentRun.update({
        where: { id: runId },
        data: { status: 'FAILED', finishedAt: new Date() },
      });
      await this.db.db.agentStep.create({
        data: {
          runId,
          tool: 'runtime',
          argumentsRedacted: '{}',
          status: 'FAILED',
          // provider errors surfaced verbatim — never disguised as success
          resultRef: msg.slice(0, 500),
        },
      });
      await this.db.emit(tenantId, 'agent.status', `agent_run:${runId}`, {
        status: 'FAILED',
        error: msg,
      });
    }
  }

  /* approvals -------------------------------------------------------------- */

  async listApprovals(tenantId: string): Promise<Approval[]> {
    const rows = await this.db.db.approval.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => mapApproval(r));
  }

  async createApproval(tenantId: string, input: ApprovalCreateInput): Promise<Approval> {
    const payloadHash = approvalPayloadHash(input.preview);
    const row = await this.db.db.approval.create({
      data: {
        tenantId,
        actionType: input.action_type,
        entityId: input.entity_id,
        payloadHash,
        previewJson: input.preview as never,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + input.ttl_minutes * 60_000),
      },
    });
    await this.db.emit(tenantId, 'approval.created', `approval:${row.id}`, { approval_id: row.id });
    return mapApproval(row);
  }

  async decideApproval(
    tenantId: string,
    actor: string,
    id: string,
    decision: 'approve' | 'reject',
  ): Promise<Approval> {
    const row = await this.db.db.approval.findFirst({ where: { id, tenantId } });
    if (!row) throw new NotFoundException({ error: 'approval_not_found' });
    if (row.status !== 'PENDING')
      throw new ForbiddenException({
        error: 'approval_not_pending',
        detail: `status=${row.status}`,
      });
    if (row.expiresAt.getTime() < Date.now()) {
      await this.db.db.approval.update({ where: { id: row.id }, data: { status: 'EXPIRED' } });
      throw new ForbiddenException({ error: 'approval_expired' });
    }
    const updated = await this.db.db.approval.update({
      where: { id: row.id },
      data: {
        status: decision === 'approve' ? 'APPROVED' : 'REJECTED',
        approvedBy: decision === 'approve' ? actor : null,
      },
    });
    await this.db.emit(tenantId, 'approval.decided', `approval:${row.id}`, {
      decision,
    });
    return mapApproval(updated);
  }

  /* notifications ----------------------------------------------------------- */

  async listNotifications(tenantId: string, userId: string) {
    const rows = await this.db.db.notification.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows;
  }

  async markNotificationRead(tenantId: string, id: string, userId: string) {
    const row = await this.db.db.notification.findFirst({ where: { id, tenantId, userId } });
    if (!row) throw new NotFoundException({ error: 'notification_not_found' });
    if (!row.readAt) {
      await this.db.db.notification.update({ where: { id: row.id }, data: { readAt: new Date() } });
    }
    return { id: row.id, read: true };
  }
}
