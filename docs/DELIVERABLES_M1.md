# Pursuit — M1 Deliverables Report

Date: 2026-10-21 · Scope: first working vertical slice (web + API + mobile shell + DB + agent adapter)

## Delivered

| Artifact                               | Location                            | Notes                                                                                                                                  |
| -------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo (pnpm + Turborepo, strict TS) | repo root                           | `apps/*`, `packages/*`, shared tsconfig, Prettier gate                                                                                 |
| Specification archive                  | `docs/specifications/`              | 9 documents preserved verbatim                                                                                                         |
| Shared contracts                       | `packages/shared`                   | Zod contracts, state machine, dedupe, eligibility, prompt-injection helpers; browser-safe barrel + `server` subpath                    |
| Database layer                         | `packages/database`                 | Prisma schema (37 tables), migration, idempotent fictional seed, tenant-scoped helpers                                                 |
| API                                    | `apps/api`                          | NestJS REST `/api/v1`, dev sessions, tenant isolation, Zod validation, audit logs, outbox-backed SSE, approvals, agent runtime factory |
| Web app                                | `apps/web`                          | Next.js 15 marketing site + 9-page dashboard + `/showcase`; Tailwind v4 on design tokens; honest unavailable notices                   |
| Mobile shell                           | `apps/mobile`                       | Expo SDK 58, dev login with secure-store token, five tabs (Home/Jobs/Agent/Outreach/Vault), same REST client                           |
| Agent runtime                          | `packages/agent-core`               | Runtime interface, policy gateway, deterministic dev runtime, verified OpenCode adapter; gated tools never execute                     |
| Local infrastructure                   | `infrastructure/docker-compose.yml` | Postgres 16 on 54329, Redis 7 on 63799 (both healthy)                                                                                  |
| CI                                     | `.github/workflows/ci.yml`          | pnpm 11 + Node 22 + Postgres service: migrate → build → typecheck → test → format check (authored; first run pending GitHub)           |
| Documentation                          | `README.md`, `docs/*`               | Setup, env vars, traceability, audit, decisions, open questions, this report                                                           |

## Verification evidence

- `pnpm typecheck`: 11/11 turbo tasks green.
- `pnpm test`: 9/9 turbo tasks green — shared 26/26, agent-core 10/10, API 14/14 (unit + careers e2e + SSE e2e), database guard (no unit files).
- `pnpm build`: 6/6 tasks green — API `node dist/main.js` boots; web 15 static routes.
- `pnpm format:check`: clean.
- Live API verification: dedupe, eligibility, full transition chain through `SUBMITTED` with `confirmation_ref`, illegal transition 403, approval single-use `approval_already_used`, cross-tenant 404/empty, SSE tenant scoping + 401.
- Live web journeys (production build, Playwright): dev login; overview at 390/768/1440; job intake form; application detail `DISCOVERED → VERIFIED` with audit timeline; agent run `SUCCEEDED` with every step `BLOCKED_BY_POLICY`; watchers CRUD; settings; outreach/vault notices. 15 screenshots in `.validation/`.
- Fresh database: empty DB → `prisma migrate deploy` (1 migration, 37 tables) → seed twice with identical counts (1 user, 5 jobs, 5 matches, 10 resume versions).
- Mobile: `tsc --noEmit` green; Expo web export driven in Playwright at 390px (clean login → new tenant, Home/Jobs/Agent/Outreach tabs, agent run `SUCCEEDED`). Native simulator run is not possible on this machine (Xcode absent) and remains a gap.

## Explicitly not available in M1

Rendered as visible notices in the UI, never fake success:

- Outreach drafting/sending, Gmail/LinkedIn connections
- Watcher execution / automatic job discovery
- Resume upload, AI tailoring, DOCX/PDF generation
- Autonomous browser actions / real application submission
- Real model analysis (`AGENT_RUNTIME=dev` default; provider decision open)
- Push/email notification delivery
- Production authentication and deployment

## Known gaps / next actions

1. Model provider decision (see `OPEN_QUESTIONS.md` #2) before `AGENT_RUNTIME=opencode` is used for real analysis.
2. CI must be run once from a GitHub remote (workspace is not a git repo here).
3. Mobile app needs a native device/simulator pass and a reachable LAN API URL (web preview already verified).
4. ESLint is not configured; gates are strict TypeScript, Prettier, and tests (documented in `IMPLEMENTATION_PLAN.md`).
5. API jest suite emits a force-exit warning (open handle); tests pass — cleanup tracked as hygiene.
6. M2 starts ATS adapters, richer eligibility, and resume rendering per `IMPLEMENTATION_PLAN.md`.

## Run it

See `README.md` → Quick start. Short version:

```bash
pnpm install
pnpm db:up
# packages/database/.env → DATABASE_URL=postgresql://pursuit:pursuit@127.0.0.1:54329/pursuit?schema=public
pnpm db:migrate && pnpm db:seed
pnpm build
pnpm dev:api   # http://127.0.0.1:4000/api/v1
pnpm dev:web   # http://127.0.0.1:3000
pnpm dev:mobile
```
