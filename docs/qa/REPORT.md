# Pursuit functional and adversarial audit

**2026-10-22 · Verdict: NOT_READY for the complete career-autopilot product.**

The UI refinement is finished, and two reproduced implementation bugs were fixed. The product cannot yet find and submit applications unattended through the desktop. Passing prototype tests must not be presented as proof of that capability.

## Executed evidence

| Check                     | Observed result                                                       | Boundary                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Shared contracts/matching | 26 passed                                                             | Deterministic rules, not job-market coverage                                                                                         |
| Agent-core                | 10 passed                                                             | Runtime contracts                                                                                                                    |
| Local-store Rust          | 11 passed                                                             | Temporary SQLite data                                                                                                                |
| Native default suite      | 9 passed, 6 opt-in tests ignored                                      | Reran with loopback permission after sandbox blocked a fixture listener                                                              |
| Installed runtime fixture | 1 passed                                                              | Real OpenCode; synthetic inference, no paid provider                                                                                 |
| Real Ollama connectivity  | 1 passed after fix, 4.69s response                                    | `llama3.2:1b`, private runtime, synthetic prompt                                                                                     |
| Real Ollama career draft  | Basic content assertions passed; manual quality acceptance **failed** | Supplied Postman/SQL facts used, but runtime metadata appended; 53.76s                                                               |
| API integration/unit      | **35 passed, 7 suites**                                               | Real disposable Postgres, mocked model/Gmail transports                                                                              |
| Live research worker      | Completed, 25 jobs persisted, one notification, zero applications     | Real read-only Greenhouse; no model preparation or submissions                                                                       |
| Browser retained workflow | Passed                                                                | Real sign-in → save watcher → refresh → API persistence; Cloudflare Greenhouse import; both unconfigured Gmail paths reject with 503 |
| Landing regression        | Passed at 1440, 1263, 973, 390, 320px                                 | Alignment, neutral surfaces, compact phone, preview interactions/autoplay/pause, reduced motion, logos, overflow                     |
| Builds                    | Web production, API, desktop renderer passed                          | Not signed cross-platform native installers                                                                                          |
| Workspace types           | All 12 Turbo tasks successful                                         | Includes prerequisite builds/cache results                                                                                           |
| Dependency audit          | 0 critical, **3 high, 1 moderate** remain                             | Reduced from 5 high/3 moderate by compatible PostCSS patch                                                                           |
| Local API load            | 574 requests, 0 failures; p95 **41.54ms**                             | 5 VUs/10 seconds, local authenticated list/profile reads                                                                             |
| Frontend production lab   | Desktop LCP 240–344ms; mobile 836–1248ms; CLS ≤0.000355               | Three samples/device, local network, mobile CPU×4, reduced motion, no network throttling                                             |

The frontend sample is not a Lighthouse score, field Core Web Vitals, INP measurement, mobile-device qualification, WebGL frame-rate audit or production capacity claim. The load test does not stress model generation, scraping, OAuth or submissions. No ZAP/Semgrep, penetration-test certification or native OS UI automation was performed.

Machine-readable results: [report.json](report.json). Evidence: [API tests](evidence/api-tests.json), [Ollama](evidence/ollama.json), [real browser](evidence/browser-result.json), [source import](evidence/source-import.json), [live research](evidence/live-research.json), [dependencies](evidence/dependencies.json), [API load](evidence/api-load.json), [frontend lab](evidence/frontend-performance.json).

## Findings and reproduction

### ADV-0001 — Initial native prompt replaced by runtime step-limit instruction — fixed

**High.** `steps: 1` caused OpenCode 2.1.2 to append an assistant-prefill “MAXIMUM STEPS REACHED” instruction before the first inference. A synthetic provider fixture previously ignored request semantics and hid this.

Reproduction: start a temporary managed Ollama session and ask for `READY`. Before correction, `llama3.2:1b` completed with no text and `qwen2.5:7b` continued the injected summary instruction. Inspecting the synthetic outgoing request reproduced the unwanted prefill. Set the tool-denied agent to two steps; the real local reply then contained `READY`. Added a regression that asserts the instruction is absent. Both output-token fields are bounded for compatible providers; the previous 256-token setting was unsuitable for material drafts, and the runtime's separate default completion budget was 32,000. The new response budget is 2,048, with provider-specific fields.

