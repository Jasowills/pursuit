# Pursuit — Implementation Plan

Authoritative sources: `docs/specifications/*`. This plan translates them into milestones and acceptance criteria. Status column: `[x]` done & verified, `[~]` in progress, `[ ]` not started.

## Milestone M0 — Foundations (DELIVERY_PLAN Phase 0)

- [x] Extract and archive specifications into `docs/specifications/`
- [x] Technical audit of environment (`docs/TECHNICAL_AUDIT.md`)
- [x] Decision records, open questions, traceability (`docs/TECHNICAL_DECISIONS.md`, `OPEN_QUESTIONS.md`, `REQUIREMENTS_TRACEABILITY.md`)
- [x] pnpm + Turborepo monorepo skeleton, strict TypeScript, Prettier format gate, env schema (ESLint is not configured — documented gap)
- [x] Docker Compose: postgres + redis
- [x] Shared Zod contracts package (`packages/shared`)
- [x] Design tokens + UI kit package (`packages/ui`)
- [~] CI workflow (GitHub Actions): typecheck, test, build, format check authored + YAML-validated; first execution pending a GitHub remote

## Milestone M1 — First working vertical slice (current target)

Web + API + mobile + DB + agent adapter, per `OPENCODE.md` "First assignment" and PRD Phase 1 scope:

- [x] `packages/database`: Prisma schema (tenants, users, memberships, sessions, devices, career_profiles, companies, jobs, job_sources, job_matches, resume_masters/versions, applications, application_answers/events, contacts, outreach_threads/messages, watchers, watcher_events, agent_runs/steps, approvals, connected_accounts, notifications, audit_logs, outbox_events), migrations, seed with clearly-fictional data, tenant-scoped access helpers.
- [x] `apps/api` (NestJS): health endpoint; dev-mode session auth; REST resources for profile, companies, jobs, applications, resumes, watchers, agents, approvals, notifications; tenant guard; Zod validation; pagination; audit logging on mutations; SSE event stream for cross-client sync.
- [x] `apps/web` (Next.js): responsive original Pursuit landing page per `BRAND_AND_LANDING.md`; authenticated dashboard shell with Overview, Jobs, Applications, Agent, Outreach, Watchers, Resume Vault, Notifications, Settings; unavailable features explicitly labeled, no fake success states.
- [x] `packages/ui`: Buttons, Inputs, Badge, Card, Dialog, Tabs, DataTable, Empty/Loading/Error states + domain components (JobCard, ApplicationTimeline, ApprovalCard, AgentRunTimeline, WatcherCard, ResumeVersionCard, NotificationItem); component showcase route.
- [x] `apps/mobile` (Expo): auth shell, Home, Jobs, Agent, Outreach, Vault; five-tab bottom nav per `DESIGN_SYSTEM.md`; same REST backend + shared contracts; token in secure storage. Typechecked, not yet run on a device.
- [x] `packages/agent-core`: `AgentRuntime` interface, `OpenCodeAgentRuntime` (verified v2 server API), `DevAgentRuntime` (deterministic, no external calls), policy gateway (allow-listed tools, gated tools blocked), run/step persistence.
- [~] Sync mechanism: API as source of truth, `version`/`updatedAt` on mutable records, SSE invalidation + pull endpoints; demonstrated by editing on web → visible on mobile (same backend).
- [x] Smoke tests: unit tests for eligibility/dedupe/state machines; API integration tests; web build; mobile typecheck; landing page visual check at 390/768/1440.

## Milestone M2 — Qualification + resume vault (DELIVERY_PLAN Phase 2)

- [ ] ATS discovery adapters (Greenhouse/Lever public feeds first) behind `job-sources` interface
- [~] Eligibility rules + explainable fit score; unknown ≠ pass (`UNKNOWN` blocks) — baseline implemented and tested in M1; richer ATS-derived rules remain
- [ ] DOCX/PDF renderer, immutable resume versions, diffs, private storage, mobile download

## Milestone M3 — Browser agent + approvals (Phase 3)

- [ ] Playwright worker, ATS form adapters, submission evidence capture, approval cards, invalidation on mutation, idempotency, `NEEDS_VERIFICATION` handling

## Milestone M4 — Watchers (Phase 4)

- [ ] Scheduler with jitter/backoff, normalized job-ID diffing, NEW/UPDATED/REOPENED/REMOVED events, notifications

## Milestone M5 — Gmail + outreach (Phase 5) — requires user OAuth credentials; do not start without approval

## Milestone M6 — Extension + hardening (Phase 6), per DELIVERY_PLAN
