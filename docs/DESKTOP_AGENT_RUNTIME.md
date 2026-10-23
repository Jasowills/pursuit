# Desktop Agent runtime

The Agent workspace manages an installed OpenCode **2.1.2** process. The CLI must be on the desktop app's PATH; it is not bundled yet. A GUI launch can have a different PATH from your terminal.

## Use

1. Save your provider key in Models, or start a local Ollama server. Choose a connection and an available model in Agent. OpenCode Console requires the explicit API family for that model.
2. Start the private runtime, then create a session. A session stays bound to that provider and model.
3. Send a request explicitly. Connected requests can incur provider charges. The optional identity checkbox shares only confirmed canonical facts and resets when changing sessions. Raw imported sources and rejected suggestions are excluded.
4. Watch streamed draft text, interrupt an active request, or stop the runtime. Offline sessions only queue requests: they do not generate or silently switch to a paid connection.

Removing or replacing a saved key prevents further requests through the existing runtime; restart with the desired connection. A request already delivered to a provider cannot be recalled. Existing queued requests block implicit execution of a backlog. Generated text remains a draft, not a validated application packet.

## Isolation and persistence

The native supervisor owns an authenticated loopback server, checks its PID and exact version, and kills/waits for it on normal Stop or Quit. It clears inherited credentials, uses separate XDG directories, disables project configuration/instruction discovery, and supplies only the selected key through a child environment variable. Generated configuration contains no key. Global configuration lives in the isolated directory. Existing ancestor OpenCode project configuration is rejected.

The Pursuit agent denies tool and integration use. Requests have a 2,048-token output allowance and two agent steps; these limits are not an account-level spending budget. This is process/configuration isolation, not an OS sandbox. Forced termination, OS-crash orphan recovery, signed release behavior and platform policy interactions still need qualification.

SQLite schema v4 retains up to 100 session references in the history view and the latest saved snapshots; OpenCode retains its own isolated runtime data. Each session view loads the latest 100 messages. Partial SSE text is bounded and volatile. Completed history is authoritative after reconnects; an event gap can lose partial text. Recovery never automatically resends a prompt. Normal shutdown does not run background autopilot.

## Verified scope

The [current release review](qa/adversary-2026-10-23/report.md) records 12 local-store tests and 16 default native tests. Explicit installed-runtime tests verify authenticated startup, offline queue/restart recovery, child/socket cleanup, completed generation, live partial text and active interruption. The controlled local OpenAI-compatible fixture verifies fake authorization, output bounds, writing policy delivery and absent tools. Real local-model quality evaluations are recorded below; they have not passed qualification. No paid provider inference has been performed.

Renderer interaction checks cover desktop and minimum-width session states using synthetic IPC. Those screenshots are test evidence, not real native captures or marketing assets. All four native installer targets have build evidence; clean-machine runtime and credential-store qualification remains outstanding. Career tools, application packets and Ashby execution have fixture coverage, with live qualification still required. Companion is deferred to V2. See the release review for each feature's tested boundary.

References: [OpenCode API](https://opencode.ai/v2/docs/api), [agents](https://dev.opencode.ai/v2/docs/agents/), [permissions](https://dev.opencode.ai/v2/docs/permissions/), [instructions and project isolation](https://dev.opencode.ai/v2/docs/instructions/).

The conversational career shell now routes explicit requests into these same native sessions. See [career workspace behavior and tour boundaries](CAREER_WORKSPACE.md).

Resume evidence selection is a separate bounded task: when the desktop's active managed connection is local Ollama, the resume studio calls a native, schema-constrained local inference route instead of opening a freeform session. It returns existing evidence IDs only, with an 8,192-token context, 512-token output cap and one in-flight selection. The original resume text remains authoritative. Other providers retain the session path. See [implementation and actual model qualification](qa/adversary-2026-10-23/structured-selection.md).

## Local inference budgets, 2026-10-23

Ollama uses bounded 180-second total, 120-second first-header and 45-second inter-chunk budgets. Cloud provider budgets remain 90/30/15 seconds. The assistant UI waits up to 180 polling iterations before directing users to inspect the unresolved session rather than retrying. These larger local bounds accommodate CPU model loading; they do not guarantee a response.

A real Qwen 2.5:7b/OpenCode check reproduced the prior 30-second header timeout. One run completed in 112.63 seconds after the adjustment but overstated a supplied skill as expertise. A tightened prompt prohibits unsupported expertise-level claims; the stricter follow-up timed out at 180 seconds. A subsequent check completed in 74.39 seconds but again failed the unsupported-expertise check. An installed-runtime fixture now checks that the writing policy actually reaches the provider as system content; that transport check passes. The model-quality failure remains open. The observed host has 16 GiB RAM; Ollama reported CPU inference and a 32,768-token context. Those observations do not establish the cause of latency. No paid inference or external action occurred. See the [initial evaluation evidence](qa/adversary-2026-10-23/model-evaluation.json) and [hardening follow-up](qa/adversary-2026-10-23/hardening-followup.md).