Evidence: `apps/desktop/src-tauri/src/managed_integration.rs`, [Ollama observations](evidence/ollama.json). Tools remain denied; no application execution was added.

### ADV-0002 — Invalid watcher patches and schedule loss — fixed

**Medium.** A patch with `frequency_minutes: -1` returned 200. An interval-only patch also set `nextCheckAt` to null on enabled records; enabling with a new interval used the old interval.

Reproduction: create a 60-minute watcher, patch its interval without supplying `enabled`, inspect its next-check timestamp. Regression first failed because the negative interval was accepted. Added a strict Zod patch contract and merged-state schedule calculation; invalid intervals/types/unknown fields reject, cross-tenant patch returns 404, 30-minute update retains enabled status and recalculates schedule, disabling clears the timestamp. All 35 API tests pass. This fixes **configuration integrity**, not the missing polling executor.

### ADV-0003 — Requested native career execution is absent — open

**High.** Source inspection and native workspace behavior show local intake/conversations, but no native source adapters, watcher scheduler, document packet pipeline, application executor or receipt verification. The retained API is a separate system. No end-to-end native `find → tailor → submit → confirmed receipt` test is possible with the current implementation. Marketing simulations cannot satisfy this requirement.

### ADV-0004 — Companion transport and public installation absent — open

**High.** `apps/mobile` is an Expo prototype; there is no desktop pairing/relay, approval delivery, push-notification transport or released iOS/Android application. Landing acquisition now clearly links to source/setup and labels store availability. No false download or QR installation claim was introduced.

### ADV-0005 — Local-model draft quality fails acceptance — open

**High for unattended material generation.** Real `llama3.2:1b` produced the supplied factual skills in resume/cover-letter paragraphs, then appended model/environment metadata, including a temporary runtime directory. This is not credential disclosure, but is inappropriate application content. Basic keyword assertions pass and are explicitly insufficient as quality evaluation. Keep generated material as a reviewed draft. A stronger qualified model, structured packet schema, source-grounding checks and rejection of contaminated output are needed before unattended preparation/submission. Native conversational output is not a versioned resume export.

### ADV-0006 — Remaining dependency advisories — open

**3 high, 1 moderate advisories**, not four demonstrated exploits. Remaining paths involve Expo tooling (`uuid`, `node-forge`, `braces`) and Prisma configuration (`deepmerge-ts`). The audit recommends versions that require major migration or were not published in this registry (`node-forge 1.4.1`, `braces 3.0.4`). Their latest available versions were 1.4.0 and 3.0.3 at execution. Do not fabricate patch versions or force incompatible majors blindly. Upgrade upstream tooling with compatibility tests; assess reachability for each shipped artifact. PostCSS is patched through a workspace override and the audit was rerun.

## Core-feature acceptance checklist

“Verified” below refers only to the stated boundary. **Missing** is different from **unverified**.

