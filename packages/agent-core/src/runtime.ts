/**
 * AgentRuntime — the contract ARCHITECTURE.md locks for agent pluggability.
 * Implementations: OpenCodeAgentRuntime (real OpenCode v2 server, verified),
 * DevAgentRuntime (deterministic, CI-safe).
 *
 * Agent output is a PROPOSAL, not authority. All tool requests must pass the
 * policy gateway (policy.ts) before any Pursuit state changes.
 */

export interface AgentRunDescriptor {
  tenantId: string;
  actorId: string;
  goal: string;
  allowedTools: string[];
  budgetTokens?: number;
  contextRefs?: string[];
}

export interface AgentRuntimeEvent {
  type: 'session_created' | 'message' | 'tool_result' | 'policy_blocked' | 'run_finished' | 'error';
  sessionId?: string;
  messageId?: string;
  text?: string;
  data?: unknown;
  at: string;
}

export interface AgentRunInfo {
  runId: string;
  sessionId?: string;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  steps: RuntimeStepRecord[];
  usage?: { input: number; output: number; cost: number };
  proposal?: string;
}

export interface RuntimeStepRecord {
  tool: string;
  argumentsRedacted: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'BLOCKED_BY_POLICY';
  resultRef?: string;
  at: string;
}

export interface AgentRuntime {
  readonly name: 'opencode' | 'dev' | 'external';
  startRun(descriptor: AgentRunDescriptor): Promise<AgentRunInfo>;
  /** subscribe to an event stream; implementers may return a single awaitable summary */
  streamEvents(runId: string, onEvent: (e: AgentRuntimeEvent) => void): Promise<void>;
  /** tool gateway: policy engine decides whether the call is permitted */
  requestTool(
    runId: string,
    toolName: string,
    validatedArgs: Record<string, unknown>,
    opts?: { approvedTool?: boolean },
  ): Promise<
    | { ok: true; result: unknown; step: RuntimeStepRecord }
    | { ok: false; reason: 'unknown_run' | 'blocked_by_policy'; detail: string }
  >;
  pause(runId: string, reason: string): Promise<void>;
  resume(runId: string, approvalId: string): Promise<AgentRunInfo>;
  cancel(runId: string): Promise<void>;
  getRun(runId: string): Promise<AgentRunInfo | null>;
}
