# Pursuit — System and agent architecture

## Monorepo

```
apps/web         Next.js App Router
apps/mobile      Expo React Native
apps/api         NestJS REST + realtime gateway
apps/worker      BullMQ background tasks
apps/browser     isolated Playwright browser worker
packages/db      Prisma schema, migrations, RLS helpers
packages/shared  Zod contracts, types, API client
packages/ui      web design system
packages/agent   OpenCode adapter, tool registry, policy engine
packages/resume  templates, DOCX/PDF renderer, validation
packages/sources ATS feeds, company page and social link parsers
packages/gmail   OAuth, drafts, send, watch/history reconciliation
infra            Docker Compose, deployment, observability
```

## Execution topology

Next.js/Expo -> NestJS API -> Postgres/object storage/Redis -> BullMQ -> orchestrator -> scoped OpenCode session -> typed tool gateway -> source/browser/resume/Gmail tools. Push events and realtime updates via notification gateway. Cloud execution independent of client uptime. Local extension optional for user-mediated authenticated workflows; no session cookie copying to cloud.

## OpenCode integration contract

OpenCode is a runtime, not a model. Pin a tested version, discover actual SDK/server API at implementation time, configure existing provider credentials only when supported by provider terms. Do not assume an existing personal subscription or browser session can power a hosted multi-user service. Implement `AgentRuntime` interface:

- `startRun({tenantId,actorId,goal,allowedTools,budget,contextRefs}) -> runId`
- `streamEvents(runId) -> event stream`
- `requestTool(runId,toolName,validatedArgs) -> result` (gateway enforces auth and scope)
- `pause(runId,reason)`, `resume(runId,approvalId)`, `cancel(runId)`
- `getRun(runId) -> status, steps, usage, artifacts`
  Agent output is a proposal, not authority. All tool calls validated with Zod, per-user ACL, rate limits, redaction, network allowlists where appropriate. No unrestricted shell/filesystem/Gmail/browser tools for career sessions. Prevent tool chaining around approval gate. Secrets never included in model context.

## Workflow engine

Durable state transitions with transactional outbox for events. Queue jobs keyed by tenant+source+posting/action. Retries with exponential backoff and dead-letter queue. Idempotency keys on sends and submissions; ambiguous browser submissions require human verification. Approval records bind hash of exact recipient, URL, body/answers, resume version, scope and expiration; any modification invalidates approval. Approval must be obtained before irreversible final action. Approval is single-use.

## Browser execution

- Prefer official public feeds for discovery and authorized APIs where available.
- Browser worker uses Playwright with semantic locators, controlled browser context, screenshots, trace and state snapshots. Use AI navigation only when deterministic adapter fails.
- Separate isolated context per tenant/run, ephemeral storage, short TTL, strict domain controls, SSRF protections, file upload allowlist.
- Browser extension local handoff via authenticated pairing and explicit user consent; never exfiltrate cookies/passwords.
- CAPTCHA, platform blocks, login MFA, legal declarations, unsupported submissions -> `NEEDS_ATTENTION`.
- Capture success confirmation, screenshot and canonical submission URL; if uncertain `NEEDS_VERIFICATION`.

## Watchers

Prefer ATS feed -> structured extraction -> page DOM diff fallback. Store normalized job identity and page version; ETag/Last-Modified where useful. Use schedules with jitter, per-domain concurrency, backoff, request budget and crawl policy. Events NEW/UPDATED/REOPENED/REMOVED, with debounce and idempotent notifications.

## Gmail

OAuth authorization code + PKCE; store encrypted refresh token server-side; request minimal necessary scopes, disclose permissions. Use Gmail history/watch when possible with renewal and full sync fallback. Map thread IDs and message IDs to outreach/application records; sending only after exact-body approval; reconcile uncertain send result by checking Gmail before retry. Never silently email unrelated contacts.

## Sync and notifications

API is source of truth. Every mutable record has `version` or `updatedAt`; optimistic concurrency, cursor pagination, websocket/SSE invalidation and push. Mobile offline writes queued with idempotency keys; conflicts surfaced to user. Notifications use per-device tokens and deep links. Email and push notification content should avoid exposing sensitive details on lock screens by default.

## Testing

Unit tests for eligibility, dedupe, prompt construction, tool permissions and state machines; integration tests for DB/RLS, OAuth mocks, outbox, queues, document rendering; browser tests against owned mock ATS pages; end-to-end web/mobile smoke tests; chaos tests for crashes between send/click and confirmation; prompt-injection red-team fixtures.

---

## Target architecture amendment — 2026-10-22

The approved target is local-first desktop, superseding the hosted/cloud execution topology above. Existing topology documents the current implementation and must not be erased before migration.

- Tauri 2 is the preferred shell candidate, subject to an all-platform packaging proof; React desktop renderer reuses existing UI/contracts. Next.js remains the public website.
- A supervised local TypeScript Core owns a SQLite repository and local artifacts, extracted from existing service logic. PostgreSQL remains a legacy migration/test source, not a desktop installation prerequisite.
- Managed OpenCode runtime, provider connections, typed tools, isolated browser executor and an execution-authority service are separate boundaries.
- Career Identity facts, Writing Identity and source evidence supply minimal task-specific context.
- Durable tasks/checkpoints, a side-effect ledger, usage reservations and sequenced workspace events replace assumptions of in-memory execution or timestamp-only synchronization.
- Optional accountless Connect uses authenticated end-to-end encrypted device channels through a relay. No public unauthenticated local API, no provider secrets in relay, no cloud execution when desktop is off.
- Bounded application-policy grants and exact manual outreach approvals are separate authority sources. Each effect is still bound to one exact payload/version/attempt and confirmed before successful state changes.

Implementation/migration detail: [desktop plan](../DESKTOP_IMPLEMENTATION_PLAN.md). Technical findings and unproven choices: [desktop/Core/Connect](../research/desktop-core-connect.md), [OpenCode](../research/opencode-runtime-and-models.md).
