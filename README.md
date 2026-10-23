# Pursuit

An open-source, local-first career assistant. Pursuit is being built to discover suitable roles, prepare grounded application materials, track the search, and carry out bounded work with your own models.

**Developer alpha — not a complete unattended job-application service.** The desktop workspace, retained web/API prototype, and mobile shell have different capabilities. Product-tour screens use fictional data and perform no external actions. See the [feature checklist and audit](docs/qa/REPORT.md) before relying on a feature.

[Product direction](PRODUCT.md) · [Contributing](CONTRIBUTING.md) · [Architecture](docs/PRODUCT_CAPABILITY_MAP.md) · [Connection setup](docs/CONNECTION_SETUP.md) · [Pipeline decisions](docs/CAREER_PIPELINE_DECISIONS.md) · [Interviews, tasks & leads](docs/POST_APPLICATION_WORKFLOW.md) · [Sourcing engine](docs/DISCOVERY_ENGINE.md)

The latest [release review](docs/qa/adversary-2026-10-23/report.md) records executed tests, failures and remaining production gates. Use **Help & report an issue** in the native app to preview and copy optional local diagnostics. No diagnostic report uploads automatically; see [privacy and crash-recovery limits](docs/DIAGNOSTICS.md).

## Job sourcing service

The headless discovery engine fetches Greenhouse, Ashby, Lever, Workable and Himalayas jobs; extracts static employer JobPosting data; and keeps RSS/Atom and hiring-thread signals as unverified leads. It stores source evidence and freshness locally, groups canonical duplicates, and ranks with BM25 plus evidence-based matching without model calls. Optional Brave search discovers additional employer-board candidates.

```sh
pnpm discovery hunt packages/discovery/examples/profile.json
```

Replace the synthetic profile first. This CLI and the expanded retained API importer are working code; the native bounded-search path is connected, while broad social-platform access and complete international eligibility remain unfinished. See [setup, source coverage and limits](docs/DISCOVERY_ENGINE.md) and the [executed QA report](docs/qa/DISCOVERY_REPORT.md).

## Native sourcing and application review

Open **Opportunities → Engine setup** in the desktop app. With Node 22.13+ installed, set your search preferences, add public employer sources, run a bounded search and save roles with their match evidence. Search and matching do not call a model or require the web API.

The harness now connects a saved role to reviewed tailoring, its saved PDF, Ashby form inspection, explicit answers, exact approval, a separate submit action and recorded outcome. Execution is off by default and requires an installed compatible browser. Live employer forms remain unqualified. See [setup and workflow](docs/NATIVE_JOB_WORKFLOW.md) and [executed verification](docs/qa/NATIVE_WORKFLOW_REPORT.md).

## Resume tailoring and application work

Choose a personal story, formal, or short conversational style in the tailoring studio. Generated letters and contact follow-ups exclude em dashes and stock claims such as “scalable”. Source resume facts remain unchanged. See the [writing rules and current limits](docs/WRITING_POLICY.md).

