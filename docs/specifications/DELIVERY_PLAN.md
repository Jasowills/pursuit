# Pursuit — Delivery and acceptance plan

## Phase 0 — decisions, repo and design foundations

- Initialize pnpm/Turborepo or Nx (choice TBD), lint/test/format, Docker Compose, env schema, CI, OpenCode adapter stub.
- Implement tokens, shared component stories, responsive landing hero and original logo placeholder.
- Acceptance: clean install, tests and typecheck pass, 390/768/1440 snapshots reviewed, no secret in repo.

## Phase 1 — career profile + synced clients

- Auth, tenant isolation, profile CRUD, master resume upload, evidence library, job URL intake, job list, Expo mobile shell, realtime notifications.
- Acceptance: same data visible on two devices; revoked session stops access; cross-tenant tests pass; uploaded document private.

## Phase 2 — qualification + resume vault

- ATS discovery adapters, normalized job schema, eligibility rules, AI fit analysis, DOCX/PDF tailoring, diff and immutable versions.
- Acceptance: ten varied test jobs parsed with source evidence; ineligible roles blocked; generated files readable and factually traceable; resume downloaded on mobile.

## Phase 3 — browser agent + approvals

- Playwright worker, supported ATS form adapters, field-level evidence, approval cards, submission confirmation capture, run logs.
- Acceptance: test ATS site can be completed; no submit without approval; mutation invalidates approval; crash after click doesn't cause duplicate; unknown outcome is flagged.

## Phase 4 — watchers + background operation

- Scheduler, normalized diffing, pause/resume, notifications, retry/backoff, cloud deployment.
- Acceptance: mock new role triggers one alert, unchanged page triggers none; system works when clients closed; rate limit respected.

## Phase 5 — Gmail + outreach

- OAuth, draft generation, approved sending, thread sync, reply classification, follow-up queue, contact dedupe and opt-out.
- Acceptance: no message without exact approval; Gmail message ID stored; reply updates right thread; retries never duplicate send; opt-out blocks future suggestions.

## Phase 6 — hybrid browser extension + hardening

- Optional local extension pairing, browser handoff, offline-safe mobile UX, audit exports, load/security tests.
- Acceptance: local auth stays local; pairing revocable; extension cannot access unrelated origins without permissions; full end-to-end run across web/mobile.

## Release gates

- Green CI; documented migrations and rollback; secrets rotation; backups; basic observability; accessibility review; prompt-injection tests; email sending caps; user-visible privacy policy; incident recovery guide.

## Open decisions (DO NOT silently assume)

1. Trademark/domain/app-store availability of Pursuit and final logo.
2. Which OpenCode version, provider, model, quotas and usage rights work in deployment.
3. Cloud provider, region, budget and always-on browser capacity.
4. Auth provider vs self-hosted auth, tenant ID strategy, RLS implementation.
5. Browser extension distribution and permission model.
6. Which ATS systems and countries are supported first; jurisdiction-specific eligibility logic.
7. Gmail OAuth scopes, verification needs, retention and privacy policy.
8. Social network APIs and whether SMS/WhatsApp are in scope.
9. Job-source crawl policies and paid data vendor choices.
10. Resume template count, default page length, output renderer and storage provider.
11. Exact watcher frequency limits and per-user quotas.
12. Push notification service and deep link scheme.
13. Public beta timing, pricing and public multi-tenancy requirements.
14. Whether dark mode ships later; currently light-only design.
15. Compliance review for jurisdictions and outreach practices.
