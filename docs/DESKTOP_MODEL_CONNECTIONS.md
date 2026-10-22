# Desktop model connections

Date: 2026-10-22. These settings are in the desktop app, not the legacy hosted web dashboard.

## Connect a provider

1. Open the locally built Pursuit app and choose **Models**.
2. Enter your provider API key in that provider's password field, then choose **Save key**. A new key travels through the input and native IPC for saving; the input clears immediately. Existing saved keys are never returned to the interface.
3. Choose **Load model catalog**. This requests the provider's current model list. Some catalogs are public, so retrieving a catalog does not establish that the saved key is valid or has inference access. Pagination is currently limited to the first page; the interface discloses when more pages exist.
4. Select a model. OpenCode-hosted models additionally require the API family listed for the model in OpenCode Console; Pursuit does not guess from its name.
5. Choose **Run provider generation test**. This sends only the fixed prompt `Reply with the word ready.` with a bounded output allowance. It may incur provider usage charges. No career information is included. A text response does not qualify agent tools, submission automation or an application-preparation workflow.

Connectors: OpenAI (Responses), Claude/Anthropic (Messages), Gemini (generateContent), OpenRouter including available Hermes models (Chat Completions), Groq (Chat Completions), and OpenCode Console inference with explicit API-family routing. Availability, model compatibility, entitlements and credits remain account-specific. An unsupported model/API combination fails visibly rather than being declared supported.

## Credential storage

Pursuit's native Core uses explicitly selected `keyring` 3.6.3 backends: macOS Keychain, Windows Credential Store, and Linux Secret Service with encrypted D-Bus transfer. Linux requires a running, unlocked compatible Secret Service. A missing or locked store reports an error; there is no file, SQLite, localStorage or mock-store fallback. Linux/Windows release qualification remains outstanding.

Keys are isolated under service `com.pursuit.desktop.providers`, one entry per provider. Native secret strings are wrapped in zeroizing buffers; this is not a claim that all OS, IPC, HTTP or JavaScript memory copies can be erased. Do not put keys into source text, screenshots, the repository or chat.

**Remove saved key** removes Pursuit's OS-store entry after an explicit UI choice. It does not revoke the provider-issued key, erase system backups, or cancel a request already sent. Revoke compromised keys at the provider as well. Model selection and test results are session-local; application-preparation defaults and persistent qualification records are not implemented yet.

Network requests use fixed provider HTTPS hosts, certificate verification, bounded body sizes/timeouts, no proxies and no redirects. Raw provider error bodies are not shown. Corporate proxy-only networks currently fail rather than bypass these restrictions.

## OpenCode runtime versus hosted inference

**Check installed OpenCode** invokes only `opencode --version`. The child has a cleared inherited environment (apart from PATH and necessary Windows OS variables), a Pursuit-owned working directory, separate XDG configuration/data/state/cache directories, an eight-second timeout and child cleanup. It imports no provider credentials or coding project configuration. The probe has passed against the installed v2.1.2 CLI; a GUI-launched app may have a different PATH.

The version probe is CLI detection only. The separate Agent workspace now supervises installed runtime sessions with streaming, interruption and persisted history; see [runtime use and limits](DESKTOP_AGENT_RUNTIME.md). Sidecar bundling, typed career tools and platform release qualification remain unfinished. The hosted connector uses Console inference endpoints; it does not use Go endpoints or promise Go subscription eligibility for career workflows.

## Verification boundary

Native tests cover fixed routing, explicit OpenCode family selection, nested model IDs, catalog pagination indicators, supported response extraction and credential-contract non-disclosure. The credential contract uses an in-memory test double; it does not establish actual OS-store persistence. Browser interaction tests use synthetic IPC and synthetic keys; they do not make provider calls. A separate native macOS Keychain test passed write/read/delete with a temporary non-secret validation entry under a dedicated test service; it did not access existing provider keys. Packaged-app Keychain prompts and persistence across app signing changes remain unverified. No live provider generation has been performed. Windows/Linux credential-store lifecycle remains unverified.

Sources: [keyring backend documentation](https://docs.rs/keyring/3.6.3/keyring/), [OpenCode inference](https://dev.opencode.ai/v2/docs/console/api/inference/), [OpenAI model catalog](https://developers.openai.com/api/reference/resources/models/methods/list), [Claude models](https://platform.claude.com/docs/en/api/models/list), [Gemini models](https://ai.google.dev/api/models).
