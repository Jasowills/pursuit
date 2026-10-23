# Desktop foundation — 2026-10-22

## Implemented

- `apps/desktop`: React/Vite renderer inside a Tauri 2 native shell. Existing web/API/mobile code stays intact.
- `packages/local-store`: native Core-owned SQLite repository with bundled SQLite, migration version guard, foreign keys, WAL, full synchronous writes, and a five-second busy timeout.
- Workspace initialization in the OS application-data directory, task capture, restart-persistent task history, task details, and database location/schema inspection.
- Task and history event commit atomically. Blank/oversized tasks and databases from an unsupported future schema are rejected.
- Renderer invokes a bounded native command set for workspace/tasks, Career Identity and local Ollama checks. No renderer SQL, shell, filesystem or network plugins, no remote page capabilities, and a restrictive production CSP.
- Browser preview explicitly cannot save. There is no mock backend or simulated agent execution.
- Separate CI matrix for macOS ARM/Intel, Windows x64 and Linux x64 internal native executables. This workflow does not publish a release. Runner labels follow the [official GitHub image list](https://github.com/actions/runner-images/blob/main/README.md).

## Run

```sh
pnpm install
pnpm dev:desktop
```

Development requires Node 24, pnpm 11, Rust and the platform's Tauri prerequisites. Installed end-user artifacts should not require these development tools.

```sh
pnpm --filter @pursuit/desktop build
pnpm test:local-store
pnpm build:desktop
```

`pnpm --filter @pursuit/desktop dev` starts only the browser preview on port 1420; persistence requires the native app. Closing the native window quits this foundation build; tray/background execution is not implemented.

## Architecture adjustment

D0 initially proposed a supervised TypeScript Core. The database owner is now a small native Rust Core, avoiding a Node runtime sidecar just for SQLite and establishing one owner for migrations and transactions. TypeScript agent integration remains a future explicit supervised boundary; do not add a second database owner. This does not yet prove OpenCode or controlled-browser packaging.

## Verification

- Renderer production build and strict TypeScript check passed.
- Initial three native repository tests passed: reopen persistence with event parity, transaction rollback on event-write failure, input limits/future-schema rejection.
- Chromium preview checks passed at 1440×950 and 973×968: connection notice, disabled save and no horizontal overflow. Captures under `.impeccable/review/desktop-foundation/` are browser-preview evidence, not native execution evidence.
- Native macOS x86_64 release executable compiled successfully with Rust 1.98.1, Tauri CLI 2.12.3 and Tauri 2.12.5 (locked dependency versions). Executable is approximately 12 MiB; local `Pursuit.app` bundling also passed (11.55 MiB). Bundle path: `apps/desktop/src-tauri/target/release/bundle/macos/Pursuit.app`. This is an internal local build, not a signed/notarized release or the future browser/runtime footprint. Cross-platform CI has not run; a configured matrix is not proof of platform qualification.
- Independent interface review identified a save/edit race and missing programmatic selected state; both were fixed and scored resolved. Native save behavior and assistive-technology interaction remain unverified.

## Remaining D0 gates

Native launch/reopen UI verification; OpenCode/browser process supervision and quit cleanup; packaged runtime/browser versions/checksums; clean-machine installs across all supported platforms; startup/idle measurements; installer signing/notarization and updater qualification. No downloadable alpha is claimed yet.

## Next product slice

Extend labeled-text Career Identity to richer source documents and structured career records; add the OS secret-store port and qualified OpenCode/direct-provider connections; connect confirmed facts and a tested model to one job URL and grounded application materials. Browser application submission, outreach sends, background goals and Connect remain gated by the master plan.

## Career Identity and Ollama increment

Implemented after the initial foundation:

- Schema v2 migrates the v1 task workspace in place without losing task records.
- Career Identity accepts named plain-text sources up to 200000 characters, deduplicates exact content by SHA-256, and preserves original text, line excerpts, extractor version and creation timestamps.
- The deterministic `labeled-text-v1` importer recognizes eight explicit labels: full name, location, work authorization, sponsorship, relocation, target role, salary expectation and education. It does not parse arbitrary resume structure, PDFs or DOCX, and does not call a model.
- Suggestions are never canonical automatically. Confirm, correct at confirmation, reject, and explicitly replace a current confirmed value. A unique index and transaction enforce one current confirmed answer per field; an exact expected-current ID prevents stale replacement. Decision history and superseded facts remain available.
- Source deletion removes its original text, related facts and decision records transactionally after an explicit UI choice. This is workspace deletion, not a secure-erase guarantee for SQLite/WAL files, backups or OS snapshots.
- Models settings can list the actual model catalog at the fixed loopback Ollama endpoint and request a short non-streaming generation using a fixed harmless prompt. No career data or credentials are included. The adapter disables proxies and redirects and bounds response sizes/timeouts. It does not download models or enable agent tools. Selection/testing is session-local; no application-preparation model is saved yet.

Verification: eight local-store tests passed, covering original task behavior plus source provenance/deduplication, migration, confirmation persistence, stale/duplicate decisions, explicit replacement, deletion and rollback. One native HTTP adapter test passed against isolated loopback fixtures, covering complete nested model names, malformed catalog responses and redirects. The Python Playwright UI fixture test passed preview guards, labeled import/review, explicit replacement, history/reload and Models discovery/test states. Populated screenshots are **synthetic IPC fixtures**, not real native saves or live inference; source tests separately exercise real SQLite. Native tests are included in desktop CI.

Run the UI fixture test with the desktop Vite server running and Python Playwright installed:

```sh
python3 apps/desktop/tests/interface.py
```

Implementation references: [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md) and [ureq configuration](https://docs.rs/ureq/latest/ureq/config/struct.Config.html).

Final macOS Intel release rebuild and `.app` packaging passed (12.28 MiB). The interface reviewer found no material issues within this slice. Windows/Linux builds and real native UI operation remain unverified here.

Remaining: native UI end-to-end capture; actual local-model generation; PDF/DOCX import/export; richer multi-valued career records and fact withdrawal; identity export/backup; OS credential storage and OpenCode/direct-provider connections; writing preferences and grounded application preparation. This increment does not enable automatic applications or outreach.

## Secure provider connection increment

Added native OS credential-store adapters and provider catalog/basic-generation connectors for OpenAI, Anthropic, Gemini, OpenRouter/Hermes, Groq and OpenCode Console inference. Stored keys have no renderer retrieval command and are excluded from SQLite. Input keys are cleared before awaiting native save. Fixed HTTPS endpoints, bounded responses/timeouts, no redirects/proxies, sanitized errors and explicit OpenCode API families constrain the network boundary. Saved key, catalog retrieval and text response remain separate UI states; selections/results are not persisted as qualified agent connections.

Added a version-only OpenCode probe with isolated directories, cleared inherited environment and timeout/child cleanup. Live installed probe passed against `opencode v2.1.2`. It does not import provider configuration or start a managed session.

Verification: eight unchanged SQLite tests passed; five native adapter/credential-contract tests passed; the normally ignored installed-CLI probe was explicitly run and passed. The extended Chromium synthetic IPC test passed provider save/input clearing, catalog selection, generation response, key removal and runtime-detection UI. The finish reviewer found no material issues in the settings scope. A separate macOS Keychain backend write/read/delete test passed with a temporary non-secret entry; existing credentials were not accessed. Packaged-app Keychain permission behavior and actual provider inference remain unverified, as do Windows/Linux stores. The final macOS Intel `.app` bundle built successfully (14.36 MiB). See [connection setup and limitations](DESKTOP_MODEL_CONNECTIONS.md).

## Managed desktop Agent increment — 2026-10-22

Implemented private installed OpenCode 2.1.2 sessions, explicit provider/model binding, opt-in confirmed identity facts, real SSE partial text, active interruption and SQLite v3 session snapshots/history. Per-session drafts and identity consent reset prevent accidental sharing across conversations. Normal Stop/Quit cleans up the owned child. No background submissions or outreach are enabled by this increment.

Verification: 10 local-store tests and 9 default native tests passed. Explicit installed-runtime tests passed authenticated queue/restart/cleanup and controlled generation/streaming/interruption without paid inference. Browser renderer checks use synthetic IPC, not native marketing captures. Actual provider compatibility, signed releases and Windows/Linux runtime qualification remain open. See [runtime guide](DESKTOP_AGENT_RUNTIME.md).

Final macOS Intel `.app` packaging passed with project instruction discovery disabled (14.87 MiB). This is an unsigned internal build, not a notarized public release.

## Dark experience refresh — 2026-10-22

The user-approved near-black/lavender theme now covers the desktop renderer and public landing page. The desktop macOS Intel app rebuilt successfully (14.87 MiB, unsigned internal build). Landing interactions pass at 1440, 973, 390 and 320 widths, including keyboard menu closure, resume example selection, illustrative autopilot, platform choice and screenshot dialog. The existing desktop synthetic IPC regression also passes after theming. The landing harness image is an actual unmocked browser renderer capture, visibly disconnected from native storage, with provenance recorded in public/product/harness-dark.json. No new live inference, submission or native UI claim is implied by the theme change.

## Forward motion palette replacement — 2026-10-22

The user rejected lavender and selected a true-black direction with a compact palette. Landing and desktop now use black, ivory, acid yellow and ice blue, including matching mark/favicon/native icons. The landing has an original low-power WebGL field, a post-hero scroll-driven career brief and a full directory/large-wordmark footer. Four-width interaction checks, live/static shader and context-loss/unavailable-WebGL fallbacks, centered scroll activation, and the desktop synthetic IPC regression pass. macOS Intel `.app` packaging passed (14.87 MiB, unsigned internal build). Public installers and submission automation remain unavailable. Reference study: [landing visual references](research/landing-visual-references.md).

## Conversational career workspace — 2026-10-22

The desktop now opens a shared three-column career assistant: conversation and job-posting intake, domain sidebar, and contextual role/resume/letter/video inspector. SQLite schema v4 stores career records and conversation history; existing tasks are retained and surfaced as saved career work. Native model requests use the existing managed runtime, with confirmed identity sharing opt-in. Counts read the local records without inference. The explicit sample tour stays in memory; its actual desktop-renderer capture powers the new landing. See [workspace behavior and boundaries](CAREER_WORKSPACE.md).

The landing preserves the approved WebGL hero and adds the floating navigation, live GitHub count, realistic complete resume tailoring and cover letter, video preparation, background activity, cold outreach/Gmail paths, interactive companion approval journey, lime closing invitation and footer motion. These full-journey previews do not enable native auto-submission, Gmail delivery, background sourcing, OS notifications or a phone app. Current alpha limitations remain consolidated in the FAQ/downloads.

Verification: 11 local-store tests, 9 default native tests (4 opt-in tests ignored normally), existing secure-settings synthetic IPC regression, new casebook UI contract checks, four-width landing/renderer interactions, and WebGL live/static/context-loss/fallback checks passed. Web production build and macOS Intel unsigned internal `.app` packaging passed (14.89 MiB). No new paid-provider inference or Windows/Linux qualification was performed. The fresh design reviewer scored both requested corrections resolved and returned `ship` for those fixes; historical FORM seed/QUALITY BAR evidence was unavailable for this accepted-world extension.

## Neutral harness and annotated landing — 2026-10-22

Removed olive/blue UI surface tints from the shared career workspace and desktop settings; key actions retain primary lime. The actual sample renderer was recaptured, without IPC interception. Desktop UI contract/settings regressions passed and the unsigned internal macOS Intel `.app` package rebuilt successfully (14.89 MiB). Landing now has aligned acquisition actions, an application timeline instead of mode tabs, richer companion screens with visible-only autoplay/pause/reduced-motion controls, neutral shadcn-table activity, three real-company watcher examples, first-party integration marks, Pexels illustrations and per-letter footer motion. These presentation changes do not implement the outstanding job-hunting executor or companion transport.

## Installer qualification refresh, 2026-10-23

The `Desktop installers` workflow replaces bare executable uploads with native installer builds:

| Hardware          | Native runner  | Rust target              | Artifact      |
| ----------------- | -------------- | ------------------------ | ------------- |
| Apple Silicon Mac | macos-15       | aarch64-apple-darwin     | DMG           |
| Intel Mac         | macos-15-intel | x86_64-apple-darwin      | DMG           |
| Windows x64       | windows-latest | x86_64-pc-windows-msvc   | NSIS EXE      |
| Linux x64         | ubuntu-22.04   | x86_64-unknown-linux-gnu | DEB, AppImage |

Each job builds workspace dependencies and stages the engine before native tests. It checks the produced executable’s Mach-O/PE/ELF architecture, requires installer files, checks the worker staging resources, exercises the isolated worker, and uploads a target-specific artifact with `manifest.json` and `SHA256SUMS`. macOS also checks the worker inside the actual app bundle. Windows/Linux installer extraction and clean-machine UI installation remain additional qualification steps; a successful build is not proof of those checks.

Run manually from [Desktop installers](https://github.com/Jasowills/pursuit/actions/workflows/desktop-alpha.yml). Select a successful run for the commit you intend to test, then download the artifact matching your hardware. GitHub requires sign-in for artifact downloads. Artifacts expire after 14 days. Verify each file against its accompanying SHA256SUMS before testing. No automated public release is created by this workflow.

These are **unsigned internal alpha installers**. They are not signed/notarized public downloads. The local career engine currently requires Node 22.13+ on the user’s machine and a configured compatible Chromium executable for application execution. The installer includes the worker and Playwright code, not Node or a browser. Model access and any managed OpenCode runtime must also be configured separately. Do not present the source ZIP as an OS installer or infer Intel versus Apple Silicon from a browser user agent. Windows ARM and Linux ARM are not qualified.

The workflow follows [Tauri’s platform build examples](https://github.com/tauri-apps/tauri-action) and the [Linux baseline guidance](https://v2.tauri.app/distribute/appimage/). Build-script permissions use the explicit `allowBuilds` map required by [pnpm 11](https://github.com/pnpm/pnpm.io/blob/main/blog/releases/11.0.md). The repository’s earlier `onlyBuiltDependencies` configuration was ignored by pnpm 11 and caused clean-run failures; its allowlist has been migrated without granting permission to all dependencies.

The Companion promotion is deferred from the landing page. Its dormant implementation remains in the repository for a future version; no mobile availability is advertised.
