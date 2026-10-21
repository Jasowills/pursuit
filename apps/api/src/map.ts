/** DB row (snake/camel Prisma) → API contract mappers. */
import type {
  Application,
  ApplicationEventItem,
  Approval,
  AgentRun,
  CareerProfile as CareerProfileContract,
  Job,
  JobMatch,
  Notification,
  Watcher,
} from '@pursuit/shared';

type AnyRow = Record<string, unknown>;

const iso = (d: unknown): string => (d instanceof Date ? d.toISOString() : String(d));
const nulIso = (d: unknown): string | null => (d == null ? null : iso(d));

export function mapJob(row: AnyRow, company: AnyRow, fingerprint: string): Job {
  return {
    id: String(row['id']),
    company_id: String(row['companyId']),
    company_name: String(company['name'] ?? ''),
    source_url: String(row['canonicalUrl']),
    canonical_url: String(row['canonicalUrl']),
    external_id: (row['externalId'] as string | null) ?? null,
    fingerprint,
    title: String(row['title']),
    location: (row['location'] as string | null) ?? null,
    remote_restrictions: (row['remoteRestrictions'] as string | null) ?? null,
    description_hash: (row['descriptionHash'] as string | null) ?? null,
    compensation: (row['compensation'] as string | null) ?? null,
    status: (row['status'] as Job['status']) ?? 'UNKNOWN',
    first_seen_at: iso(row['firstSeenAt']),
    last_seen_at: iso(row['lastSeenAt']),
  };
}

export function mapJobMatch(row: AnyRow): JobMatch {
  return {
    id: String(row['id']),
    job_id: String(row['jobId']),
    eligibility: row['eligibility'] as JobMatch['eligibility'],
    eligibility_evidence: (row['eligibilityEvidence'] as string[] | null) ?? [],
    fit_score: Number(row['fitScore'] ?? 0),
    fit_rationale: String(row['fitRationale'] ?? ''),
    hard_failures: (row['hardFailures'] as string[] | null) ?? [],
    created_at: iso(row['createdAt']),
  };
}

export function mapApplication(row: AnyRow, job: AnyRow | null): Application {
  return {
    id: String(row['id']),
    job_id: String(row['jobId']),
    job_title: String(job?.['title'] ?? ''),
    company_name: String(job?.companyName ?? ''),
    resume_version_id: (row['resumeVersionId'] as string | null) ?? null,
    status: row['status'] as Application['status'],
    submitted_at: nulIso(row['submittedAt']),
    confirmation_ref: (row['confirmationRef'] as string | null) ?? null,
    source_url: (row['sourceUrl'] as string | null) ?? null,
    version: Number(row['version'] ?? 0),
    updated_at: iso(row['updatedAt']),
  };
}

export function mapApplicationEvent(row: AnyRow): ApplicationEventItem {
  return {
    id: String(row['id']),
    from_status: (row['fromStatus'] as ApplicationEventItem['from_status']) ?? null,
    to_status: row['toStatus'] as ApplicationEventItem['to_status'],
    actor: String(row['actor']),
    reason: (row['reason'] as string | null) ?? undefined,
    evidence_key: (row['evidenceKey'] as string | null) ?? undefined,
    created_at: iso(row['createdAt']),
  };
}

export function mapWatcher(row: AnyRow): Watcher {
  return {
    id: String(row['id']),
    kind: row['kind'] as Watcher['kind'],
    source_url: String(row['sourceUrl']),
    frequency_minutes: Number(row['frequencyMinutes']),
    keywords: (row['keywords'] as string[] | null) ?? [],
    enabled: Boolean(row['enabled']),
    last_checked_at: nulIso(row['lastCheckedAt']),
    next_check_at: nulIso(row['nextCheckAt']),
    error_streak: Number(row['errorStreak'] ?? 0),
    created_at: iso(row['createdAt']),
  };
}