Desktop installer builds target Apple Silicon Macs, Intel Macs, Windows x64 and Linux x64 separately. The [build guide](docs/DESKTOP_BUILD_STATUS.md#installer-qualification-refresh-2026-10-23) explains unsigned test artifacts, checksums and runtime prerequisites. Public signed downloads are not available.

The native **Resumes & letters** studio imports text PDFs, DOCX and text; requires extraction review; selects source-backed experience; offers three introduction tones; and saves/exports actual PDFs. No model call is required. The retained API also stores original documents and PDF versions with owner checks. A live Qwen 2.5 7B selection test used 183 input and 24 output tokens.

The first Ashby hosted-form executor and persistent worker are implemented behind operator configuration. The source-to-PDF-to-form fixture passes without contacting an employer; live Ashby qualification remains unfinished; native review controls now use the local coordinator. Company research returns published source evidence, and the harness keeps copyable follow-up drafts with a role.

See [setup and exact boundaries](docs/TAILORING_AND_APPLICATION_ENGINE.md), [executed checks](docs/qa/TAILORING_APPLICATION_REPORT.md), and the [fictional PDF example](output/pdf/tailored-resume-example.pdf).

## What works today

| Capability                                  | Desktop                                                               | Retained web/API                                              |
| ------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------- |
| Career facts, preferences and local records | SQLite career book and identity                                       | Tenant-scoped Postgres profile and records                    |
| Assistant conversation                      | Managed, tool-denied OpenCode with BYOM; Ollama verified locally      | Earlier agent adapter/prototype                               |
| Job intake                                  | Bounded public-source search; save sourced or pasted postings         | Manual intake; multi-ATS/Himalayas/page importer              |
| Resume and cover-letter drafting            | Reviewed source selection and saved PDF export                        | Source-backed packets, original documents and saved PDFs      |
| Watchers                                    | No watcher executor                                                   | Configuration CRUD; no polling executor                       |
| Scheduled work                              | No background sourcing/application worker                             | Research/preparation; optional exact-plan Ashby worker        |
| Automatic applications                      | Gated local Ashby executor; individually approved, not live-qualified | Gated Ashby executor; fixture-qualified, not live-qualified   |
| Gmail                                       | Not connected to native workspace                                     | Direct Google OAuth or Composio; exact saved-message approval |
| Mobile companion                            | No pairing/relay transport                                            | Expo prototype; no released phone companion                   |

The queue enforces a ceiling of up to 100 attempts per UTC day; this does not guarantee 100 eligible or completed applications. Broad global discovery and the optional user-hosted always-on worker still require further integration and qualification. Indeed/Glassdoor and arbitrary job-board scraping are not implemented. There is no universal applicant-tracking-system submission adapter.

## Desktop quick start

Requirements: Git, Node.js >=22.13 (24 LTS recommended), pnpm 11.12, Rust stable and your operating system's [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/). macOS is locally build-tested; Windows/Linux remain qualification targets. No signed public installers are published yet.

```sh
git clone https://github.com/Jasowills/pursuit.git
cd pursuit
pnpm install --frozen-lockfile
pnpm dev:desktop
```

The desktop uses local SQLite and OS credential storage; Postgres and the Nest API are not needed for its local workspace. Existing legacy task records are retained. The browser-only Vite preview cannot exercise native IPC or the OS vault.

To build locally:

```sh
pnpm --filter @pursuit/desktop build
pnpm build:desktop
```

Native bundles appear under `apps/desktop/src-tauri/target/release/bundle`. A local unsigned build is not a signed/distributed release. macOS may require local developer approval for unsigned binaries.

### Use Ollama

1. Install and run [Ollama](https://ollama.com/), then pull an appropriate text model, for example `ollama pull llama3.2:1b`.
2. In **Models & connections**, select an installed model and run the connection test. The endpoint is fixed to `127.0.0.1:11434`; do not expose it publicly.
3. Install the qualified **OpenCode 2.1.2** runtime. Open **Agent workspace**, choose Ollama and the installed model, then start the managed runtime.
4. Ask Pursuit a question or paste a posting. Include Career Identity only when you choose to share those facts with the selected model.
5. Review every generated claim. A small local model can follow instructions poorly or append runtime context. Successful connection is not proof of resume quality.

Pursuit launches a private OpenCode configuration with tools and integrations denied. It does not inherit a general-purpose coding agent's shell/browser permissions. OpenCode is the runtime, not an AI model. Ollama runs models locally; cloud providers require your own API credentials and may charge for inference. Chat subscriptions do not automatically supply API access.

Managed drafting is bounded to 2,048 output tokens per response and two runtime steps, with tool use denied. Large or complex documents may need a stronger model and further review; this is not a model-spend accounting system. Do not mistake token limits for a guaranteed provider bill.

## Retained web/API development

This prototype contains workflow and integration code that is **not wired into the desktop**. It requires Postgres. Do not expose development sign-in to the internet.

```sh
cp .env.example .env
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev:api
pnpm dev:web
```

Open `http://127.0.0.1:3000`; the API listens on loopback port 4000 under `/api/v1`. Ensure `NEXT_PUBLIC_API_URL`, `WEB_URL` and `CORS_ORIGINS` agree if you use other ports. The API loads the root `.env`; Next also supports its local environment file. Keep credentials in ignored files.

Development sign-in creates a tenant and seven-day session; it is passwordless and disabled in production. Production identity, deployment hardening and public hosting are release gates. Set `ENABLE_DEV_LOGIN=false` to disable development sign-in explicitly.

### Models and prepared materials

Generate a persistent encryption key with `openssl rand -hex 32` and set `CONNECTION_ENCRYPTION_KEY`. Back it up securely: replacing it makes saved provider credentials and refresh tokens unreadable.

In Settings, connect your own OpenAI, Anthropic, Google AI Studio or OpenRouter/Hermes key; select a returned model and run **Test & select**. For local Ollama on the API host, set `ENABLE_LOCAL_MODELS=true` and connect with an empty key. Search workflow accepts a saved job and pasted factual resume; its legacy downloads are plain text. The new tailoring API and native studio support reviewed PDF/DOCX import and saved PDF export; see the [engine guide](docs/TAILORING_AND_APPLICATION_ENGINE.md). Hermes model access does not provide a Hermes Agent runtime integration.

Legacy preparation sends bounded resume and posting excerpts to your selected provider for advisory match notes. Exported candidate material uses reviewed source wording. The new tailoring studio can prepare without inference or request a bounded selection of existing experience IDs. Review gaps, unsupported claims, recipient and exact message. Editing an approved draft invalidates its approval. Ambiguous email delivery locks the draft for verification and is never automatically retried.

### Gmail: two connection options

No live mailbox was connected during the audit. Local tests verify authorization/failure paths and mocked provider contracts, not real consent or delivery.

- **Composio:** create a dedicated project and Gmail authentication configuration, save `COMPOSIO_API_KEY` and `COMPOSIO_GMAIL_AUTH_CONFIG_ID`, restart the API, then authorize your own mailbox in Settings. Use the narrowest required send permissions. Public deployment also requires the callback identity-verifier setup.
- **Direct Google OAuth:** enable Gmail API in Google Cloud, configure the consent screen/test users, create a Web application OAuth client, register the exact `WEB_URL/app/settings` redirect, and save `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`. Restart and connect directly in Settings.

Follow the complete [connection walkthrough](docs/CONNECTION_SETUP.md), or run `bash scripts/setup-connections.local.sh` for guided local configuration. Never paste keys into chat or commit them. A Gmail plugin in a coding tool is separate from a Pursuit user's mailbox grant. No message is sent merely by connecting Gmail or approving a preview.

### Scheduled research

`AUTOPILOT_WORKER_ENABLED=false` disables the retained API polling worker. Existing modes research configured Greenhouse boards and optionally prepare drafts using a verified model. They do not submit job applications. Watcher configuration is separate and currently has no executor. See [autopilot implementation](docs/AUTOPILOT.md).

## Companion development and downloads

There is no App Store, Play Store or installable PWA release, and no implemented accountless encrypted relay/pairing transport. A landing-page phone animation is an illustrative product preview.

```sh
pnpm --filter @pursuit/mobile start
pnpm --filter @pursuit/mobile android
pnpm --filter @pursuit/mobile ios
```

These commands start the Expo development project; native simulators/development builds and platform toolchains are required. They do not produce a production store app. A QR code can open a compatible development build; it cannot provide the unfinished desktop companion functionality. Desktop sleep/offline behavior and the future user-hosted worker are still implementation work.

## Repository map

```text
apps/desktop         Tauri/Rust + React local workspace
apps/web             Next.js landing page, product tour, retained dashboard
apps/api             NestJS tenant-scoped workflow and integrations
apps/mobile          Expo prototype
packages/local-store Rust SQLite records and migrations
packages/discovery   Headless sourcing, verification, company research and ranking
packages/tailoring   Portable source-backed resume engine, imports and PDF rendering
packages/application Bounded Ashby adapter and durable application queue
packages/career-engine Local coordinator and packaged native worker
packages/ui          Shared career workspace and visual components
packages/shared      Zod contracts, matching and transition rules
packages/agent-core  Runtime boundary and agent contracts
packages/database    Prisma/Postgres schema and migrations
infrastructure       Local development containers
scripts/qa           Isolated API/browser/load audit helpers
docs/qa              Executed evidence, findings and feature checklist
```

## Tests and verification

```sh
pnpm --filter @pursuit/shared test
pnpm --filter @pursuit/agent-core test
pnpm test:local-store
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
pnpm --filter @pursuit/api test --runInBand
pnpm typecheck
pnpm --filter @pursuit/web build
pnpm audit --prod
```

API integration tests use real Postgres, so set `DATABASE_URL` to a disposable database and apply migrations first. External providers are mocked in the normal suite. Do not point tests at personal or production data. Native socket tests require loopback access.

Opt-in real Ollama checks (installed OpenCode and model required, temporary workspace, local inference only):

```sh
PURSUIT_TEST_OLLAMA_MODEL=llama3.2:1b cargo test \
  --manifest-path apps/desktop/src-tauri/Cargo.toml installed_ollama_managed_generation \
  -- --ignored --nocapture
PURSUIT_TEST_OLLAMA_MODEL=llama3.2:1b cargo test \
  --manifest-path apps/desktop/src-tauri/Cargo.toml installed_ollama_career_draft \
  -- --ignored --nocapture
```

The draft check verifies wiring and basic grounded content, not exhaustive hallucination freedom. Review the observed metadata-contamination finding in the [audit report](docs/qa/REPORT.md). Full native UI automation, cross-platform installers, live Gmail consent/send and end-to-end unattended applications remain unverified or missing.

Browser annotation regression: `python3 scripts/validation/neutral-refinement.py` (Python Playwright, browser installed, web server running). The continuous walkthrough and isolated companion checks are documented in [CONTINUOUS_STORY.md](docs/qa/CONTINUOUS_STORY.md). Audit helper instructions and measured limitations are in [the audit plan](docs/qa/AUDIT_PLAN.md).

## Security and release status

Credentials belong in the OS vault (desktop) or authenticated encryption (retained API), never in source control. Local career data still needs device protection and backups. Model output and imported job descriptions are untrusted. Approval and recorded submission evidence are distinct concepts; an application record is not proof that an employer received anything.

The October 22 audit verdict is **NOT_READY for the complete autopilot product**. It includes fixed runtime/watcher defects and remaining functional, quality and dependency risks. Local performance measurements are not production capacity claims. See [REPORT.md](docs/qa/REPORT.md) and machine-readable evidence before planning a release.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), reproduce a narrow issue, add behavior-focused verification, and distinguish live evidence from fixtures. Please avoid adding marketing claims or simulated success for unavailable features. Issues and pull requests are welcome at [Jasowills/pursuit](https://github.com/Jasowills/pursuit).

## Competitive research

[DevOpsHunt harness comparison](docs/research/devopshunt-harness-comparison.md) separates its published agent/workspace contracts from authenticated behavior we have not tested, compares them with Pursuit source, and proposes an execution-first build order.
