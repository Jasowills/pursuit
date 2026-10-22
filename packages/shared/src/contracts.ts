import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Enumerations (PRD / DATA_MODEL)                                     */
/* ------------------------------------------------------------------ */

/** Job qualification states — PRD: "unknown does not silently pass filters" */
export const Eligibility = z.enum([
  'VERIFIED_ELIGIBLE',
  'POSSIBLY_ELIGIBLE',
  'UNKNOWN',
  'INELIGIBLE',
]);
export type Eligibility = z.infer<typeof Eligibility>;

/** Application pipeline — PRD Applications section */
export const ApplicationStatus = z.enum([
  'DISCOVERED',
  'VERIFIED',
  'QUALIFIED',
  'DRAFTING',
  'READY_FOR_REVIEW',
  'APPROVED',
  'APPLYING',
  'SUBMITTED',
  'NEEDS_ATTENTION',
  'NEEDS_VERIFICATION',
  'FAILED',
  'REJECTED',
  'SKIPPED',
  'WITHDRAWN',
]);
export type ApplicationStatus = z.infer<typeof ApplicationStatus>;

/** Legal transitions of the application state machine (durable, idempotent). */
/** Legal transitions of the application state machine (durable, idempotent). */
export const ALLOWED_APPLICATION_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  DISCOVERED: ['VERIFIED', 'SKIPPED'],
  VERIFIED: ['QUALIFIED', 'SKIPPED', 'NEEDS_ATTENTION'],
  QUALIFIED: ['DRAFTING', 'SKIPPED', 'NEEDS_ATTENTION'],
  DRAFTING: ['READY_FOR_REVIEW', 'NEEDS_ATTENTION', 'SKIPPED'],
  READY_FOR_REVIEW: ['APPROVED', 'NEEDS_ATTENTION', 'SKIPPED'],
  APPROVED: ['APPLYING', 'NEEDS_ATTENTION'],
  APPLYING: ['SUBMITTED', 'NEEDS_ATTENTION', 'NEEDS_VERIFICATION', 'FAILED'],
  NEEDS_ATTENTION: ['APPLYING', 'READY_FOR_REVIEW', 'QUALIFIED', 'REJECTED', 'SKIPPED'],
  NEEDS_VERIFICATION: ['SUBMITTED', 'FAILED', 'APPLYING'],
  SUBMITTED: ['REJECTED', 'WITHDRAWN'],
  FAILED: ['APPLYING', 'SKIPPED'],
  REJECTED: [],
  SKIPPED: ['DISCOVERED'],
  WITHDRAWN: [],
};

/** Watcher lifecycle / event types — ARCHITECTURE Watchers */
export const WatcherEvent = z.enum(['NEW', 'UPDATED', 'REOPENED', 'REMOVED']);
export type WatcherEvent = z.infer<typeof WatcherEvent>;

export const WatcherKind = z.enum(['COMPANY_URL', 'ATS_ORG', 'KEYWORD', 'COMPANY_LIST']);
export type WatcherKind = z.infer<typeof WatcherKind>;

/** Agent run states (ARCHITECTURE agent contract) */
export const AgentRunStatus = z.enum([
  'QUEUED',
  'RUNNING',
  'PAUSED',
  'AWAITING_APPROVAL',
  'SUCCEEDED',
  'CANCELLED',
  'FAILED',
]);
export type AgentRunStatus = z.infer<typeof AgentRunStatus>;

export const ApprovalStatus = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'USED']);
export type ApprovalStatus = z.infer<typeof ApprovalStatus>;

export const ToolName = z.enum([
  'search_jobs',
  'save_job',
  'score_job',
  'draft_application',
  'prepare_resume_version',
  'find_contacts',
  'draft_outreach',
  'submit_application', // requires approval
  'send_outreach', // requires approval
]);
export type ToolName = z.infer<typeof ToolName>;

/** Tools that may execute automatically vs. gated (SECURITY_AND_POLICY approval policy). */
export const AUTO_TOOLS: ToolName[] = [
  'search_jobs',
  'save_job',
  'score_job',
  'draft_application',
  'prepare_resume_version',
  'find_contacts',
  'draft_outreach',
];
export const GATED_TOOLS: ToolName[] = ['submit_application', 'send_outreach'];

export const OutreachStatus = z.enum(['DRAFT', 'PENDING_APPROVAL', 'SENT', 'ERROR']);
export const ContactConfidence = z.enum(['HIGH', 'MEDIUM', 'LOW']);

/* ------------------------------------------------------------------ */
/* Identity / tenancy                                                  */
/* ------------------------------------------------------------------ */

export const Email = z.string().email();
export const PasswordlessDevLogin = z.object({
  email: Email,
  display_name: z.string().min(1).max(120),
});

export const User = z.object({
  id: z.string(),
  email: Email,
  display_name: z.string(),
  created_at: z.string(),
});

export const Session = z.object({
  id: z.string(),
  user_id: z.string(),
  created_at: z.string(),
  device: z.string().nullable().optional(),
});

