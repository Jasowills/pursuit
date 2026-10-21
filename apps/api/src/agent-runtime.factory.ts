/**
 * Agent runtime factory (DEC-07): DevAgentRuntime is the DEFAULT; the
 * verified OpenCode runtime is opt-in via AGENT_RUNTIME=opencode.
 * The factory never throws on missing OpenCode env — dev always works.
 */
import { DevAgentRuntime, OpenCodeAgentRuntime } from '@pursuit/agent-core';
import type { AgentRuntime } from '@pursuit/agent-core';

export function createRuntimeFromEnv(): AgentRuntime {
  const choice = (process.env['AGENT_RUNTIME'] ?? 'dev').toLowerCase();
  if (choice === 'opencode') {
    const baseUrl = process.env['OPENCODE_BASE_URL'] ?? 'http://127.0.0.1:7334';
    const password = process.env['OPENCODE_PASSWORD'] ?? null;
    const modelRef = process.env['OPENCODE_MODEL'];
    let model: { providerID: string; id: string } | null = null;
    if (modelRef) {
      const [providerID, id] = modelRef.split('/');
      model = providerID && id ? { providerID, id } : null;
    }
    return new OpenCodeAgentRuntime({
      baseUrl,
      password,
      agentName: process.env['OPENCODE_AGENT'] ?? 'pursuit-copilot',
      model,
    });
  }
  return new DevAgentRuntime();
}
