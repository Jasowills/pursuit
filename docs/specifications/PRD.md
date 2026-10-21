# Pursuit PRD v1.0

## Vision

An always-on, human-supervised career agent that discovers opportunities, qualifies eligibility, prepares factual applications and tailored documents, manages personalized outreach, tracks conversations, and coordinates work across devices.

## Audience and release

Private single-user beta for initial operator. Multi-tenant-safe design from day one; public signup, billing, teams, and marketplace explicitly out of v1 scope. Web and Expo mobile are first-class clients. Browser extension optional in hybrid mode, not required to complete core cloud flows.

## Outcomes / north-star

Verified qualified opportunities surfaced per week; successful confirmed submissions; positive recruiter responses/interviews; time saved per application; false-positive and duplicate rates; human review burden; cost per completed workflow. Never optimize only for application volume.

## Functional requirements (priority)

### P0 Identity and career knowledge

- OAuth or passwordless sign-in; account settings, export/delete data, sessions, device list.
- Structured career profile: location, work eligibility by jurisdiction, desired compensation/currency, role families, seniority, work arrangements, notice period, links, work history, education, skills, projects, quantified evidence, hard exclusions, preferences.
- Evidence and provenance on each claim; human-verified flag; ambiguous claims require review.
- Tone profile with approved writing samples, disallowed phrases, length and channel-specific rules; edit-feedback history.
- All personally identifying content is encrypted/permissioned and never used for other users.

### P0 Job ingestion and qualification

- Accept company careers URLs, direct ATS URLs, pasted social post links and text, manual job entries.
- Extract employer, role, source URL, canonical URL, posting ID, description, location, remote restrictions, compensation, requirements, closing status and observed timestamp.
- Distinguish VERIFIED_ELIGIBLE / POSSIBLY_ELIGIBLE / UNKNOWN / INELIGIBLE; unknown does not silently pass filters.
- Dedupe across canonical URLs, ATS IDs and normalized company/role fingerprints; preserve source history.
- Role matching: hard constraints first, then explainable weighted fit score and evidence.
- Respect source terms, access controls, crawl limits and robots directives as applicable. No CAPTCHA bypass.

### P0 Resume tailoring and vault

- Upload master PDF/DOCX, extract structured facts, allow correction and verification.
- Tailor ordering, summary, project selection, skill emphasis, and phrasing to job description; do not fabricate.
- Produce ATS-readable DOCX and PDF; stable template and deterministic render; inspect for missing text, page overflow and corruption.
- Save immutable version with master version, job snapshot, prompt/template version, edit diff, generation timestamp, content hash, approval status, final submitted file.
- Preview, download, compare, search, rename, archive, and associate to application. Private object storage with short-lived signed URLs.

### P0 Applications

- Pipeline: DISCOVERED -> VERIFIED -> QUALIFIED -> DRAFTING -> READY_FOR_REVIEW -> APPROVED -> APPLYING -> SUBMITTED or NEEDS_ATTENTION/FAILED; also REJECTED/SKIPPED/WITHDRAWN.
- Browser worker can fill fields and upload files before approval where safe; final submit requires approval of employer, role, destination, resume version, answers, and attachments.
- Dynamic forms, required declarations, and missing information pause for human input.
- Save submission evidence: URL, timestamp, confirmation number/text, screenshot (redacted), browser run ID; clicked button alone is insufficient.
- Idempotent execution; uncertain submission state is NEEDS_VERIFICATION, never blindly retried.
- Per-application history, notes, follow-up tasks, interview and offer outcomes.

### P1 Discovery and website watchers

- Create watcher from careers URL, ATS organization, keyword or curated company list.
- Schedule per source; change detection on normalized job IDs, not arbitrary DOM diffs.
- Detect new, reopened, changed, and removed roles; store snapshots, last success, error streak, ETag/hash if available.
- On match: notify and optionally prepare an application; no unapproved final submission.
- Pause, resume, bulk import, dedupe, and backoff; provider-specific limits and budget caps.

### P1 Outreach and communications

- Find work-relevant contacts from lawful public sources, retain source and verification confidence.
- Compose recipient-specific email and social DM drafts with researched company evidence and verified career claims.
- Maintain contact and company-level do-not-contact/exclusion lists, prior messages and cooldowns.
- Gmail OAuth with least privilege; drafts, exact-message approval, send and reconciliation with Gmail message/thread IDs.
- Classify replies as INTERVIEW / POSITIVE / QUESTION / REJECTION / AUTO_REPLY / OTHER, confidence and evidence; low-confidence requires review.
- Track follow-up suggestions; no repeated unsolicited sending without approval; enforce sending caps and opt-outs.
- Social messaging support initially draft/copy/manual handoff unless authorized APIs permit sending; never promise unrestricted LinkedIn/X automation.

### P1 Mobile + realtime

- Expo Android/iOS: home summary, job inbox, application detail, agent chat, approvals, outreach, resume vault, watchers, notifications.
- Shared backend source of truth, optimistic updates with version checks, WebSocket/SSE updates, push notifications and deep links.
- Offline view of recent data and queued user commands with safe replay; never execute irreversible actions twice.
- Authentication tokens in secure OS storage, no secrets in client bundle.

### P1 Agent and automation

- Scheduled recurring discovery, watcher checks, inbox sync, application preparation, and follow-up suggestions.
- Run history with steps, tool calls, budgets, errors, artifacts, retries, approvals, resumability and cancellation.
- User-facing controls: pause all, pause specific workflow, revoke tool permissions, see exact actions and evidence.

## Non-functional requirements

- Tenant isolation enforced at database query and object access layers; audit every external action.
- Durable jobs and explicit state machines; retry only idempotent steps.
- Availability target TBD; basic latency targets: UI interactions under 300ms locally where possible, background jobs async.
- WCAG 2.2 AA target; keyboard access, reduced-motion support, screen reader labels.
- Observability: structured logs, traces, queue depth, error rates, per-source success, model token/cost budgets; redact PII.
- Privacy export/deletion, retention controls, encrypted secrets, backups and restore drills.

## Explicit exclusions for first beta

- Fully autonomous final submissions/sends; bypassing anti-bot protections; mass unsolicited messaging; paid sourcing datasets by default; public billing; native calendar writes without permission; scraping private platforms without authorization; guaranteed job outcomes.
