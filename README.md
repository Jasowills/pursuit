# Pursuit

**Your next opportunity doesn't wait. Neither should you.**

Pursuit is a personal career automation platform: it tracks target roles, scores
eligibility, runs a proposal-only agent, and keeps a human approval in front of
anything that leaves the building. This repository is a pnpm + Turborepo
monorepo with a Next.js web app, an Expo mobile shell, a NestJS API, shared Zod
contracts, a Prisma/Postgres data layer, and a constrained OpenCode adapter.

The governing rule across every surface: **nothing fabricates success.** Features
that are not implemented say so, agent tool steps are recorded verbatim, and an
application can only enter `SUBMITTED` with a real `confirmation_ref`.

---

## What is in this milestone (M1)

| Area                                               | Status                                 |
| -------------------------------------------------- | -------------------------------------- |
| Landing page (brand + design system)               | Implemented                            |
| Dev login (passwordless, 7-day DB sessions)        | Implemented — dev only                 |
| Career profile read/update                         | Implemented                            |
| Manual job intake, dedupe, eligibility scoring     | Implemented                            |
| Application state machine + event timeline         | Implemented                            |
| Approval records (hash-bound preview payloads)     | Implemented (API)                      |
| Agent runtime (`dev`, deterministic)               | Implemented — proposal-only            |
| SSE event stream (outbox-backed)                   | Implemented                            |
| Watcher CRUD + enable/disable                      | Implemented                            |
| Notifications (in-app)                             | Implemented                            |
| Web dashboard (9 pages) + `/showcase`              | Implemented                            |
| Expo mobile shell (Home/Jobs/Agent/Outreach/Vault) | Implemented (typechecked)              |
| Real model runs (OpenCode provider)                | Adapter exists; provider decision open |
| Watcher execution / job discovery                  | Not available yet                      |
| Outreach drafting / sending                        | Not available yet                      |
| Gmail / LinkedIn connections                       | Not available yet                      |
| Resume upload / AI tailoring                       | Not available yet                      |
| Autonomous browser actions                         | Not available yet                      |

Unavailable features are rendered as explicit notices in the UI and labeled in
the API docs — never as dummy buttons that pretend to work.

## Architecture

```
apps/
  api/      NestJS REST API (/api/v1) + SSE stream, tenant-scoped
  web/      Next.js 15 dashboard + marketing site (Tailwind v4)
  mobile/   Expo (React Native) shell, same REST contract
packages/
  shared/   Zod contracts, state machine, dedupe/eligibility, prompt policy
  database/ Prisma schema, tenant-scoped client, migrations, seed
  agent-core/  Runtime interface, policy gateway, dev + OpenCode adapters
  ui/       Design tokens + shared web tokens
docs/
  specifications/  Product, architecture, security, design specs
  TECHNICAL_AUDIT.md, REQUIREMENTS_TRACEABILITY.md, OPEN_QUESTIONS.md, ...
```

Key invariants (enforced in code + tests):

- **Tenant isolation** — every query goes through `tenantDb(tenantId)`; cross-tenant reads return 404/empty, not someone else's data.
- **Evidence-bound submissions** — `SUBMITTED` requires `confirmation_ref`; illegal transitions are rejected by a shared state machine.
- **Approvals are hash-bound and single-use** — changing a preview payload invalidates the approval; replaying one returns `approval_already_used`.
- **Policy-gated tools** — the agent can only call allow-listed tools; gated tools (`submit_application`, `send_outreach`) never execute without an approval.
- **Untrusted content stays data** — job postings, emails, and web content are never treated as instructions (see `packages/shared/src/untrusted.ts`).
- **Secrets never in the repo** — `.env` files are gitignored; `.env.example` lists names only.

## Prerequisites

- Node.js 22+
- pnpm 11 (`corepack enable`)
- Docker (Postgres 16 + Redis 7 via `infrastructure/docker-compose.yml`)

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Start Postgres (port 54329) and Redis (port 63799)
pnpm db:up

# 3. Database environment
#    packages/database/.env must contain:
#    DATABASE_URL="postgresql://pursuit:pursuit@127.0.0.1:54329/pursuit?schema=public"
cp .env.example .env   # shell-level overrides (optional)

