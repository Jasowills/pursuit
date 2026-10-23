# Pursuit release review, 2026-10-23

**Verdict: NOT_READY for a public production release. Estimated readiness: 5/10.** This is an engineering judgment requested by the user, not a test pass rate, security certification, reliability probability or hiring-success score. The product has useful developer-alpha workflows; it still needs live and operational qualification.

## What changed

- Removed Companion advertising from the landing section, navigation, footer, download area and walkthrough link. Dormant source remains for a future version.
- Replaced the closing form and generic document notification with a concise, interactive folio. Three keyboard-operable starting tasks lead to corresponding sample-tour requests; download remains visible. Desktop/mobile checks and reduced-motion checks pass. The independent finish reviewer returned **ship** after one heading-size correction. This is a design verdict, not product release approval.
- Added local crash/error events, a React recovery boundary, a failed-startup editing guard, diagnostic preview, optional event inclusion, explicit copying/deletion and a public GitHub issue form. No report uploads automatically. Error payloads, credentials and career text are excluded from the logger.
- Added shared writing rules, distinct cover-letter/message styles, no-em-dash checks, a generic-phrase/custom-avoid policy and validation before packet/web Gmail approval. Original resume evidence remains unchanged. No message is rewritten during sending.
- Replaced bare executable CI uploads with native installers, architecture verification, resource checks, isolated-worker smoke tests, manifests and SHA256SUMS. Fixed pnpm11 build permissions, version pinning, a Windows-incompatible copy command and the Mac app-retention verifier issue.

## Executed evidence

| Suite                                                           | Passing cases |
| --------------------------------------------------------------- | ------------: |
| Discovery                                                       |            68 |
| Application queue/planning/recovery                             |            13 |
| Native coordinator                                              |            10 |
| Tailoring/imports/PDF/writing                                   |            23 |
| Retained API, isolated PostgreSQL and mocked external providers |            59 |
| Native Rust, diagnostics and process boundaries                 |            16 |
| Native local-store integrity                                    |            12 |
| Intercepted Chromium application/coordinator adapters           |             2 |
| **Automated cases**                                             |       **203** |

Separately, **12 built landing/recovery browser scenarios passed**, plus the built harness source-to-confirmation journey. The latter uses a real local coordinator and SQLite, simulated Tauri IPC, source fixtures and an application adapter fixture. Actual Rust process transport and Chromium form execution are tested separately. This is not a real employer submission or native OS-webview qualification. Six native cases are opt-in in the default suite; ignored cases are not counted as passing.

Both frontend builds and all 20 workspace typecheck/build tasks passed. Main CI passed its builds, typechecks and tests but failed at formatting in15 files. The listed files received formatter-only corrections, followed by a full formatting check; the final CI run remains the authority for the pushed snapshot. Large lazy-loaded PDF chunks remain build warnings. One controlled approval mutation in an external temporary copy was caught by the fabricated-hash regression. That experiment did not alter the working source.

The [synthetic benchmark](discovery-benchmark.json) imports 5,000 observations and returns 300 ranked results. On this host, import took 1,224 ms, ranking 1,505 ms and process RSS was 395 MiB. These are a single-process, in-memory, model-free smoke measurement, not a production concurrency, latency SLO or match-quality evaluation.

## Findings and important limits

**Startup recovery:** code review found the failed career-book read could lead to an empty editable workspace. The guard now blocks editing. The fault-injected built browser verifies no save command is sent, with a recovery/issue-report path available. See ADV-0001 and [browser evidence](browser.json).

**Real local-model evaluation remains open:** the actual Qwen 2.5:7b/OpenCode route failed twice at the 30-second first-response-header limit. A bounded local-only 120-second header allowance enabled one completion in 112.63 seconds, resisting the injected Stanford/doctor instructions and blocked phrases. Reviewing that answer still found unsupported expertise inflation. The prompt and test were tightened; that stricter follow-up timed out at 180 seconds. The latest case is a failure, not a qualified model-quality pass. Deterministic material generation is source-backed; free-form model conversations remain drafts. See [model evidence](model-evaluation.json).

**Dependency advisories remain:** the workspace production audit reports three high and one moderate advisory in the retained Prisma/mobile dependency tree: deepmerge-ts, node-forge, braces and uuid. The report records versions, upstream links and dependency paths. This does not prove exploitability in the native desktop, and no major transitive override was forced without compatibility testing. Resolve or substantiate reachability before releasing the affected deployment. See [audit summary](dependency-audit-summary.json).

**Packaging:** Windows x64 and Linux x64 installers passed real native-runner builds, architecture/resource-staging checks and isolated worker execution. The replacement Apple Silicon DMG/app also passes verification. The Intel Mac installer also passed its build, verification and upload steps; only job cache cleanup remained when checked. The original Mac failure was a verifier expecting an intermediate app that Tauri had removed after producing a DMG; retaining both resolves that on Apple Silicon. [Native build run](https://github.com/Jasowills/pursuit/actions/runs/39960253355). These artifacts are unsigned test installers, not signed/notarized public releases or proof of clean-machine installation. Node and browser prerequisites are still separately configured.

**Security scope:** executed checks cover private/mixed DNS, redirect/metadata blocking, credential forwarding, bounded and stalled source responses, exact payload approval, stale/tampered PDFs/forms, duplicate/concurrent execution, crash recovery, tenant isolation, literal string rendering and instructed-fact boundaries. These are targeted regression and adversarial checks. They do not establish resistance to every prompt injection or constitute an independent penetration test. Third-party sites were not attacked.

## Release gates, in priority order

1. Qualify real local-model latency and semantic quality across supported hardware/models, and verify chosen cloud-provider routes. Keep source-backed packet generation as the authoritative material path.
2. Resolve/triage the dependency advisories; run an independent security review of execution, data retention and source isolation.
3. Rebuild the final source snapshot on all four targets, complete signing/notarization, clean-machine install/reopen/uninstall and actual OS-webview/credential-store testing. Make runtime/browser setup usable for people who do not use developer tools.
4. With explicit chosen test accounts and roles, qualify real Ashby forms and Gmail/calendar behavior. Current email/calendar tests mock providers. Native and retained-web functionality must remain clearly separated.
5. Finish and stress-test unattended execution, budgets, task supervision, crash reconciliation and safe updates. Current queue policy is not a complete always-on autopilot service.
6. Measure discovery recall, source freshness, geographic eligibility and matching accuracy with reviewed real cases. Test backups, restoration, deletion and long-duration resource use.

No real application or email was sent, no paid inference ran, and the disposable database was separate from the user’s workspace. Reproduce commands and requirement classification are in [the plan](plan.md). The machine-readable outcome is [report.json](report.json), with a standalone [HTML report](report.html).
