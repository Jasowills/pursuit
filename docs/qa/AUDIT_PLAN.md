# Audit scope and reproduction

## Requirement model

Known: desktop-first/local records, factual material, user's own model, broad global search, opt-in bounded applications (100/day ceiling), exact approval for outreach, future accountless phone companion and optional user-hosted worker.

Inferred: persisted job/application records must never imply employer receipt; paused work must not commit stale output; secret-bearing requests must use fixed destinations; controls must report unavailable integrations accurately.

Unknown: live Gmail setup (user confirmed none), cloud-provider inference, real employer submission adapters, phone relay protocol. No live mail or external applications are authorized by this audit.

## Application map

- Desktop: Tauri IPC → SQLite/OS vault → private tool-denied OpenCode → Ollama/cloud provider.
- Retained web: Next browser → Nest authenticated session/tenant → Postgres.
- API workflows: Greenhouse import, structured cloud-model drafts, approval-bound Gmail direct/Composio, scheduled research/preparation.
- Mobile: Expo shell, no native desktop transport.
- Marketing: illustrative product-tour data, no actual submission.

## Risk priorities

| Area                                           | Risk        | Method                                               |
| ---------------------------------------------- | ----------- | ---------------------------------------------------- |
| Claimed external actions versus implementation | High        | Trace source and compare with executed journeys      |
| Model context and quality                      | High        | Installed runtime fixture plus real local inference  |
| Credentials/auth/tenant/approval replay        | High        | Existing integration and negative-path tests         |
| Scheduling/recovery/data integrity             | Medium/high | Real-DB patch, lease, pause, concurrency regressions |
| Acquisition/setup/preview honesty              | Medium      | Browser interactions and source/release inspection   |
| Runtime/load/rendering/dependencies            | Medium      | Bounded k6, production browser lab, dependency audit |

## Disposable database

The audit used a separate Docker container and no persistent volume:

```sh
docker run --rm --name pursuit-qa-20261022 \
  -e POSTGRES_USER=pursuit_qa -e POSTGRES_PASSWORD=pursuit_qa_only \
  -e POSTGRES_DB=pursuit_qa -p 127.0.0.1:55439:5432 -d postgres:16-alpine
export DATABASE_URL='postgresql://pursuit_qa:pursuit_qa_only@127.0.0.1:55439/pursuit_qa?schema=public'
pnpm --filter @pursuit/database exec prisma migrate deploy
pnpm --filter @pursuit/api test --runInBand
```

Those are disposable test credentials. Stop only this QA container after the run. Do not run tests against a personal database or stop the developer's normal database container.

## Execution order

1. Inspect docs/schema/routes/runtime and baseline existing tests/builds.
2. Run isolated default suites and record fixture boundaries.
3. Reproduce suspected failures before patching: watcher negative interval; installed runtime replacing user prompt.
4. Apply minimal corrections and rerun relevant suites.
5. Use real Ollama in temporary native runtime; evaluate actual generated text separately from wiring assertions.
6. Boot isolated API on 4401. Use browser login, persist/reload watcher, import a current Greenhouse board, inspect persisted API data, check both unconfigured Gmail paths.
7. Run five-user/ten-second API reads, production landing browser samples, dependency audit and responsive interaction regression.
8. Report capability gaps separately from executable failures. No invented aggregate coverage percentage or mutation-test count.

## Reusable helpers

Build the API, then run the guarded QA server with the disposable DB and `AUTOPILOT_WORKER_ENABLED=false`:

```sh
pnpm --filter @pursuit/api build
NODE_ENV=development ENABLE_DEV_LOGIN=true AUTOPILOT_WORKER_ENABLED=false \
  CONNECTION_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef \
  node scripts/qa/server.cjs
```

The key above is synthetic and only for this throwaway DB. Never use it for personal credentials. The server rejects other DB ports/names, never loads the root `.env`, and uses no Gmail/model credentials.

With the web preview on 3001 and QA API on 4401:

```sh
python3 scripts/qa/browser-workflow.py
node scripts/qa/live-research.cjs
k6 run --summary-export=/tmp/pursuit-qa-load.json scripts/qa/api-load.js
```

The browser helper forwards only its browser context's 4000/4001 API requests to the real QA API; response bodies are not mocked. Cloudflare is a live read-only Greenhouse smoke check and may change; unavailable board responses are failures, not fabricated jobs.

Production frontend lab:

```sh
NEXT_BUILD_DIR=.next-qa pnpm --filter @pursuit/web build
NEXT_BUILD_DIR=.next-qa pnpm --filter @pursuit/web exec next start -p 3303
python3 scripts/qa/frontend-performance.py
```

A custom Next output directory may update generated `next-env.d.ts`/tsconfig include paths; keep machine-specific build paths out of commits. Python helpers require Playwright and Chromium. The frontend lab uses local networking and is deliberately not a production performance certification.

Run installed Ollama checks using the README commands. No host SQLite/identity records, paid provider secrets, mailboxes or external application endpoints are used. For native socket fixtures, grant local loopback access if the execution sandbox blocks listeners.
