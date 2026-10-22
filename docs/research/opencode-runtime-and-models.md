# OpenCode runtime and model support

Research date: **2026-10-22**. Primary documentation review plus source inspection; no paid inference or new live integration test performed. The local executable reports **OpenCode v2.1.2**. That is an observed candidate, not a release qualification.

## What “support OpenCode” means

Pursuit should offer **both** of these entry points:

1. **Use OpenCode configuration**: run a managed, isolated OpenCode runtime using the user's selected compatible providers/models.
2. **Connect OpenCode-hosted models**: expose the supported OpenCode hosted inference catalog as a provider option, with the user's own account/key.

OpenCode itself is an agent, not a model family. Its optional hosted services are separate from running the agent locally. The current v2 Console describes hosted inference; older documentation calls the curated gateway **Zen**. Keep recognizable Zen terminology in help where applicable, while taking endpoint/model metadata from the version actually integrated. [OpenCode introduction](https://opencode.ai/v2/docs/), [Zen documentation](https://docs.opencode.ai/docs/zen/), [Console](https://opencode.ai/v2/docs/console/).

## Verified upstream capabilities

| Layer                    | Finding                                                                                                                         | Implication for Pursuit                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Network client           | `@opencode/client` is the typed client generated from the HTTP API contract.                                                    | Evaluate this against the existing handwritten HTTP adapter. [Client](https://opencode.ai/v2/docs/build/client/)                                                                                |
| Embedded SDK             | Current `@opencode/sdk` embeds the server and routes calls in memory without an HTTP listener.                                  | Compare embedded packaging with a supervised sidecar; do not mix this API with similarly named older SDK guides. [SDK](https://opencode.ai/v2/docs/build/sdk/)                                  |
| Runtime API              | Current reference includes sessions, model selection, event subscriptions, interrupts, permissions, credentials and generation. | Prove real streaming, interruption and recovery against one pinned version. OpenCode permissions are not a substitute for Pursuit's execution authority. [API](https://opencode.ai/v2/docs/api) |
| Providers/local runtimes | Current provider guidance documents configured providers and discovery through local runtimes including Ollama.                 | Advertise only provider/model pairs that pass Pursuit's compatibility checks. [Providers](https://opencode.ai/v2/docs/providers/), [Models](https://opencode.ai/v2/docs/models)                 |
| Hosted inference         | Console exposes OpenAI-, Anthropic- and Gemini-compatible API families and a live model-list endpoint.                          | Dispatch by the selected model's actual API family rather than sending every model to chat completions. [Inference API](https://opencode.ai/v2/docs/console/api/inference/)                     |
| Go                       | Go is optional. Its guide requires coding-agent-like traffic, identifiable clients and a stable session header.                 | **Do not promise Go subscriptions for career research/writing** until the provider confirms this workload is permitted. Do not disguise traffic. [Go](https://opencode.ai/v2/docs/console/go/)  |

A provider login or subscription is not a universal API entitlement. Authentication, entitlement and model availability must be tested for the selected connection; an OpenCode-supported login alone does not establish permission for a separate product/workload.

## Current Pursuit gap

Inspected `packages/agent-core/src/opencode-runtime.ts`, `runtime.ts`, `apps/api/src/agent-runtime.factory.ts`, and `apps/api/src/model-gateway.ts`.

- An OpenCode v2 HTTP adapter exists. Historical audit documents a proposal round trip; that is narrower than a working career agent.
- `startRun` waits for a completed response. `streamEvents` replays cached messages afterward rather than showing live execution.
- `pause` and `cancel` are no-ops. Session/run mappings are held in memory.
- `requestTool` records an approved frame rather than executing a real source/browser/application tool.
- Runtime selection is process-wide environment configuration. The model string parser splits on `/` and loses nested model IDs such as gateway model paths.
- The current preparation gateway directly handles OpenAI, Anthropic, Google and Hermes through OpenRouter. It has no general OpenRouter, Ollama, Groq or OpenCode-hosted provider option.
- Therefore neither an existing logo nor an upstream supported-provider list establishes shipped Pursuit compatibility.

## Recommended integration design

Keep `AgentRuntime`, but separate `RuntimeConnection`, `ProviderConnection`, `ModelDescriptor`, `ToolCapability`, and `UsageBudget` contracts. Store provider ID and complete model ID separately. A model descriptor should include authentication state, source, API family, known tool/vision/structured-output support, context limits when published, and last compatibility-test result.

Use a Pursuit-owned runtime directory and supervised process or proven embedded boundary. Offer **selective import** of provider connections with explicit consent. Do not silently import arbitrary OpenCode agents, hooks, plugins, MCP servers, skills, project instructions or shell permissions. Existing provider credentials must not become access to a user's coding workspace.

The visible model chooser should group:

- Existing OpenCode provider connections.
- Direct hosted API providers.
- OpenCode hosted inference / Zen, qualified against its current API and account.
- Local Ollama models.
- Advanced compatible endpoints, explicitly configured and separately tested.

Hermes is a model family in the current app's OpenRouter integration; OpenRouter is the provider/gateway. Show both identities correctly. A text-generation test is insufficient to certify browser-tool orchestration.

## Qualification before a “supported” badge

1. Pin executable/package versions, licenses, checksums and platform artifacts.
2. Create one isolated runtime with authentication and no ambient shell/file privileges.
3. List actual connections/models; test complete model IDs and unavailable/expired accounts.
4. Stream a real harmless generation; persist provider/session/event references.
5. Interrupt during inference and during a tool request; show the actual resulting state.
6. Restart Core and reconnect to a saved session without replaying completed effects.
7. Exercise typed Pursuit tools against controlled fixtures; deny unknown tools and bypass attempts.
8. Test local Ollama capability detection and hosted API-family differences.
9. Run the matrix on macOS, Windows and Linux installers, not only the developer machine.
10. Record provider permissions/entitlements, costs and privacy disclosures without hardcoding a transient catalog.

OpenCode Go workload approval, exact runtime distribution strategy, and end-to-end compatibility remain qualification items. Basic OpenCode runtime and hosted-provider support are planned requirements; they are not implemented by this research document.
