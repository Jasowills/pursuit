# Production hardening follow-up

Date: 2026-10-23. Public-production verdict remains **NOT_READY**. This pass closes two dependency findings and strengthens the runtime boundary test. It does not qualify autonomous execution, clean-machine installation or live integrations.

## Dependency changes and verification

The starting fresh production-workspace audit reported two high and one moderate advisory. The earlier braces advisory was [withdrawn by the advisory database](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) on October 23. Its disappearance is not a Pursuit fix.

- Scoped `@prisma/config>deepmerge-ts` to 8.0.2 for the [recursive merge advisory](https://github.com/advisories/GHSA-ggr8-5vv4-36mx). Prisma 6.19.3 uses `deepmerge`, not the changed `deepmergeInto` alias behavior. Tests exercise real Prisma config loading and path resolution, ordinary object merging, and self-referential graphs. Client generation, committed migrations on a disposable database, and all 59 API tests pass.
- Scoped `xcode>uuid` to 11.1.1 for the [UUID buffer-bound advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq). Xcode uses the CommonJS `v4()` API without output buffers. Tests exercise its actual consumer by generating 1,000 unique PBX IDs, and check that the patched UUID dependency rejects the formerly vulnerable v5 short-buffer call. Mobile web export and all 20 workspace typecheck tasks pass. This is not an iOS native-build qualification.
- The two consumer tests run in main CI. Overrides are confined to the affected parents; Prisma and Expo major versions remain unchanged.

The final `pnpm audit --prod --json` reports **one high, zero moderate, zero critical**. The remaining [node-forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv) enters via Expo CLI and Expo code-signing certificates. Installed signing code calls certificate and signature verification, so it cannot be dismissed merely as a development dependency. Registry metadata lists 1.4.0 as latest; the registry audit suggests a future 1.4.1 patch while the upstream advisory currently lists no patch. No nonexistent release or unreviewed crypto patch was installed. No suppression or audit exception was added.

The deferred mobile toolchain is not bundled into the native career worker. That boundary reduces the desktop exposure but does not resolve the workspace advisory. Requalify Expo signing workflows when an upstream patch is available. The audit counts do not cover Rust dependencies, unknown vulnerabilities or exploitability.

## Local model evaluation

The actual installed OpenCode runtime and local `qwen2.5:7b` ran the existing fictional career-facts prompt. The run completed in **74.39 seconds**, but failed because its output added unsupported `expert` wording. The stronger system prompt alone has not solved factual writing quality.

The installed-runtime synthetic inference test now asserts that no tools are exposed, output-token bounds reach the provider, and the no-em-dash, factual-claims and untrusted-writing-sample policies appear in provider **system** messages. That check passes, including completion and interruption. This rules out loss of those policy strings in that tested route; it does not prove a model follows them or that every provider route behaves identically.

The observed host had 16 GiB RAM and 12 logical CPUs. Ollama reported zero VRAM and a 32,768-token context for the loaded Qwen model. This is context for further latency diagnosis, not proof that context size caused the delay. No provider timeout was increased and no failing quality assertion was weakened.

Freeform assistant output remains unqualified. The source-backed tailoring engine and explicit approval checks remain authoritative for application materials. The next engineering step is a bounded, structured local-model evaluation for evidence selection and writing, with output validation and measured context/output budgets. Successful transport alone must not be treated as a good application draft.

## Reproduce

```sh
node --test scripts/qa/dependency-compatibility.mjs
pnpm --filter @pursuit/database build
pnpm typecheck
pnpm --filter @pursuit/mobile export:web
pnpm audit --prod --json
# Disposable PostgreSQL only; never substitute a user's database.
DATABASE_URL='<disposable-test-database>' pnpm db:migrate
DATABASE_URL='<disposable-test-database>' AGENT_RUNTIME=dev ENABLE_DEV_LOGIN=true pnpm --filter @pursuit/api test
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml installed_runtime_generation_and_interrupt -- --ignored --nocapture
# Known quality failure on the observed host, retained as a release gate:
PURSUIT_TEST_OLLAMA_MODEL=qwen2.5:7b cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml installed_ollama_career_draft -- --ignored --nocapture
```

No real application/email was sent and no paid inference ran. The disposable database was stopped and removed after the tests. The existing user-modified landing screenshot was preserved.
