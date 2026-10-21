/**
 * Reproducible OpenCode integration smoke test (run: `pnpm --filter @pursuit/agent-core smoke`).
 * Requires a running `opencode serve` server; env:
 *   OPENCODE_BASE_URL  default http://127.0.0.1:7334
 *   OPENCODE_PASSWORD  the per-boot password line printed by `opencode serve`
 *   OPENCODE_AGENT     (optional) agent name to switch to, e.g. pursuit-copilot
 *   OPENCODE_MODEL     (optional) "provider/model" to force model selection
 *
 * To boot a disposable server:
 *   opencode serve --port 7334   # then copy the "server password ..." value
 *
 * Exit codes:
 *   0   PASSED — goal round-trip reached the proposal text
 *   1   FAILED — adapter contract failure
 *   2   PROVIDER_UNAVAILABLE — provider.auth / provider.quota (external dependency)
 */
import { OpenCodeAgentRuntime } from './opencode-runtime';

interface Env {
  OPENCODE_BASE_URL?: string;
  OPENCODE_PASSWORD?: string;
  OPENCODE_AGENT?: string;
  OPENCODE_MODEL?: string;
}

function parseModelRef(ref: string | undefined): { providerID: string; id: string } | null {
  if (!ref) return null;
  const [providerID, id] = ref.split('/');
  if (!providerID || !id) return null;
  return { providerID, id };
}

async function main(): Promise<void> {
  const env = process.env as Env;
  const baseUrl = env.OPENCODE_BASE_URL ?? 'http://127.0.0.1:7334';
  console.log(`[smoke] contacting OpenCode at ${baseUrl}`);
  const rt = new OpenCodeAgentRuntime({
    baseUrl,
    password: env.OPENCODE_PASSWORD ?? null,
    agentName: env.OPENCODE_AGENT ?? null,
    model: parseModelRef(env.OPENCODE_MODEL),
    timeoutMs: 120_000,
  });
  const run = await rt.startRun({
    tenantId: 'smoke',
    actorId: 'smoke',
    goal: 'Reply with exactly one word: PONG. Do not use any tools.',
    allowedTools: [],
  });
  console.log(`[smoke] runId=${run.runId} session=${run.sessionId}`);
  console.log(`[smoke] proposal: ${JSON.stringify(run.proposal)}`);
  console.log(`[smoke] usage: ${JSON.stringify(run.usage)}`);
  const words = (run.proposal ?? '').toUpperCase();
  if (words.includes('PONG')) {
    console.log('[smoke] PASSED');
    return;
  }
  console.error('[smoke] FAILED: expected an assistant reply containing PONG');
  process.exit(1);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  if (/provider\.(auth|quota)/i.test(msg)) {
    console.error('[smoke] PROVIDER_UNAVAILABLE (not an adapter failure):', msg);
    process.exit(2);
  }
  console.error('[smoke] FAILED:', msg);
  process.exit(1);
});