/* ------------------------------------------------------------------ */
/* Career profile                                                      */
/* ------------------------------------------------------------------ */

export const ExperienceEntry = z.object({
  id: z.string(),
  employer: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string().nullable(),
  location: z.string().nullable(),
  summary: z.string().nullable(),
  evidence_claim_ids: z.array(z.string()).default([]),
});

export const EducationEntry = z.object({
  id: z.string(),
  institution: z.string(),
  credential: z.string(),
  field: z.string().nullable(),
  year: z.string().nullable(),
});

export const ProjectEntry = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string().nullable(),
});

export const SkillEntry = z.object({
  id: z.string(),
  name: z.string(),
  level: z.enum(['FAMILIAR', 'PROFICIENT', 'EXPERT']).default('PROFICIENT'),
  evidence: z.array(z.string()).default([]),
});

export const CareerProfile = z.object({
  id: z.string(),
  user_id: z.string(),
  location: z.string().nullable(),
  work_authorization: z
    .array(z.object({ jurisdiction: z.string(), status: z.string(), verified: z.boolean() }))
    .default([]),
  desired_compensation: z
    .object({ min_amount: z.number().int(), currency: z.string().default('USD') })
    .nullable(),
  role_families: z.array(z.string()).default([]),
  seniority: z.array(z.string()).default([]),
  work_arrangements: z.array(z.string()).default([]),
  hard_exclusions: z.array(z.string()).default([]),
  preferences: z.array(z.string()).default([]),
  experiences: z.array(ExperienceEntry).default([]),
  education: z.array(EducationEntry).default([]),
  skills: z.array(SkillEntry).default([]),
  projects: z.array(ProjectEntry).default([]),
  updated_at: z.string(),
});
export type CareerProfile = z.infer<typeof CareerProfile>;

/* ------------------------------------------------------------------ */
/* Companies & jobs                                                    */
/* ------------------------------------------------------------------ */

export const Company = z.object({
  id: z.string(),
  canonical_domain: z.string().nullable(),
  name: z.string(),
  aliases: z.array(z.string()).default([]),
});

export const JobStatus = z.enum(['OPEN', 'REOPENED', 'CLOSED', 'UNKNOWN']);

export const JobCreateInput = z.object({
  company_name: z.string().min(1).max(160),
  title: z.string().min(1).max(220),
  location: z.string().max(200).nullish(),
  remote_restrictions: z.string().max(200).nullish(),
  source_url: z.string().url(),
  posting_id: z.string().nullish(),
  description: z.string().nullish(),
  compensation: z.string().max(200).nullish(),
});
export type JobCreateInput = z.infer<typeof JobCreateInput>;

export const Job = z.object({
  id: z.string(),
  company_id: z.string(),
  company_name: z.string(),
  source_url: z.string(),
  canonical_url: z.string(),
  external_id: z.string().nullable(),
  fingerprint: z.string(),
  title: z.string(),
  location: z.string().nullable(),
  remote_restrictions: z.string().nullable(),
  description_hash: z.string().nullable(),
  compensation: z.string().nullable(),
  status: JobStatus,
  first_seen_at: z.string(),
  last_seen_at: z.string(),
});
export type Job = z.infer<typeof Job>;

export const JobMatch = z.object({
  id: z.string(),
  job_id: z.string(),
  eligibility: Eligibility,
  eligibility_evidence: z.array(z.string()).default([]),
  fit_score: z.number().min(0).max(100),
  fit_rationale: z.string(),
  hard_failures: z.array(z.string()).default([]),
  created_at: z.string(),
});
export type JobMatch = z.infer<typeof JobMatch>;

/* ------------------------------------------------------------------ */
/* Applications / resumes                                              */
/* ------------------------------------------------------------------ */

export const ApplicationCreateInput = z.object({
  job_id: z.string(),
  resume_version_id: z.string().nullish(),
});
export type ApplicationCreateInput = z.infer<typeof ApplicationCreateInput>;

export const Application = z.object({
  id: z.string(),
  job_id: z.string(),
  job_title: z.string(),
  company_name: z.string(),
  resume_version_id: z.string().nullable(),
  status: ApplicationStatus,
  submitted_at: z.string().nullable(),
  confirmation_ref: z.string().nullable(),
  source_url: z.string().nullable(),
  version: z.number().int(),
  updated_at: z.string(),
});
export type Application = z.infer<typeof Application>;

export const ApplicationEventItem = z.object({
  id: z.string(),
  from_status: ApplicationStatus.nullable(),
  to_status: ApplicationStatus,
  actor: z.string(),
  reason: z.string().nullish(),
  evidence_key: z.string().nullish(),
  created_at: z.string(),
});
export type ApplicationEventItem = z.infer<typeof ApplicationEventItem>;

export const ResumeMaster = z.object({
  id: z.string(),
  owner_id: z.string(),
  file_name: z.string(),
  object_key: z.string(),
  content_type: z.string(),
  bytes: z.number().int(),
  created_at: z.string(),
});

