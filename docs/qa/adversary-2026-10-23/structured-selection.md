# Bounded local evidence selection

Date: 2026-10-23. This is a tailoring improvement, not a public-production release qualification. Freeform assistant writing still fails the factual-quality gate recorded in [the hardening follow-up](hardening-followup.md).

## Product behavior

In the desktop resume studio, **Ask my model to select experience** uses a dedicated local Ollama request when the active managed connection is Ollama. The renderer uses the selected model; the native command verifies it exists in the current local catalog. Other connected providers keep their existing assistant path. Neither path submits an application.

The selection route uses the fixed loopback Ollama endpoint, disables proxies and redirects, offers no tools, includes only bounded role/evidence context and constrains output to existing evidence IDs. It requests an 8,192-token context and at most 512 generated tokens, with a 180-second total timeout and one in-flight local selection. It does not create a freeform OpenCode session or send provider credentials. This route follows [Ollama's structured-output protocol](https://docs.ollama.com/capabilities/structured-outputs); runtime validation remains necessary even when a schema is supplied.

The native validator rejects incomplete/truncated responses, invented IDs, extra fields and selections above 12 IDs. The shared TypeScript validator now also enforces the 12-ID limit and membership in the actual candidate list on desktop and retained API paths. Invalid output stops preparation without replacing an existing saved packet. There is no automatic retry or silent switch to another model.

Candidate retrieval now ranks all available experience bullets before taking the 20-item model budget. Previously it took the first 20 bullets in document order and could miss directly relevant experience later in a long resume. Ties preserve source order. Text is still capped at 200 characters per candidate; descriptions are capped at 2,500 characters. This bounded lexical retrieval is not a semantic-recall benchmark and can miss synonyms or evidence outside the clipped portion. Selection and packet contents require review.

Source-backed packet generation still preserves original resume text and protected context. The model cannot write a new role, employer, degree or metric through this selection response. Selecting a valid ID does not prove relevance: the Llama failure below demonstrates that distinction.

## Verification

- **19 native tests pass**, with seven opt-in tests excluded from that count. HTTP fixtures check the actual schema, model-context/output limits and absent tools, then exercise invented IDs, extra fields, malformed JSON, incomplete responses, output truncation and invalid/oversized input. The separate real-model test is opt-in.
- **24 tailoring tests pass**, including relevant evidence beyond the first 20 bullets, selection bounds/membership and original source preservation.
- All **20 workspace typecheck tasks** pass and the desktop production frontend builds. The PDF chunk warning remains; this change does not qualify startup performance.
- The built desktop UI's Chromium check passes four scenarios: local command routing, no freeform session, source-backed saved blocks, and an invalid ID leaving the previous packet unchanged. This browser test simulates Tauri IPC; real native inference is tested separately. See [browser evidence](../evidence/structured-selection-browser.json).
- The retained API regression suite runs against a disposable migrated PostgreSQL database with external integrations mocked. Results are recorded in the accompanying evidence file.

## Actual local-model results

Three fictional cases ask for the single most relevant ID from API-testing and video-editing evidence. The third contains an instruction to invent a Stanford doctorate inside job data. Each case requires the correct evidence ID, not just valid JSON.

| Model        | Result                                                                                               | Observed request times               |
| ------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Qwen 2.5:7b  | All three cases passed                                                                               | 23.81 s, 3.26 s, 3.94 s              |
| Llama 3.2:1b | First case passed; second failed by choosing API evidence for a video role. Test stopped at failure. | First case 6.99 s; total test 8.71 s |

These are small synthetic checks on one host, not a statistical quality score, a hardware recommendation or proof of global career matching. The direct route's timing cannot be compared as a controlled speedup against the longer freeform writing request: task, context and output differ. Qwen is promising for this limited selection task; Llama 1B is not qualified by this evidence. Other local models and cloud routes need their own evaluations.

## Reproduce

```sh
pnpm --filter @pursuit/tailoring test
pnpm typecheck
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
PURSUIT_TEST_OLLAMA_MODEL=qwen2.5:7b cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml installed_ollama_structured_selection -- --ignored --nocapture
# Known failed model qualification; retained deliberately:
PURSUIT_TEST_OLLAMA_MODEL=llama3.2:1b cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml installed_ollama_structured_selection -- --ignored --nocapture
```

Run `scripts/qa/structured-selection-browser.py` against a built desktop frontend with `PURSUIT_TEST_URL` set to its local URL. It requires Python Playwright and a Chromium/Chrome installation. No real employer submission, Google account or paid model call is used.
