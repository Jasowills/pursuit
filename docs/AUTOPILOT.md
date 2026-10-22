# Career autopilot

Pursuit's intended core workflow is **opt in → research → qualify → prepare → apply → track → notify**, with the user's rules and pause/revoke controls applying throughout. This replaces a proposal-only product positioning as the final destination; it does not mean automatic application execution already exists.

## What this implementation does

- `/app/autopilot`, linked in navigation and Settings, stores a per-user configuration. Scheduling starts disabled.
- Research checks up to five explicitly configured public Greenhouse boards, up to 25 postings per board per run. It imports real postings through the existing deduplicating intake path. This is bounded source research, not arbitrary web research or universal job-board discovery.
- It filters titles using optional keywords and evaluates the owner's profile, hard exclusions, work authorization, and baseline fit. Unknown eligibility is not automatically prepared. Baseline scoring is rule based.
- Preparation mode requires the owner's tested BYOM connection and factual resume. Model usage is billed to that provider account. It saves drafts for review; it does not send outreach or apply to jobs.
- Persisted run history includes counts, source errors, and outcomes. In-app completion notifications persist when the browser is closed.
- The Nest API polls every 30 seconds. A database compare-and-set lease prevents overlapping workers. Expired leases recover after a crash. Failed model requests count against the per-run attempt limit. Drafts have a stable, unique automation key per configuration and job; existing application records are skipped.
- Pause increments the configuration revision. Requests already in flight may complete, but draft persistence is fenced inside a transaction against enablement, revision, and lease ownership. Work stops between requests.
- The API server and database must stay running. Closing the browser is fine; stopping or sleeping the local host stops execution. Restarted workers pick up overdue schedules. `AUTOPILOT_WORKER_ENABLED=false` disables polling for an operator.

## What remains before “apply while away” is true

The API rejects `mode: apply`, and the UI labels automatic submissions unavailable. There is no working ATS/browser submission executor in this checkout. Drafts, agent proposals, and emails must never count as submitted applications.

A complete executor needs:

1. Supported source/ATS adapters and an isolated per-user browser session. Document supported sites and login requirements explicitly.
2. An opt-in, persisted application policy: roles, geography, compensation, exclusions, maximum daily submissions, model budget, allowed sources, expiry, and immediate revoke. Capture consent for the actual autonomous scope. Keep manual review mode available.
3. Factual profile/resume mapping and validation for required fields. Unknown or sensitive answers, CAPTCHAs, unexpected consent, changed forms, and ambiguous eligibility pause that application for the user.
4. A durable job queue with leases, attempts, submission idempotency, crash recovery, and an explicit uncertain-delivery state. Do not repeat a submission after a timeout without checking whether the first attempt succeeded.
5. Confirmed provider receipts or site confirmation evidence before setting `SUBMITTED`. Maintain an application event trail and direct links to outcomes. Never fabricate confirmations.
6. Notifications with useful counts and links after each run, plus failures and action-needed states. Web push/email delivery needs an operator configuration and explicit user channel preferences; current delivery is in-app only.
7. Integration tests against supported test fixtures, isolated live verification, restart/pause/concurrency tests, and failure injection around the final submit step.

The existing single-use approval gateway still protects external actions. A future autonomous policy must be deliberately implemented and tested in that gateway; a UI toggle must not silently bypass it.

## Validation

`apps/api/test/e2e.autopilot.test.ts` exercises persistent settings, scope isolation, unsupported application mode, scheduler claims, completion notification persistence, draft dedupe, pause during generation, source failures, schedule changes during an in-flight request, failed-request usage limits, and expired lease recovery against local Postgres. External sources and models are mocked in automated tests; passing tests do not establish live provider or ATS compatibility.

## Open source

Repository: [Jasowills/pursuit](https://github.com/Jasowills/pursuit). See [CONTRIBUTING.md](../CONTRIBUTING.md) for setup and contribution expectations.
