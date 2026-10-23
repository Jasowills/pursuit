# Native workflow verification — 2026-10-23

**Scope:** connect discovery and exact application review to the native harness. **Full product release verdict: NOT_READY.** Native integration is implemented; real Ashby forms, OS-webview execution, Windows/Linux distribution, unattended workers and operational hardening remain gates.

## Interfaces checked

| Interface                  | Evidence                                                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local coordinator dispatch | Real temporary SQLite, source fixtures, preferences and result persistence; unknown eligibility stays visible; failed-source diagnostics remain visible                          |
| Packet registration        | Reviewed source/role integrity and PDF hash; a different PDF cannot silently replace an existing packet association                                                              |
| Application state machine  | Required/optional answer checks, exact approval, default-off execution, changed posting and cross-role form refusal, confirmed deduplication                                     |
| Pause during preparation   | A second coordinator pauses while the first is filling; submit is never called and the daily limit remains 7                                                                     |
| Rust process transport     | Executes the packaged worker, reads a snapshot, adds a source and reads it from a second process; rejects an unsupported action and non-absolute executables                     |
| Browser adapter            | Actual Chromium form, PDF upload and one synthetic accepted POST/confirmation, with every request intercepted                                                                    |
| Built harness              | Actual frontend and coordinator/SQLite through simulated Tauri IPC; search → save → review import → prepare → PDF → inspect → answer review → approval → submit → reload/history |
| Existing modules           | Discovery, tailoring, application queue and native local-store regression tests                                                                                                  |

The fixture transport and application adapter used by the UI test exist only under `scripts/qa/`. The production worker does not import them. No real employer or mailbox was contacted by the application tests. The source fixture does not establish current provider availability; earlier live discovery contract evidence remains separate.

The built harness test checks that approving alone performs no submit, a separate confirmation is required to enable submit, and reloading the saved confirmation does not submit again. Console and page errors are asserted empty. Rust process tests use the real packaged worker; they do not exercise the macOS IPC/webview implementation.

The scoped runs pass **132 test cases**, including 13 native desktop tests; six existing installed-runtime/model integration tests remain opt-in and were not counted as passing. All 20 tasks in the workspace typecheck run and both frontend builds pass. The retained API E2E suite was not rerun in this pass because no API source changed.

The [isolated packaging check](evidence/native-engine-packaging.json) copies the worker/resources outside the repository, strips inherited configuration and runs six separate processes. It proves module resolution without workspace node_modules and SQLite persistence. Local cold calls measured a median of 4,849.5 ms and maximum of 5,624 ms on this macOS host; this is not a production load or browser-memory benchmark. Repeated cold process startup remains an optimization target, especially on slower or busy hosts.

## Findings fixed

- Duplicate sibling React keys caused a stale application panel to remain after moving between preparation and application screens. Unique component keys and browser navigation checks fix this.
- The asynchronous execution toggle appeared to revert before persistence completed. It now updates immediately, disables dependent actions while saving and rolls back on failure.
- A single serialized command lane would delay pause until after a running form finished. An independent native pause command now fences preparation before the submit transition. It cannot recall an already-sent request.
- Closing the app could leave an owned Node worker alive. The host now tracks children, terminates them during exit and refuses new work after shutdown begins. A real temporary Node worker regression proves termination. This cannot recall a request already sent.
- Native PDF retrieval now checks the bytes against the saved hash; a corruption-injection regression rejects altered bytes before export or upload.
- A packet could previously be re-registered with a different PDF rendition while retaining its old stored upload. Different bytes now require a new packet rather than silently using an old file.
- Invalid supplied optional fields could reach browser validation and produce an ambiguous timeout. Validation now rejects them before submission, while genuinely unanswered optional fields remain allowed.

The dependency-linking attempts first failed against the incomplete offline cache and sandbox store settings. Dependency installation completed with the existing locked package versions; the lockfile adds workspace links only. A Prisma cache permission failure was resolved by regenerating the client with approved cache access. These are development failures, not passing test evidence.

- Direct application lookup now works independently of the recent-history window. Ashby form paths use the canonical posting identity so adding `/application` does not create a second candidate/posting record.

- Refreshing a changed saved posting preserves the original resume and clears its stale active packet. The harness fixture changes employer requirements, verifies execution stops, then exercises refresh and re-tailoring before approval.

## Reproduce

```sh
pnpm --filter @pursuit/desktop engine:bundle
pnpm --filter @pursuit/career-engine test
pnpm --filter @pursuit/career-engine test:browser
pnpm --filter @pursuit/application test
pnpm --filter @pursuit/application test:browser
pnpm --filter @pursuit/discovery test
pnpm --filter @pursuit/tailoring test
cargo test --manifest-path packages/local-store/Cargo.toml
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
pnpm typecheck
pnpm --filter @pursuit/desktop build
pnpm --filter @pursuit/web build
```

Browser fixtures need installed Chromium. `scripts/qa/native-engine-browser.py` needs Python Playwright and the built desktop frontend served on a separate local port (default 1428). Use the webapp-testing `with_server.py` helper; leave existing user development servers running. The suite does not require the retained API database.

Executed counts and exact boundaries are in [the verification record](evidence/native-engine-verification.json), with [harness evidence](evidence/native-engine-browser.json). Current setup and limitations: [native workflow guide](../NATIVE_JOB_WORKFLOW.md).
