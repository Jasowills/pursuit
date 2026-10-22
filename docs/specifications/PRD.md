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

---

## Amendment: desktop-first Career Identity and autonomy — 2026-10-22

This amendment evolves the existing PRD and preserves its career workflows, factuality, evidence, accessibility and reliability requirements. It takes precedence over conflicting delivery/authentication wording above. It describes the target product, not a claim that its desktop features are implemented.

### Delivery and ownership

Pursuit becomes a downloadable, local-first career agent harness. Pursuit Desktop is the primary application; Pursuit Core owns local persistence/orchestration/browser/integrations; the website is a product/distribution surface; Pursuit Connect and the Expo mobile companion control a running paired instance. There is no separate hosted career dashboard and no required Pursuit account.

The first usable alpha must support **macOS, Windows and Linux**. Installer/browser/runtime qualification is required for each architecture offered. The desktop must not require users to install developer tools or run Postgres/Redis/Docker. Existing web/API code is reused and migrated; legacy routes and stored data are not removed before parity and a recoverable migration exist.

### Career Identity and writing

Career Identity is the authoritative professional record. Important facts carry typed provenance, confirmation state, evidence, revision and dates; imported/inferred/unknown/contradictory facts remain distinct. High-impact eligibility facts require user confirmation. Residence, citizenship, sponsorship and authorization by jurisdiction are separate facts.

Onboarding progressively covers resume/manual import, fact confirmation, target roles/locations, eligibility, writing personality, optional tools, autonomy and a useful first task. Resume creation from a blank profile is supported alongside import. Preserve originals and immutable tailored versions; validate PDF/DOCX outputs rather than claiming universal ATS compatibility.

Writing Identity supplies user-approved tone/rules/examples. Company/recipient evidence and relevant confirmed experience drive a bounded draft/critique/revision pipeline. No invented metrics or qualifications. Style learning requires user acceptance and is inspectable/removable.

### Agent and provider support

OpenCode remains the initial runtime. Offer existing OpenCode provider configuration and OpenCode-hosted model access as separate connection paths. OpenCode is not itself a model. Provider/model availability, authentication and tool capability are discovered and tested against the installed/pinned runtime. Local Ollama is a qualification target; paid APIs/subscriptions are not included by Pursuit.

The harness exposes structured tasks, actual streamed steps, files, source evidence, browser inspection, authority and results; pause/cancel/restart recovery must be real. No unrestricted coding-agent tool environment is inherited.

### Autonomy decision explicitly supplied by the user

The user selected **bounded automatic applications after explicit setup, with approval for outreach**. This supersedes the earlier blanket prohibition of autonomous final application submissions for users who enable that mode. Guided/manual approval mode remains available and is the default.

Automatic application authority is a versioned, scoped, expiring, revocable grant with source/role/location/document/answer constraints and per-run/day/usage limits. Execution still creates and consumes an exact-payload authorization per application. Unknown facts, unsupported forms, platform access restrictions, sensitive declarations, CAPTCHAs and uncertain outcomes require stopping or user action. A model cannot extend its own permission.

Email/social/outreach sending and follow-ups require explicit approval of the exact recipient/content/artifacts. An application grant never authorizes outreach. Current code remains approval-bound and automatic application mode remains unavailable until the new execution contract passes its tests.

### Research and execution

Preserve ingestion, discovery, company/people research, application tracking, outreach and standing goals as connected workflows. Add public ATS adapters, universal input normalization with evidence, typed answer resolution, supported browser adapters and manual takeover. Do not assume public discovery APIs grant submission rights. All submitted states require confirmation evidence and uncertain submissions are never blindly retried.

### Pursuit Connect

The user selected optional **encrypted internet relay connectivity without a Pursuit account**. Desktop is authoritative; relay forwards opaque encrypted transport. Pair devices with explicit enrollment, revocable keys/capabilities, replay protection, version checks and exact-artifact approval binding. Mobile has snapshots and command/event synchronization, not an independent authoritative career database. Desktop off/sleeping means local execution is unavailable; Connect does not imply cloud execution.

### Website and distribution

Preserve the mark, typography and useful landing sections. Replace hosted authentication/navigation with Product/Features/Models/Connect/Docs/GitHub and download/prerelease actions. Only published validated release artifacts may be offered; OS recommendation always has manual selection. No fictitious installers, live browser views or desktop captures. Preserve the single hero showcase/play experience; deeper workflow exploration can sit below it.

### Acceptance and implementation source

The first useful desktop slice is resume import/create → confirmed Career Identity → writing preferences → model connection → supported job URL → research/eligibility → truthful tailored resume/cover letter/answer packet → preflight review → saved artifacts/evidence. Supported browser submission and bounded automatic execution follow additional gates.

[DESKTOP_CHANGE_IMPACT.md](../DESKTOP_CHANGE_IMPACT.md) records retained/modified/retired/introduced modules. [DESKTOP_IMPLEMENTATION_PLAN.md](../DESKTOP_IMPLEMENTATION_PLAN.md) provides dependencies, contracts, release stages and evidence requirements. Older cloud topology/hosted-auth and per-application-only authority statements are historical where this amendment supersedes them.
