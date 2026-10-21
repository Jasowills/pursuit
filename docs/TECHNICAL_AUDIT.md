# Phase 1 — Technical Audit (2026-10-20)

## Environment inventory (verified)

| Capability                        | Finding                                                                                                             | Suitability                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| OS                                | macOS 26.5.2, x86_64                                                                                                | OK                           |
| Node.js                           | v24.16.0                                                                                                            | OK (current LTS-era)         |
| npm                               | 11.18.0                                                                                                             | OK                           |
| pnpm                              | 11.12.0                                                                                                             | OK — chosen package manager  |
| yarn / bun                        | 4.13.0 / 1.4.0 (installed, unused)                                                                                  | n/a                          |
| Git                               | 2.50.1 (Apple Git)                                                                                                  | OK                           |
| Docker                            | 29.8.2 installed; Desktop daemon boots slowly (took ~2 min)                                                         | OK after start               |
| PostgreSQL / Redis local binaries | none (`psql`/`redis-cli` missing)                                                                                   | Use Docker Compose           |
| OpenCode                          | v2.1.1 CLI at /usr/local/bin/opencode                                                                               | OK — agent runtime           |
| OpenCode providers configured     | A DeepSeek API key is stored in OpenCode auth (`opencode auth list` reports it); **key value not read, not logged** | Usable through OpenCode only |

## OpenCode runtime verification (executed test, 2026-10-20)

Started `opencode serve --port 7333` locally. Verified against the real server:

1. Server requires auth; advertises a per-boot password in its local log (`server password …`). Basic auth `opencode:<password>` works; returned bearer tokens/headers did not.
2. `GET /openapi.json` (authed) documents 119 paths.
3. `POST /api/session` with `{"title":"…","directory":optional}` → `{data:{id:"ses_…"}}`.
4. `POST /api/session/{id}/prompt` body `{"text":"…"}` (a `parts`-shaped body is rejected: `Missing key ["text"]`).
5. `GET /api/session/{id}/message` returns transcript with types `idle|user|assistant`, assistant records include `{model:{id,providerID}, tokens, cost, finish}`.
6. `GET /api/experimental/session/{id}/wait` returns when the agent goes idle.
7. SSE at `GET /api/event`.

Round-trip proof: prompt → assistant answer word-for-word `PONG`, providerID `opencode`, modelID `minimax-m3.1-flash-free`, tokens recorded (input 21531, output 4), terminal `idle/outcome: succeeded` event. **The adapter integration is real, not assumed.**

## API milestone verification (executed, 2026-10-21)

- `apps/api` (NestJS) live-verified against the real Postgres:
  - Dev login issues DB-backed sessions (`sha256` token hash, 7-day expiry); no other auth provider is enabled.
  - Job intake dedupes on canonical URL and normalized company+title (verified twice — second intake returns `deduped: true` with the same job id).
  - Eligibility hook runs on intake; `UNKNOWN` never silently passes (unit + e2e covered).
  - **SUBMITTED gate verified live and e2e**: `PATCH …/status {to_status: SUBMITTED}` without `confirmation_ref` → 403 `confirmation_required`; with evidence → event recorded with `evidence_key`.
  - State machine enforced: illegal `DISCOVERED → SUBMITTED` → 403 `transition_not_allowed` (exact transition quoted in the error).
  - Cross-tenant isolation e2e: second tenant gets 404 on read AND write, and an empty list.
  - Approval lifecycle e2e: PENDING → approve → single-use consumption; reuse → 403 `approval_already_used`; not-approved use → 403.
  - Agent runs (dev runtime) complete deterministically with a canned proposal; every requested tool is recorded as `BLOCKED_BY_POLICY` (auditable).
  - SSE `GET /api/v1/events/stream`: verified live — streamed `watcher.created` and `agent.status` RUNNING→SUCCEEDED; the other tenant's event did not appear (tenant-scoped outbox query). Unauthenticated stream → 401.
- Test totals at this checkpoint: API 14/14 green (6 unit, 6 careers e2e, 2 SSE e2e).

### API-side engineering decisions found necessary

| Decision                                      | Notes                                                                                                                                                                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEC-13: server packages are CommonJS          | `@pursuit/shared`, `@pursuit/agent-core`, `@pursuit/database` emit CJS (`module: CommonJS`, no `"type": "module"`). Bundler-only ESM output broke `node dist/main.js`. Web (Next) bundles them; mobile typechecks against them (Metro runtime not exercised in M1). |
| DEC-14: validation pipes are parameter-scoped | Handler-level `@UsePipes` validated `@Param` strings against object schemas (400s). All Zod pipes now attach to `@Body(...)` only.                                                                                                                                  |
| DEC-15: SSE reads the outbox                  | Single sync path: mutations write `outbox_events`; the stream endpoint polls tenant-scoped outbox rows (1 s) and heartbeats. Direct in-process pushes were removed as a second, inconsistent path.                                                                  |
| DEC-16: server-only helpers are a subpath     | `approvalPayloadHash` moved from the contracts barrel to `@pursuit/shared/server`, because the barrel also feeds the browser bundle and must not pull `node:crypto`. Root `server.js`/`server.d.ts` shims bridge the API's Node10 module resolution.                |