export function mapResumeVersion(row: AnyRow): import('@pursuit/shared').ResumeVersion {
  return {
    id: String(row['id']),
    master_id: String(row['masterId']),
    job_id: (row['jobId'] as string | null) ?? null,
    label: String(row['label']),
    template_version: String(row['templateVersion'] ?? 'v1'),
    status: row['status'] as import('@pursuit/shared').ResumeVersion['status'],
    approved_at: nulIso(row['approvedAt']),
    created_at: iso(row['createdAt']),
    is_submitted: Boolean(row['isSubmitted']),
  };
}

export function mapApproval(row: AnyRow): Approval {
  const previewJson = (row['previewJson'] as Record<string, unknown>) ?? {};
  return {
    id: String(row['id']),
    action_type: row['actionType'] as Approval['action_type'],
    entity_id: String(row['entityId']),
    status: row['status'] as Approval['status'],
    preview: {
      destination: String(previewJson['destination'] ?? ''),
      recipient: (previewJson['recipient'] as string | null) ?? null,
      summary: String(previewJson['summary'] ?? ''),
      answers: (previewJson['answers'] as { field: string; value: string }[] | undefined) ?? [],
      attachments: (previewJson['attachments'] as string[] | undefined) ?? [],
      payload_hash: String(row['payloadHash']),
    },
    expires_at: iso(row['expiresAt']),
    approved_by: (row['approvedBy'] as string | null) ?? null,
    used_at: nulIso(row['usedAt']),
    created_at: iso(row['createdAt']),
  };
}

export function mapAgentRun(
  row: AnyRow,
  steps: AnyRow[],
  usage?: { input: number; output: number; cost: number },
): AgentRun {
  return {
    id: String(row['id']),
    goal: String(row['goal']),
    status: row['status'] as AgentRun['status'],
    runtime: row['runtime'] as AgentRun['runtime'],
    model_provider: (row['modelProvider'] as string | null) ?? undefined,
    initiator: String(row['initiator']),
    budget_tokens: (row['budgetTokens'] as number | null) ?? undefined,
    steps: steps.map((s) => ({
      id: String(s['id']),
      run_id: String(s['runId']),
      tool: String(s['tool']),
      arguments_redacted: String(s['argumentsRedacted']),
      status: s['status'] as AgentRun['steps'][number]['status'],
      result_ref: (s['resultRef'] as string | null) ?? undefined,
      created_at: iso(s['createdAt']),
    })),
    usage,
    created_at: iso(row['createdAt']),
    finished_at: nulIso(row['finishedAt']),
  };
}

export function mapNotification(row: AnyRow): Notification {
  return {
    id: String(row['id']),
    type: String(row['type']),
    entity_ref: (row['entityRef'] as string | null) ?? undefined,
    title: String(row['title']),
    body: String(row['body']),
    read_at: nulIso(row['readAt']),
    created_at: iso(row['createdAt']),
  };
}

export function mapCareerProfile(rowInput: object, userId: string): CareerProfileContract {
  // Prisma payload → contract; arrays default to [] and JSON stays as-is
  const row = rowInput as AnyRow;
  return {
    id: String(row['id']),
    user_id: userId,
    location: (row['location'] as string | null) ?? null,
    work_authorization:
      (row['workAuthorization'] as CareerProfileContract['work_authorization']) ?? [],
    desired_compensation:
      (row['desiredCompensation'] as CareerProfileContract['desired_compensation']) ?? null,
    role_families: (row['roleFamilies'] as string[] | null) ?? [],
    seniority: (row['seniority'] as string[] | null) ?? [],
    work_arrangements: (row['workArrangements'] as string[] | null) ?? [],
    hard_exclusions: (row['hardExclusions'] as string[] | null) ?? [],
    preferences: (row['preferences'] as string[] | null) ?? [],
    experiences: (row['experiences'] as CareerProfileContract['experiences']) ?? [],
    education: (row['education'] as CareerProfileContract['education']) ?? [],
    skills: (row['skills'] as CareerProfileContract['skills']) ?? [],
    projects: (row['projects'] as CareerProfileContract['projects']) ?? [],
    updated_at: iso(row['updatedAt']),
  };
}
