# Desktop, local Core and Pursuit Connect

Research date: **2026-10-22**. Official documentation findings are distinguished from the proposed architecture below. No desktop installer or relay has been built or tested in this research pass.

## Confirmed product decisions

- First alpha must cover **macOS, Windows and Linux**.
- Local desktop is authoritative; no hosted career dashboard or mandatory Pursuit account.
- Optional internet connectivity uses an encrypted relay, with device pairing and revocation.
- Bounded automatic applications are allowed only after explicit policy setup. Outreach sending still requires exact-message approval.

## Desktop shell decision

| Choice   | Verified foundation                                                                                                                                                                                                                                                                                                                    | Assessment for this repository                                                                                                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tauri 2  | Supports target-specific external binaries and scoped native capabilities. Its Next.js guide requires static export rather than server-based frontend features. [Sidecars](https://v2.tauri.app/develop/sidecar/), [capabilities](https://v2.tauri.app/security/capabilities/), [Next.js](https://v2.tauri.app/start/frontend/nextjs/) | Preferred candidate, matching the directive. Use a separate static React desktop frontend, reuse components/contracts, retain Next.js for the website. Prove Core/OpenCode/browser packaging on every target before locking it. |
| Electron | Its security guidance emphasizes the elevated risk of untrusted remote content, isolated privileges and disciplined process boundaries. [Security](https://www.electronjs.org/docs/latest/tutorial/security)                                                                                                                           | Credible fallback if sidecar/toolchain constraints dominate. Familiar Node integration does not remove browser isolation or distribution work. Do not select it merely to embed the current hosted dashboard.                   |

**Recommendation:** Tauri 2 + React/Vite desktop renderer + supervised TypeScript Core, conditional on a cross-platform packaging spike. Keep browser automation in a separate controlled Chromium process, not in the trusted desktop renderer. If Tauri fails a named requirement, record the failure and compare Electron against it; do not silently change frameworks.

Playwright requires compatible browser binaries; version updates can require browser updates. Bundling a webview does not establish that the browser executor is installed. Test browser provisioning, offline reinstall behavior and platform dependencies explicitly. [Playwright browsers](https://playwright.dev/docs/browsers).

## Local persistence and secrets

SQLite is a viable target: Tauri documents SQL/migrations, and the repository's Prisma v6 line supports SQLite. Existing PostgreSQL migrations are not reusable SQLite SQL. [Tauri SQL](https://v2.tauri.app/plugin/sql/), [Prisma SQLite](https://www.prisma.io/docs/orm/v6/overview/databases/sqlite).

Proposed: one Core-owned SQLite writer, repository interfaces, local artifacts, migration ledger, backup/restore and a transactional event log. Avoid exposing arbitrary SQL to the renderer. Preserve stable workspace/entity IDs. Convert current Postgres data through an explicit export/import tool with count/hash checks and a rollback path; do not change the current datasource in place.

A vault is distinct from the OS keychain. Stronghold documents password-derived initialization; choosing it does not automatically deliver native keychain storage or solve unattended unlock. Define native Keychain/Credential Manager/Secret Service behavior and a documented locked-vault fallback. [Stronghold](https://v2.tauri.app/plugin/stronghold/). Full database encryption remains a separate decision from encrypting provider tokens.

## Connect: proposed protocol, not an existing implementation

Both peers initiate outbound connections to a relay; no public inbound desktop API. Pairing occurs through a short-lived one-use QR invitation containing installation identity, authenticated key material/fingerprint and a bounded bootstrap secret. Desktop must confirm the device. QR data must not contain provider/Gmail credentials.

Use a reviewed authenticated channel protocol/library with a defined transcript and device identity binding. Libsodium documents directional key exchange and authenticated ordered streams, but those primitives alone do **not** supply authenticated pairing, cross-reconnect replay defense or revocation. Those need protocol design and security review. [Key exchange](https://libsodium.gitbook.io/doc/key_exchange), [secretstream](https://libsodium.gitbook.io/doc/secret-key_cryptography/secretstream).

Relay requirements:

- Forward opaque encrypted frames; no career documents, provider keys or plaintext approval payloads.
- Separate channel routing tokens from device authority. State what metadata remains visible: addresses, timing, sizes and routing identifiers.
- Authenticated peer identities, protocol/schema versions, device/session epochs and message sequence numbers.
- Desktop permission checks for every command. Mobile cannot invoke arbitrary shell, files, model configuration or raw OpenCode RPC.
- Durable command IDs/idempotency; event replay cursor plus snapshot fallback; explicit conflict responses.
- Short-lived pairing, revocation, rotated session keys and denial of stale commands/approvals.
- Limits on frame size, connections, invitations and rate; no account requirement does not mean an unauthenticated open relay.
- Initially avoid relay message storage. Reconnect retrieves authoritative state from desktop. Desktop off means unavailable; the relay is not a cloud worker.

Approvals bind workspace, action, destination, artifact hashes, draft version, expiry, nonce and device authority. Automatic application grants additionally bind policy version and budgets; the desktop rechecks them at the final effect boundary. Never accept a stale phone approval for a changed draft.

## Gmail and Composio

The current direct Gmail integration uses a web-server client secret and web settings callback. A distributed desktop app needs installed-app OAuth through the system browser and PKCE; desktop clients cannot protect a bundled shared client secret. [Google desktop OAuth](https://developers.google.com/identity/protocols/oauth2/native-app).

Draft creation is not covered by the current send-only permission. Gmail documents `gmail.send` as sensitive, `gmail.compose`/read access as restricted, and verification/security-assessment conditions. Scope and deployment review must precede adding Gmail drafts or reply sync; do not assume local-first eliminates all obligations. [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes), [draft creation](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.drafts/create).

Composio supports project-scoped API credentials and explicitly directs project keys to server-side use. A distributable app must not embed Pursuit's shared project key. Keep it optional through an evaluated supported credential flow, user-owned project configuration in the local trusted Core, or an explicitly disclosed managed integration service. Do not silently turn the Connect relay into a token-processing backend. [Authentication](https://docs.composio.dev/reference/authenticating-to-composio), [production readiness](https://docs.composio.dev/docs/production-readiness).

## Distribution and mobile constraints

Tauri documents signing/notarization and platform packaging. Signing requires operator credentials; producing an executable is not a signed, tested installer. Updater signature validation and code-signing identity serve different purposes. [macOS signing](https://v2.tauri.app/distribute/sign/macos/), [Windows signing](https://v2.tauri.app/distribute/sign/windows/), [updater](https://v2.tauri.app/plugin/updater/).

Expo push needs native credentials and an appropriate development/release build; Expo Go alone does not qualify the feature. No Pursuit account is required for the user-facing design, but Apple/Google push infrastructure and developer provisioning still exist. Send generic wake notifications without resume/message contents. [Expo push guidance](https://docs.expo.dev/push-notifications/what-you-need-to-know/), [setup](https://docs.expo.dev/push-notifications/push-notifications-setup/).

## Required proof spikes

1. Tauri artifact launches bundled Core, pinned OpenCode and controlled browser on all target OSes with no developer tools installed.
2. SQLite migrations/export/import/restore preserve IDs, histories, binary artifacts and unknown states.
3. Secret storage and locked/revoked credentials work on every OS, including a Linux installation without an unlocked secret service.
4. System-browser Gmail PKCE callback survives cancellation and restart; draft scope and verification strategy are explicit.
5. Two paired devices exchange encrypted events/commands over an untrusted relay; MITM/replay/stale policy/revocation tests fail closed.
6. Push, reconnect, desktop sleep and two-device concurrent approval are tested on real iOS and Android builds.
