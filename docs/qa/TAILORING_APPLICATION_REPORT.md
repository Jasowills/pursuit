# Tailoring and application verification — 2026-10-23

**Verdict: not ready for a full production application service.** The source-backed tailoring slice, saved PDFs and bounded application fixture work. Live Ashby qualification, complete native execution controls, broader form coverage, Drive OAuth, email attachments and production operations remain gates.

## Executed boundaries

| Check                           | Evidence and practical limit                                                                                                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tailoring core/import/PDF tests | Source ID/text tampering, protected context, relevant selection, three tones, ZIP/XML limits, Google export contract, PDF text round-trip and scanned-PDF refusal                            |
| Native SQLite                   | Saved PDF hash checked, bytes survive restart; existing task/identity/session/career-book regression tests pass                                                                              |
| API                             | Real Nest app, disposable PostgreSQL on 54339, private temporary file store; worker import, review, cached PDF creation, original retrieval, ownership and existing approval/autopilot tests |
| Local model                     | One synthetic Qwen 2.5 7B selection call: 183 prompt tokens, 24 output tokens, original text preserved                                                                                       |
| Harness UI                      | Built desktop frontend in Chrome, native IPC simulated; import → review → model-free packet → saved/exported PDF → reload. Rust persistence was tested separately                            |
| Application queue               | Exact authorization, changed form/PDF, missing answers, attempt cap, worker fence, pause, ambiguous timeout, restart recovery                                                                |
| Ashby browser fixture           | Every request intercepted; a real tailored PDF filled/uploaded with approved answers; exactly one synthetic application POST and a hosted confirmation                                       |
| Company/people research         | Explicit published Person/channel source retained, spoofed LinkedIn hostname excluded, no fabricated contact when none published                                                             |
| Build                           | Desktop/Vite, web/Next, native Rust check and workspace typechecks executed                                                                                                                  |

The fictional [generated PDF](../../output/pdf/tailored-resume-example.pdf) was rendered with Poppler and visually inspected. It has one column, real selectable text, readable margins and no clipping or overlap. This does not establish ATS compatibility with every vendor or endorsement by an employer.

## Findings fixed during this pass

- Prompt-only “do not invent” was not a factual control. Export now checks every resume block against reviewed source offsets; old web workflow candidate material is replaced with source-backed text.
- Initial PDF extraction called a proxy method not present in the installed parser; corrected to destroy its loading task. Real PDF round-trip tests catch this boundary.
- Desktop monorepo resolved two React versions, producing a blank bundle. Explicit Vite React deduplication fixed it.
- Extracted textarea content changed a wrapped label's matching behavior. Stable accessible labels and role-based browser checks fixed the workflow.
- Worker restart recovery was rolled back on a non-runnable state. Recovery is now committed and a persisted interrupted-submission test proves it cannot retry.
- Default relevance selection could leave an older role heading with no accomplishment. At least one original experience bullet is retained for each detected experience group.
- A stale existing Vite development server returned outdated dependency responses during an early UI attempt. The final test used a separate port and the built bundle; the existing server was left untouched.

Initial failing checks are recorded as development failures, not passing evidence. Final passing counts and machine-readable scope are in [the verification record](evidence/tailoring-verification.json).

## Adversarial follow-up

The [adversary run](adversary-results/report.json) reproduced a high-severity expiry gap: an approval valid when preparation started could expire before submission without stopping the submit call. ADV-0001 adds a fake-clock regression and an atomic approval-expiry check at the final state transition. Before: one forbidden submit call. After: zero calls and NEEDS_USER; all application tests pass. Live-provider and full-product release gates remain unresolved.

## Reproduction

```sh
pnpm --filter @pursuit/tailoring test
pnpm --filter @pursuit/application test
pnpm --filter @pursuit/application test:browser
pnpm --filter @pursuit/discovery test
cargo test --manifest-path packages/local-store/Cargo.toml
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
pnpm typecheck
pnpm --filter @pursuit/desktop build
pnpm --filter @pursuit/web build
```

API tests require a disposable migrated database and `RESUME_STORAGE_DIR`/`APPLICATION_STORAGE_DIR` directed to test storage. Never run them against developer or production data. Browser fixtures require compatible Chromium; CI now installs the fixture browser. The Python harness check is in `scripts/qa/tailoring-browser.py` and uses the webapp-testing server helper with a dedicated preview port. It cannot substitute for an OS-webview/native-IPC end-to-end test.

## Untested and unresolved

No real application or message was sent. The Ashby hosted adapter has not encountered a real employer's complete form, third-party asset requirements, custom widgets, CAPTCHA or final receipt path. Unsupported cases stop; they are not marked successful. Production-scale throughput, horizontal coordination, resource exhaustion, source-provider quotas and an actual VPS worker were not qualified.

Google Docs direct export is mocked and requires a separate Drive grant; native import currently uses a downloaded DOCX. Paid model providers were not live-tested. Hermes Agent runtime integration is not implemented. Source-selected wording is grounded, but semantic prose rewriting and automated grammar assessment are not delivered by this version.

The new file store has protected paths and ownership checks, but full retention/deletion controls and at-rest encryption are incomplete. The production dependency audit reports three high and one moderate advisory: deepmerge-ts through Prisma, and uuid/node-forge/braces through mobile dependencies. None of the reported paths enters through the new tailoring/application packages. These remain release risks; unrelated formatting debt is also tracked separately. Small-model compatibility is supported by one measured Qwen run, not a claim that every model will give equally useful selections.

Research references: [documents/ATS/local models](../research/tailoring-document-contracts.md), [application execution and contacts](../research/application-execution-contracts.md). Implementation/setup: [engine guide](../TAILORING_AND_APPLICATION_ENGINE.md).
