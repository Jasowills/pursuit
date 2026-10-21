# Pursuit — Requirements Traceability

Maps specified requirements → where implemented → verification evidence → status. Status symbols: ✔ verified, ● implemented (verification pending), ○ scaffolded, ✖ not started, n/a explicitly deferred by scope decision.

## Foundation (README.md / OPENCODE.md first assignment)

| Requirement                 | Location                                                             | Verification                                                                    | Status |
| --------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------ |
| Specs extracted & preserved | `docs/specifications/`                                               | 9/9 documents, byte-for-byte copies, no missing                                 | ✔      |
| Monorepo scaffold           | repo root                                                            | `pnpm install` + `typecheck`/`test`/`build`/`format:check` green (11/9/6 tasks) | ✔      |
| Strict TypeScript           | `tsconfig.base.json` (`strict:true`, noUncheckedIndexedAccess, etc.) | `pnpm typecheck` 11/11 tasks green (incl. Expo mobile)                          | ✔      |
| Docker Compose local infra  | `infrastructure/docker-compose.yml`                                  | containers healthy; fresh-DB migrate apply verified (37 tables)                 | ✔      |
| CI                          | `.github/workflows/ci.yml`                                           | workflow authored + YAML-validated; first GitHub run still pending              | ●      |
| Approved adapter, not model | `packages/agent-core/`                                               | OpenCode round-trip verified live (PONG/tokens); DevAgentRuntime 10/10 tests    | ✔      |

## BRAND_AND_LANDING (DEX)

| Requirement                              | Location                                                | Verification                                                                    | Status |
| ---------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------- | ------ |
| Sticky header/wordmark/center-right CTAs | `apps/web` Header                                       | visual check 390/768/1440 (screenshots in `.validation/`)                       | ✔      |
| Hero eyebrow/H1/subhead/CTAs/trust note  | `apps/web` Hero                                         | copy matches spec verbatim; white-on-black CTA rendered                         | ✔      |
| Product preview in browser frame         | `apps/web` HeroPreview                                  | illustrative static preview of the real dashboard structure, labeled as preview | ✔      |
| How-it-works/features/safety/FAQ/footer  | `apps/web` sections                                     | rendered at 1440/390, copy reviewed                                             | ✔      |
| Mobile-purpose-built hero                | `apps/web` (media queries, distinct mobile composition) | screenshot at 390px (`.validation/landing-390.png`)                             | ✔      |
| Exact tokens                             | `packages/ui` design tokens                             | values copied from DESIGN_SYSTEM.md; mirror for native                          | ✔      |
| Motion budget                            | 150–200ms, reduced-motion guard                         | CSS review + reduced-motion media query                                         | ✔      |
| No fake claims about auto-submission     | landing copy review                                     | "You approve what gets sent." visible                                           | ✔      |

## DESIGN_SYSTEM (DX kit)

| Requirement                                                                          | Location       | Status                                                      |
| ------------------------------------------------------------------------------------ | -------------- | ----------------------------------------------------------- |
| Tokens CSS + spacing/typography scale                                                | `packages/ui`  | ✔                                                           |
| Button/Input/Badge/Card/Dialog/DataTable/Tabs/Empty/Error/Loading                    | `packages/ui`  | ● (dialog/data-table/tabs not yet consumed by M1 pages)     |
| JobCard/ApprovalCard/WatcherCard/ResumeVersionCard/AgentRunTimeline/NotificationItem | `packages/ui`  | ● (dashboard uses local compositions; cards live in web/ui) |
| Showcase route                                                                       | `/showcase`    | ✔ (builds + prerenders static)                              |
| 44px hit targets                                                                     | CSS min-height | ✔ (buttons/inputs/nav verified in UI)                       |
| Focus rings 2px + offset; reduced motion                                             | global CSS     | ✔                                                           |

## ARCHITECTURE