export const ResumeVersion = z.object({
  id: z.string(),
  master_id: z.string(),
  job_id: z.string().nullable(),
  label: z.string(),
  template_version: z.string(),
  status: z.enum(['DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'ARCHIVED']),
  approved_at: z.string().nullable(),
  created_at: z.string(),
  is_submitted: z.boolean().default(false),
});
export type ResumeVersion = z.infer<typeof ResumeVersion>;

/* ------------------------------------------------------------------ */
/* Watchers                                                            */
/* ------------------------------------------------------------------ */

export const WatcherCreateInput = z.object({
  kind: WatcherKind,
  source_url: z.string().url(),
  frequency_minutes: z.number().int().min(15).max(14400).default(60),
  keywords: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
});
export type WatcherCreateInput = z.infer<typeof WatcherCreateInput>;

export const Watcher = z.object({
  id: z.string(),
  kind: WatcherKind,
  source_url: z.string(),
  frequency_minutes: z.number().int(),
  keywords: z.array(z.string()).default([]),
  enabled: z.boolean(),
  last_checked_at: z.string().nullable(),
  next_check_at: z.string().nullable(),
  error_streak: z.number().int(),
  created_at: z.string(),
});
export type Watcher = z.infer<typeof Watcher>;

export const WatcherEventItem = z.object({
  id: z.string(),
  watcher_id: z.string(),
  job_id: z.string().nullable(),
  event_type: WatcherEvent,
  dedupe_key: z.string(),
  detected_at: z.string(),
});

/* ------------------------------------------------------------------ */
/* Agent / approvals                                                   */
/* ------------------------------------------------------------------ */

export const AgentStartInput = z.object({
  goal: z.string().min(4).max(400),
  allowed_tools: z.array(ToolName).default(AUTO_TOOLS),
  context_refs: z.array(z.string()).default([]),
});
export type AgentStartInput = z.infer<typeof AgentStartInput>;

export const AgentStepItem = z.object({
  id: z.string(),
  run_id: z.string(),
  tool: z.string(),
  arguments_redacted: z.string(),
  status: z.enum(['PENDING', 'SUCCEEDED', 'FAILED', 'BLOCKED_BY_POLICY']),
  result_ref: z.string().nullish(),
  created_at: z.string(),
});

export const AgentRun = z.object({
  id: z.string(),
  goal: z.string(),
  status: AgentRunStatus,
  runtime: z.enum(['dev', 'opencode', 'external']),
  model_provider: z.string().nullish(),
  proposal: z.string().nullish(),
  initiator: z.string(),
  budget_tokens: z.number().int().nullish(),
  steps: z.array(AgentStepItem).default([]),
  usage: z
    .object({ input: z.number().int(), output: z.number().int(), cost: z.number() })
    .nullish(),
  created_at: z.string(),
  finished_at: z.string().nullable(),
});
export type AgentRun = z.infer<typeof AgentRun>;

export const ApprovalCreateInput = z.object({
  action_type: z.enum(['SUBMIT_APPLICATION', 'SEND_OUTREACH']),
  entity_id: z.string(),
  preview: z.object({
    destination: z.string(),
    recipient: z.string().nullish(),
    summary: z.string(),
    answers: z.array(z.object({ field: z.string(), value: z.string() })).default([]),
    attachments: z.array(z.string()).default([]),
    payload_hash: z.string(),
  }),
  ttl_minutes: z.number().int().min(5).max(2880).default(120),
});
export type ApprovalCreateInput = z.infer<typeof ApprovalCreateInput>;

export const Approval = z.object({
  id: z.string(),
  action_type: z.enum(['SUBMIT_APPLICATION', 'SEND_OUTREACH']),
  entity_id: z.string(),
  status: ApprovalStatus,
  preview: ApprovalCreateInput.shape.preview,
  expires_at: z.string(),
  approved_by: z.string().nullable(),
  used_at: z.string().nullable(),
  created_at: z.string(),
});
export type Approval = z.infer<typeof Approval>;

/* ------------------------------------------------------------------ */
/* Notifications & events                                              */
/* ------------------------------------------------------------------ */

export const Notification = z.object({
  id: z.string(),
  type: z.string(),
  entity_ref: z.string().nullish(),
  title: z.string(),
  body: z.string(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});
export type Notification = z.infer<typeof Notification>;

export const AuditLogItem = z.object({
  id: z.string(),
  actor: z.string(),
  action: z.string(),
  target: z.string(),
  created_at: z.string(),
});

/* ------------------------------------------------------------------ */
/* Transport contract                                                  */
/* ------------------------------------------------------------------ */

export const ApiError = z.object({
  error: z.string(),
  code: z.string().nullish(),
  details: z.unknown().nullish(),
});

export const Paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    cursor: z.string().nullish(),
    total_estimate: z.number().int().nullish(),
  });
