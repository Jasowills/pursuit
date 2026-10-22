# Pursuit

An open-source, local-first career assistant. Pursuit is being built to discover suitable roles, prepare grounded application materials, track the search, and carry out bounded work with your own models.

**Developer alpha — not a complete unattended job-application service.** The desktop workspace, retained web/API prototype, and mobile shell have different capabilities. Product-tour screens use fictional data and perform no external actions. See the [feature checklist and audit](docs/qa/REPORT.md) before relying on a feature.

[Product direction](PRODUCT.md) · [Contributing](CONTRIBUTING.md) · [Architecture](docs/PRODUCT_CAPABILITY_MAP.md) · [Connection setup](docs/CONNECTION_SETUP.md) · [Pipeline decisions](docs/CAREER_PIPELINE_DECISIONS.md) · [Interviews, tasks & leads](docs/POST_APPLICATION_WORKFLOW.md)

## What works today

| Capability                                  | Desktop                                                          | Retained web/API                                                |
| ------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| Career facts, preferences and local records | SQLite career book and identity                                  | Tenant-scoped Postgres profile and records                      |
| Assistant conversation                      | Managed, tool-denied OpenCode with BYOM; Ollama verified locally | Earlier agent adapter/prototype                                 |
| Job intake                                  | Paste and save a posting                                         | Manual intake and bounded Greenhouse board import               |
| Resume and cover-letter drafting            | Conversational draft; requires review                            | Structured saved drafts using a verified cloud-model connection |
| Watchers                                    | No watcher executor                                              | Configuration CRUD; no polling executor                         |
| Scheduled work                              | No background sourcing/application worker                        | Opt-in Greenhouse research/preparation, up to five drafts/run   |
| Automatic applications                      | **Not implemented**                                              | **Not implemented**; application records are not submissions    |
| Gmail                                       | Not connected to native workspace                                | Direct Google OAuth or Composio; exact saved-message approval   |
| Mobile companion                            | No pairing/relay transport                                       | Expo prototype; no released phone companion                     |

The intended 100-applications/day ceiling, broad global discovery and optional user-hosted always-on worker are design decisions, not current execution guarantees. Indeed/Glassdoor and arbitrary job-board scraping are not implemented. There is no universal applicant-tracking-system submission adapter.

## Desktop quick start

Requirements: Git, Node.js 22+, pnpm 11.12, Rust stable and your operating system's [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/). macOS is locally build-tested; Windows/Linux remain qualification targets. No signed public installers are published yet.

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

In Settings, connect your own OpenAI, Anthropic, Google AI Studio or OpenRouter/Hermes key; select a returned model and run **Test & select**. Then use Search workflow to import a Greenhouse board or add a job manually, paste a factual resume, and prepare draft material. Resume/cover-letter downloads are plain text. PDF/DOCX parsing and polished document export are not implemented. The retained API model gateway does not currently support Ollama; native Ollama tests do not prove web-workflow integration.

Preparation sends the selected career facts, resume and posting to your provider. Review gaps, unsupported claims, recipient and exact message. Editing an approved draft invalidates its approval. Ambiguous email delivery locks the draft for verification and is never automatically retried.

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