# 4. Migrate + seed (demo tenant: demo@pursuit.local)
pnpm db:migrate
pnpm db:seed

# 5. Build once, then run the API (port 4000) and web (port 3000)
pnpm build
pnpm dev:api
pnpm dev:web
```

Open <http://127.0.0.1:3000>, sign in with any email/display name (dev login),
or use the seeded account `demo@pursuit.local`.

### Mobile shell

```bash
pnpm dev:mobile          # expo start
# or from apps/mobile: pnpm start / pnpm ios / pnpm android
```

The app talks to the same API. On a **physical device** `127.0.0.1` is the
phone itself — point it at your machine's LAN IP:

```bash
EXPO_PUBLIC_API_URL="http://192.168.1.20:4000/api/v1" pnpm dev:mobile
```

The mobile shell stores the session token in `expo-secure-store` on native
builds. There is no Xcode/simulator requirement for a UI smoke check: an Expo
**web preview** renders the same React Native components at a phone viewport.

```bash
pnpm --filter @pursuit/mobile web          # dev preview on :8081
pnpm --filter @pursuit/mobile export:web   # static export to apps/mobile/web-dist
```

The web preview is a development aid only (token falls back to localStorage);
native builds remain the shipping target.

## Environment variables

| Variable                      | Where                    | Purpose                                                  |
| ----------------------------- | ------------------------ | -------------------------------------------------------- |
| `DATABASE_URL`                | `packages/database/.env` | Postgres connection (Prisma CLI, seed, API runtime)      |
| `REDIS_URL`                   | shell / `.env`           | Reserved for queued watcher execution (not used yet)     |
| `PORT`                        | API                      | HTTP port, default `4000`                                |
| `CORS_ORIGINS`                | API                      | Comma-separated allowed web origins                      |
| `ENABLE_DEV_LOGIN`            | API                      | `false` disables dev login (default enabled in dev)      |
| `NEXT_PUBLIC_API_URL`         | web                      | API base URL, default `http://127.0.0.1:4000/api/v1`     |
| `EXPO_PUBLIC_API_URL`         | mobile                   | API base URL reachable from the device                   |
| `AGENT_RUNTIME`               | API                      | `dev` (default, deterministic) or `opencode`             |
| `OPENCODE_BASE_URL`           | API                      | OpenCode server URL (only when `AGENT_RUNTIME=opencode`) |
| `OPENCODE_PASSWORD`           | API                      | Password printed once by `opencode serve`; never commit  |
| `OPENCODE_MODEL`              | API                      | Model ID used by the adapter                             |
| `STORAGE_DRIVER` / `DATA_DIR` | API                      | Local file storage (S3 reserved)                         |

Never commit real values. `.env.example` documents names only.

## Quality gates

```bash
pnpm typecheck        # all packages/apps (turbo)
pnpm test             # shared, agent-core, API (jest + supertest); database has no unit files
pnpm build            # builds packages, API, web (Next static pages)
pnpm format:check     # prettier
```

- API tests require the Postgres container and `DATABASE_URL` (they run against
  the real schema and clean up with unique stamps).
- `AGENT_RUNTIME=dev` is CI-safe and makes no network calls to model providers.

## Documentation

- `docs/specifications/` — PRD, architecture, security/policy, delivery plan, design system, brand/landing.
- `docs/TECHNICAL_AUDIT.md` — what was verified, how, and known gaps (DECISIONS table).
- `docs/REQUIREMENTS_TRACEABILITY.md` — requirement → implementation → evidence.
- `docs/OPEN_QUESTIONS.md` — decisions that need a human (including model provider choice).

## Security and trust

- Dev login is the only auth in this milestone; production identity is not wired.
- No CAPTCHA bypass, no scraping behind logins, no automatic submissions.
- Anything that leaves the system (application submit, outreach send) is gated by
  a human approval that is bound to the exact payload hash and can be used once.
- All API mutations write audit records; agent runs record each step's outcome,
  including policy blocks.
- Untrusted job/email/web text is wrapped as data in prompts and is never
  followed as instructions.

## License

Private — all rights reserved. No license is granted for redistribution.