| Feature / user journey                                       | Current state                                                                   | Acceptance remaining                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Native setup, SQLite career book, restart persistence        | Local-store tests pass; renderer builds                                         | Complete native first-run OS UI E2E, platform qualification                      |
| Confirmed identity/preferences/provenance                    | Implemented locally                                                             | Broader usability and model-sharing review                                       |
| BYOM catalog and connection test                             | Native contracts pass; live Ollama proven                                       | Live cloud-provider qualification, quota/revocation UX                           |
| Private OpenCode runtime, tool denials, streaming, interrupt | Installed synthetic integration passes                                          | Broader OS/runtime/model matrix                                                  |
| Assistant local counts and posting intake                    | Existing workspace interaction checks                                           | Full native IPC UI journey                                                       |
| Global keyword/role-family discovery                         | **Missing** native; only bounded Greenhouse prototype                           | Source inventory, eligibility, freshness, rate limits, dedupe, ranking           |
| Greenhouse import                                            | **Live verified** retained API: 25 persisted jobs                               | Coverage beyond first 25, other sources, native execution                        |
| Ineligible/unknown matching                                  | Deterministic contract tests                                                    | Real profile corpus and explainable user review                                  |
| Watcher configuration                                        | Persistence/browser/regression pass                                             | **Missing** scheduler, change detection, notifications                           |
| Resume tailoring/cover letters                               | Live native text draft, quality fails; web structured workflow fixture-tested   | Grounded versioned packets, PDF/DOCX import/export, contamination rejection      |
| Video requirement/script/help                                | Product-tour illustration only                                                  | Actual requirement detection, notification and preparation workflow              |
| Autopilot discovery/preparation                              | Retained API research live-run passed; lease/pause/dedupe/failure fixtures pass | Live scheduled model preparation, native worker, resumability across OS          |
| 100/day bounded auto-apply                                   | **Missing** executor; API rejects unsupported apply mode                        | Consent policy, daily/spend limits, form adapters, idempotent receipts, recovery |
| Application tracking                                         | Records and evidence/transition gates tested                                    | Employer receipt extraction; true submission executor                            |
| Contact sourcing/cold outreach pipeline                      | Illustrated; approved send prototype                                            | Legitimate contact discovery, provenance, reply/follow-up state                  |
| Direct Gmail                                                 | PKCE/state mocked contracts pass; unconfigured path rejects locally             | Test-account consent, send, revoke, refresh and ambiguous-delivery verification  |
| Composio Gmail                                               | Prototype and mock boundary checks; unconfigured path rejects locally           | Live managed authorization and callback identity validation                      |
| Background notifications                                     | Retained in-app records tested                                                  | Native/push delivery, user-hosted always-on worker                               |
| Phone match → review → approve → complete                    | Landing preview only                                                            | Native/mobile encrypted pairing, signed approvals, offline/stale handling        |
| Desktop downloads                                            | Source ZIP and build instructions                                               | Signed macOS/Windows/Linux releases and update testing                           |
| Companion downloads                                          | Source/setup only; correctly unpublished                                        | Real installable builds and store/platform qualification                         |
| Security/performance                                         | Listed local checks executed                                                    | Resolve advisories; broader DAST/SAST, failure/load/cross-platform qualification |

## Security boundaries exercised

A real manually triggered research-worker tick imported 25 Cloudflare roles, persisted one completion notification and no applications, then was paused. This verifies research only, not applying or model preparation.

The existing real-Postgres API suite checks tenant isolation, exact saved-payload approval, edit invalidation, concurrent approval consumption, ambiguous-send lockout, encrypted credentials, revocation fencing, unsafe source settings, worker pause/stale leases and preparation limits. Gmail transport tests inspect state/PKCE and mock delivery. Native tests check fixed provider hosts, path-safe session IDs, secret redaction, tool denial and streaming bounds. New watcher regression closes the unvalidated patch boundary.

No real email was sent, no external application was submitted and no public job board was attacked. The only public data operation was normal read-only Greenhouse import. PostHog returned a normal 404 for the attempted board identifier; Cloudflare's current board succeeded. All mutation tests used disposable Postgres/temporary native directories. An initial browser attempt followed the preview’s configured port 4001 and returned an internal error; the test routing was then corrected to the disposable API on 4401. All verified persistence and subsequent mutations used that isolated API. No native host career book was opened by the tests.

## Release gates, in order

1. Build one native vertical slice: source → eligible role → grounded versioned packet → bounded authorized submission → independently confirmed receipt, with recovery and no duplicate sends.
2. Implement real watcher scheduling and source breadth, then test freshness, deduplication and unsupported-board behavior.
3. Qualify draft output and model budgets; reject runtime metadata and unsupported factual claims before a packet can progress.
4. Connect native Gmail with a test account and complete live consent/revoke/send checks. User requested local-only verification for this audit; [setup walkthrough](../CONNECTION_SETUP.md) is provided.
5. Build/qualify user-hosted worker and encrypted phone transport before offering companion downloads.
6. Resolve dependency advisories, qualify Windows/Linux/macOS installers and complete native UI/security/performance acceptance.

Landing UI finish review scored its documentation correction resolved (`ship` at that narrow scope). That verdict does not change this product-level **NOT_READY** decision.
