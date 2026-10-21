# Pursuit — Technical Decision Records

Format: DEC-xx · status (decided/proposed) · reversible? · rationale. Spec documents remain authoritative; this file records choices the specs left open plus implementation choices.

## DEC-01 Monorepo tooling — Turborepo + pnpm 11 — decided — reversible

Spec allows Turborepo or Nx (open decision #TBD). pnpm 11.12 is installed and works with Node 24; Turborepo minimal config for first slice. Nx migration later is mechanical.

## DEC-02 Naming: `packages/agent-core` maps to spec's `packages/agent`

Master prompt's target tree uses `agent-core`; ARCHITECTURE.md calls it `packages/agent`. One package only: `agent-core` (contains OpenCode adapter + policy engine). `packages/db` = `packages/database`; `apps/worker` merged into `apps/api` bootstrap until a second process is needed (BullMQ in-process worker mode via env, so topology stays honest); `apps/browser` deferred to M3.

## DEC-03 PostgreSQL + Prisma — decided — reversible per-entity

Spec mandates. Postgres 16-alpine in Compose; Redis 7 for queues/SSE fanout later. UUIDs (Prisma `cuid`/uuid default; UUIDv7 left open, column type already uuid so migration is possible).

## DEC-04 Auth for milestone one: dev session auth — decided — reversible, replaced by OAuth in M5+ window

PRD wants OAuth or passwordless. External OAuth needs credentials the user hasn't provided. Reversible default: email-based dev credential sign-in (`/auth/dev-login`, disabled when `NODE_ENV=production`), DB-backed `Session` records + bearer tokens, sessions/devices tables per DATA_MODEL. Web keeps an httpOnly cookie; mobile keeps the token in secure storage API (expo-secure-store when device support verified). No password hashes fabricated.

## DEC-05 Realtime/sync contract — decided

API is source of truth (spec). Mutable records get integer `version` columns. Clients list/read via REST; subscribe to `GET /api/events/stream` (SSE, tenant-scoped, cursor-based reconnect for revision durability). Mobile uses optimistic updates from Zod-typed API client with a global fetcher; push notifications deferred (snapshot in docs/OPEN_QUESTIONS.md).

## DEC-06 OpenCode adapter — decided — verified

Adapter wraps the OpenCode v2 HTTP server ABI: `POST /api/session`, `POST /api/session/{id}/prompt {text}`, `GET /api/session/{id}/message`, `GET /api/experimental/session/{id}/wait`, `GET /api/event` (SSE), basic auth `opencode:<OPENCODE_PASSWORD>`; boot server via `opencode serve --port $PORT`. Verified live with a real round-trip on 2026-10-20 (assistant reply "PONG"; "Do not mark complete until an integration test succeeds" satisfied). Second impl: `DevAgentRuntime` deterministic, no LLM, for CI. Agent output = proposals requiring the policy engine; jobs dir isolated; no secrets in prompts (SECURITY_AND_POLICY).

## DEC-07 Storage — local disk driver in dev, interface-first

`StorageService` interface with `put/get/sign`. Local driver for milestone one; S3 driver stubbed behind env `STORAGE_DRIVER=s3|local` (needs credentials, not provided). Object keys are random UUIDs (DATA_MODEL: no PII in keys).

## DEC-08 Tailwind CSS v4 + shadcn/ui patterns

Tailwind v4 (CSS-first config matches the token block in DESIGN_SYSTEM.md exactly). shadcn/ui via Radix primitives hand-vendored (no CLI scaffold in packages/ui to keep the package self-contained). Geist via Vercel font package (`geist`) — open font (SIL OFL), satisfies "legal webfont loading".

## DEC-09 Zod (v4) as the single validation layer everywhere

Shared package defines contracts consumed by API pipes, web forms, mobile. Avoid class-validator.

## DEC-10 Test stack

Vitest for unit/integration; @playwright/test dep present for browser-era stories but the first milestone's "browser" acceptance is via a mock ATS fixture, not real sites. Landing visual checks with actual browser tooling at 390/768/1440.

## DEC-11 API surface — REST-first

NestJS REST; WebSockets replaced by SSE (sufficient, simpler, HTTP2-friendly). GraphQL not used.

## DEC-12 First working milestone uses manual job ingestion only

PRD Phase 1 "job URL intake, job list" without ATS adapters (M2). Web form validates job source metadata; dedupe by canonical URL + `company/title` fingerprint; normalized scoring currently deterministic keyword-based (documented as a placeholder pending AI fit).

## DEC-13 Server packages emit CommonJS

`@pursuit/shared`, `@pursuit/agent-core`, and `@pursuit/database` compile to CommonJS (`module: CommonJS`, `moduleResolution: Node10`) and no longer declare `"type": "module"`. Their bundler-resolved ESM output could not be loaded by `node dist/main.js` (extensionless relative imports). Next/Metro still consume the CJS output.

## DEC-14 Validation pipes attach per parameter

Zod validation pipes are applied as `@Body(new ZodValidationPipe(schema))`. A handler-level `@UsePipes` validated `@Param` strings against object schemas and produced 400s; Nest's parameter metadata distinguishes body from route params, so pipes stay parameter-scoped.

## DEC-15 SSE is outbox-only

There is exactly one event-sync path: mutations write `outbox_events`, and `GET /api/v1/events/stream` polls tenant-scoped outbox rows (1 s) with heartbeats. In-process `SseHub` pushes were removed to avoid two inconsistent delivery paths.

## DEC-16 Browser-safe shared barrel, server helpers on a subpath

`approvalPayloadHash` uses `node:crypto`, so it moved out of the contracts barrel into `@pursuit/shared/server`. The web client imports contracts/state machine from the browser-safe root; the API imports the hash helper from the subpath. Root `server.js`/`server.d.ts` shims satisfy the API's Node10 resolution.