## Web, mobile, CI and data-layer verification (executed, 2026-10-21)

- **Workspace gates**: `pnpm typecheck` → 11/11 tasks pass; `pnpm test` → 9/9 tasks pass (shared 26, agent-core 10, API 14; database has no unit files and runs with `--passWithNoTests`); `pnpm build` → 6/6 tasks pass (web: 15 static pages incl. all dashboard routes); `pnpm format:check` clean.
- **Web journeys (Playwright, production build)**: landing at 1440 and 390; dev login; overview at 1440/768/390; jobs intake form; applications list and detail; a real `DISCOVERED → VERIFIED` transition through the UI (timeline recorded actor `user:<id>` + "via web"); agent run started from the UI and completed `SUCCEEDED` with all steps `BLOCKED_BY_POLICY`; watchers CRUD page; settings; outreach and vault honest-unavailable notices. Screenshots in `.validation/` (landing-1440-final, landing-390, login-1440-final, overview-1440/768/390, jobs-1440/390, applications-1440, application-detail-1440, agent-1440/390, agent-run-result-1440, watchers-1440, settings-1440).
- **CSS fixes found by the visual pass** (both were real defects, not cosmetic): Tailwind v4 must be imported with `@import 'tailwindcss'`; custom CSS must live in `@layer base`/`@layer components` or unlayered element rules beat every utility; `text-[var(--x)]` is ambiguous in v4 and is written `text-[color:var(--x)]`.
- **Auth-gate fix**: the dashboard layout re-evaluates the token on route change and login performs a hard navigation, so the gate cannot stay stuck on "anon" after a client-side login; `/app/login` is exempt from the gate.
- **Mobile shell**: Expo SDK 58 app (`apps/mobile`) with dev login (token in `expo-secure-store`; localStorage only in the web preview), bottom tabs Home/Jobs/Agent/Outreach/Vault, same REST client/hook model, honest unavailable notices. `pnpm --filter @pursuit/mobile typecheck` passes. This machine has no Xcode/simulator, so native execution is still an M1 gap; instead the Expo **web export** was exercised in Playwright at 390px: clean-state dev login created a new tenant, Home/Jobs/Agent/Outreach tabs rendered real API data, and a run started from the mobile UI completed `SUCCEEDED` with every step `BLOCKED_BY_POLICY`. Screenshots: `mobile-home-390`, `mobile-jobs-390`, `mobile-agent-390`, `mobile-outreach-390`.
- **Fresh-database replay**: created an empty `pursuit_migration_check` database, ran `prisma migrate deploy` → 1 migration, 37 tables; ran `pnpm db:seed` twice → identical counts (1 user, 5 jobs, 5 matches, 10 resume versions), proving seed idempotence. Database dropped afterwards.
- **CI**: `.github/workflows/ci.yml` (pnpm 11, Node 22, Postgres 16 service, migrate → build → typecheck → test → format check). Authored and YAML-validated, but **not executed** because this workspace is not a git repository with a GitHub remote; first push must confirm it.
- **Known warning**: jest prints "worker process has failed to exit gracefully" for the API suite (open handle, likely Prisma pool/SSE timers). Tests pass; handle cleanup is tracked as a hygiene item.

## What runs locally vs what needs external services

Runs locally (this repository, no approvals):

- Web app, API, DB, Redis, workers, browser worker against local/mocked ATS pages, OpenCode agent runtime, resume rendering, mobile app (Expo Go / dev build), web tests, typechecks.

Needs credentials or later phases (ask before use):

- Gmail OAuth app + verification → not started (Phase 5).
- S3-compatible storage → replaced by local-disk storage driver in dev; S3 driver behind the same interface.
- Push notifications service → deferred; SSE/pull in v1 milestone one.
- Cloud deployment, ATS paid feeds, model usage beyond the operator's own subscription.

## Risks and mitigations noted

| Risk                                                       | Mitigation                                                                                                                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenCode per-boot password changes with restart            | Dev script exports password; adapter reads it from env; never logged elsewhere.                                                                                                 |
| No live Gmail/scraping in this phase                       | All job intake via manual entry, mock ATS fixtures; browser worker isolated; no external sends.                                                                                 |
| Agent has shell/filesystem access inside OpenCode sessions | Search path runs in a dedicated temp project directory; prompts instruct no tools; agent output treated as proposals only; tool gateway enforces ACL before any Pursuit action. |
| DeepSeek key reuse for multi-user service                  | Single-operator dev usage only; recorded as an open question for paid/multi-user.                                                                                               |
| Docker slow boot on this machine                           | Compose is the only infrastructure dependency; tests keep running with in-process fakes where feasible.                                                                         |
| Secrets in repo                                            | `.env*` git-ignored; `.env.example` carries names only; no tokens in logs (verified during audit).                                                                              |