| Requirement                            | Location                               | Status                                                        |
| -------------------------------------- | -------------------------------------- | ------------------------------------------------------------- |
| Monorepo layout (apps + packages)      | repo tree                              | ● (worker module parked inside apps/api bootstrap per DEC-02) |
| API/user/db proxied; tenant-isolated   | apps/api guard + prisma §DataAccess.ts | ✔ (cross-tenant e2e: 404/empty list)                          |
| Approval workflow for external actions | approvals module + domain events       | ✔ API (hash-bound, single-use); no external senders exist yet |
| Playwright worker                      | apps/browser — deferred                | ○ M3                                                          |
| Watcher engine                         | watchers module (data+API+UI)          | ○ scheduler in M4; UI says execution unavailable              |

## DATA_MODEL (all tables)

Comprehensive Prisma schema covers: tenants, users, memberships, sessions, devices, career_profiles + experiences/education/skills/projects, companies, job_sources, jobs, job_snapshots, job_matches, resume_masters, resume_versions, applications, application_answers/events, contacts, outreach_threads/message, watchers, watcher_events, agent_runs/steps, approvals, tool_grants, connected_accounts, notifications, audit_logs, outbox_events. Status ● with migrations. Tenant scoping via repository helpers + unique logical indexes (see `packages/database/prisma/schema/*` files).

## SECURITY_AND_POLICY

| Requirement                                          | Implementation                                                                                                                                           | Status               |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Untrusted docs treated as data (silver bullet check) | shared/untrusted-document-tag helpers + prompts; agent-core strips instruction markers; **real browser/DOM pathway deferred (M3) — hardening scheduled** | ●                    |
| Approval policy (locked)                             | approvals module + `ApprovalService` (hash-bound, single-use, expires, editable invalidation)                                                            | ●                    |
| Rate limiting logins/API                             | thin token-bucket middleware in apps/api (basic, per-route)                                                                                              | ●                    |
| Audit trail on every mutation                        | audit_logs written by API interceptor for mutations                                                                                                      | ●                    |
| SSRF guards                                          | reserved for watchers/browser phases; user-provided URLs validated syntactically + HOST allowlist ready                                                  | ○ completed in M3/M4 |
| Redacted logs                                        | agent-core redacts `token`-like keys when building step records                                                                                          | ●                    |

## PRD P0/P1 (subset for milestones deliberately built first)

Manual job intake (M1) / qualification pipeline scaffolding / resume vault early paths / application pipeline states (full legal chain verified through SUBMITTED with confirmation evidence; UI exposes legal transitions only) / agent run proposal surface (via OpenCode in sandbox) / watchers scaffold / outreach scaffold / notifications surface. Deferred to later milestones: ATS adapters, DOCX/PDF rendering, browser automation and confirmation evidence, Gmail OAuth and sending, push notifications, S3 storage. See IMPLEMENTATION_PLAN milestones M2–M6 for those and their acceptance tests as scheduled.

## DELIVERY_PLAN acceptance status (milestone one viewport)

- Clean install/typecheck/tests/build: ✔ `pnpm install`, `typecheck` (11/11), `test` (9/9), `build` (6/6), `format:check` green
- Landing page inspected at 390/768/1440: ✔ Playwright screenshots in `.validation/`; two real CSS defects found and fixed
- No secret in repo: `.env`/`.env.*` ignored except `.env.example`; workspace is not a git repo, so `git check-ignore` could not be run — pattern reviewed
- Migrations reproducible on fresh DB: ✔ `pursuit_migration_check` → 1 migration/37 tables; seed run twice with identical counts

## Verification evidence added 2026-10-21

| Check                 | Evidence                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API suite             | 14/14 jest tests (unit + careers e2e + SSE e2e) against real Postgres                                                                                     |
| Shared/agent-core     | 26/26 and 10/10 vitest tests                                                                                                                              |
| Web journeys          | Playwright production build: login, overview, jobs, application transition, agent run, watchers, settings at 390/768/1440                                 |
| Mobile shell          | Expo SDK 58, dev login → secure-store token, 5 tabs; `tsc --noEmit` green (not run on device)                                                             |
| Fresh DB              | migrate deploy + double seed, 37 tables, idempotent counts                                                                                                |
| CI                    | workflow file authored, YAML valid; execution awaits a GitHub remote                                                                                      |
| Honest unavailability | outreach, Gmail, resume upload/tailoring, watcher execution, real model runs, push/email delivery, autonomous browser actions all render explicit notices |
