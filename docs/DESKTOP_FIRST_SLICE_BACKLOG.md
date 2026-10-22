# First desktop slice: implementation tickets

Date: **2026-10-22**. These tickets define the target acceptance gates. Initial D0 code is underway; see [build status](DESKTOP_BUILD_STATUS.md) for verified work and remaining gates. Use [the master plan](DESKTOP_IMPLEMENTATION_PLAN.md) for later phases. Do not start six unrelated feature builds in parallel.

## Ticket D0 — Cross-platform packaging proof

**Dependencies:** none. **Files:** introduce `apps/desktop`, `apps/core` and a separate `.github/workflows/desktop-alpha.yml`; record exact runtime/browser versions and checksums.

Build only enough UI to inspect lifecycle, errors and the local data location. Launch Core, open/migrate a local database, supervise a pinned OpenCode process or proven embedded SDK, and start/stop the controlled browser. Restrict native commands to explicit capabilities. Clean up child processes on quit; distinguish tray/background operation from quit.

**Evidence:** clean-machine install/launch on macOS ARM/Intel, Windows x64, Linux x64. No Docker/Node/Rust prerequisite. Record artifact size, startup/idle baseline and any webview/browser dependencies. If packaging fails, decide Tauri vs Electron against the observed failure before building the product shell around it.

## Ticket D1 — Local repository and migration contracts

**Depends on:** D0 proof. **Files:** `packages/core` ports, `packages/local-store` repositories/migrations; reuse contracts from `packages/shared` and map current schema in `packages/database`.

Operations: workspace initialize; migration status; artifact put/read; transactional record/event append; export/backup/restore; read-only legacy import preview and explicit import commit. Preserve UUIDs and provenance. Import source is a copy/snapshot of the current database, not a destructive provider change.

**Evidence:** migration round trips, FK/unique constraints, transaction rollback, interrupted-write recovery, fixture count/hash parity, idempotent import and restore. No plaintext provider tokens in SQLite. Pick a single owning data layer; do not mix unrestricted frontend SQL with Core repositories.

## Ticket D2 — Runtime and provider qualification

**Depends on:** D0 and identity/secret-store ports from D1. **Files:** `packages/agent-core`, Core runtime supervisor, desktop Models settings, compatibility tests.

Operations: runtime health/version; list provider connections; list actual models/capabilities; connect/test/revoke; create task session; subscribe to live events; interrupt; recover persisted session reference. Preserve complete nested provider/model identifiers.

Explicit connection entries: **Use existing OpenCode configuration**, **OpenCode hosted models/Zen**, direct provider keys, **Ollama**. Offer generic OpenRouter and Groq when their runtime path passes tests. Selectively import connection configuration with consent, not arbitrary coding-agent hooks/tools. Never copy provider secrets into renderer or model prompt.

**Evidence:** harmless real generation, tool-denial test, actual live streaming/interrupt/restart, unavailable provider handling, local-model capability test, documented entitlement assumptions. Inventory alone is not agent compatibility.

## Ticket D3 — Career Identity facts and confirmation

**Depends on:** D1. **Files:** shared typed schemas, Core Identity service/repositories, desktop onboarding and Identity settings, import parser boundary.

Operations: import document → extracted candidates; list fact candidates; confirm/reject/correct; resolve contradiction; update preferences; read task-scoped confirmed fact set. Suggested facts are separate from canonical confirmed values.

Record evidence document hash/page/span, extraction version and timestamps. Store residence, authorization jurisdiction/status, citizenship, sponsorship and relocation independently. Retain unknown/skipped facts. Education/authorization/compensation/dates need explicit confirmation.

**Evidence:** duplicate/conflicting resume imports, missing education, overlapping employment dates, sponsorship uncertainty, malicious document text, scanned-PDF/manual fallback, deletion/export and restart tests. Writing samples cannot create employment facts.

## Ticket D4 — Writing Identity and document packet

**Depends on:** D2 + D3. **Files:** Core writing pipeline, `packages/resume`, desktop Writing Studio/version comparison, deterministic validators and evaluation fixtures.

Operations: save versioned style rules/approved examples; select relevant facts/company evidence; draft/critique/revise; validate claim set and forbidden patterns; accept edits; export immutable PDF/DOCX with manifest/hash. Start with one reliable template and add the other five through the same renderer.

**Evidence:** generated claims cite confirmed facts; user rules such as no em dashes persist; unsupported metrics are blocked; user edits do not silently become global preferences; PDF text/DOCX structure/page overflow checks pass. Human writing review complements mechanical style checks.

## Ticket D5 — One authoritative job URL and preflight

**Depends on:** D1–D4. **Files:** extract Greenhouse adapter into `packages/sources`, Core company/job evidence, typed question/eligibility resolver, desktop Discover and preflight inspector.

Operations: normalize URL/text; retrieve permitted source; retain job/company snapshot with observed date; evaluate requirements; resolve answers from confirmed facts; create grounded application packet. Add company public-page research with evidence and controlled retrieval.

**Evidence:** remote-US vs worldwide; required vs preferred degree; sponsorship available/unavailable; expired listing; contradictory source; social post pointing to another role; prompt injection; missing language/current salary/certification; duplicate application. Do not submit during this ticket.

## Ticket D6 — Complete the desktop Alpha 1 experience

**Depends on:** D0–D5. **Files:** desktop shell/composer/inspector, reusable UI extraction, first-run flow, local task history, website release manifest/prerelease route.

Demonstrate: install → configure model → import/create resume → confirm facts/style → paste job URL → research → eligibility → tailored resume/cover letter/answers → preflight review → saved evidence and documents → restart and reopen.

**Evidence:** real recordings, keyboard navigation, minimum window/comfortable viewport captures, all-platform installer/run tests and truthful release manifest. Public hosted dashboard navigation is replaced by download/prerelease actions only when an honest replacement exists. Existing app code/data stays recoverable during migration.

## Follow-on tickets

D7: first controlled ATS browser fixture through manual approval and receipt; D8: bounded automatic-application authority and crash/uncertainty reconciliation; D9: Gmail native OAuth/drafts/exact-message send approval; D10: standing goals/budgets/briefings; D11: encrypted relay + pairing; D12: Expo remote commands/approvals/push.

First define these boundaries before enabling D8:

| Operation                                                         | Required authority                                                                                         |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Research / local draft                                            | User-granted task/source/model scope and budget                                                            |
| Fill supported form                                               | Confirmed facts and supported safe browser scope                                                           |
| Final application submit                                          | Exact manual approval **or** valid bounded application grant converted into an exact one-use action ticket |
| Outreach send / follow-up                                         | Exact-message manual approval; application policy is irrelevant                                            |
| Unknown legal/sensitive answer, CAPTCHA/MFA, uncertain submission | Stop/reconcile/manual action; no model-generated authorization                                             |

## Provisioning dependencies to collect at the relevant gate

Code-signing/notarization and CI secrets; supported model credentials entered through the app; Google desktop OAuth project/consent strategy; optional Composio credential mode; relay hosting/domain and retention policy; iOS/Android signing/push setup; isolated browser test accounts. No secrets belong in chat, the repository, release manifests or screenshots.
