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

The Pursuit agent denies tool and integration use. Requests have a 256-token output allowance and one agent step; these limits are not an account-level spending budget. This is process/configuration isolation, not an OS sandbox. Forced termination, OS-crash orphan recovery, signed release behavior and platform policy interactions still need qualification.

SQLite schema v4 retains up to 100 session references in the history view and the latest saved snapshots; OpenCode retains its own isolated runtime data. Each session view loads the latest 100 messages. Partial SSE text is bounded and volatile. Completed history is authoritative after reconnects; an event gap can lose partial text. Recovery never automatically resends a prompt. Normal shutdown does not run background autopilot.

## Verified scope

The local-store suite passes 10 tests. The default native suite passes 9 tests. Explicit installed-runtime tests verify authenticated startup, offline queue/restart recovery, child/socket cleanup, completed generation, live partial text and active interruption. Generation uses the actual installed OpenCode process and a controlled local OpenAI-compatible fixture: fake authorization reaches the endpoint, output is bounded, and no tools are exposed. No paid provider inference or model-quality evaluation has been performed.

Renderer interaction checks cover desktop and minimum-width session states using synthetic IPC. Those screenshots are test evidence, not real native captures or marketing assets. macOS Intel packaging is verified separately; Windows/Linux runtime and credential-store qualification remains outstanding. Typed career tools, application packets, submission automation, sidecar distribution and Connect remain unfinished.

References: [OpenCode API](https://opencode.ai/v2/docs/api), [agents](https://dev.opencode.ai/v2/docs/agents/), [permissions](https://dev.opencode.ai/v2/docs/permissions/), [instructions and project isolation](https://dev.opencode.ai/v2/docs/instructions/).

The conversational career shell now routes explicit requests into these same native sessions. See [career workspace behavior and tour boundaries](CAREER_WORKSPACE.md).
