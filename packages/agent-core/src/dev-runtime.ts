/**
 * DevAgentRuntime — deterministic, no network, no model. Suitable for CI.
 * Produces a canned structured proposal and records tool requests through the
 * policy gateway so permission boundaries are still exercised.
 */

import type {
  AgentRunDescriptor,
  AgentRunInfo,
  AgentRuntime,
  AgentRuntimeEvent,
  RuntimeStepRecord,
} from './runtime';
import { redactionJson } from './redaction';

const GATED_TOOLS = ['submit_application', 'send_outreach'];

interface DevRun {
  info: AgentRunInfo;
  events: AgentRuntimeEvent[];
  stopped: boolean;
}

export class DevAgentRuntime implements AgentRuntime {
  readonly name = 'dev' as const;
  private runs = new Map<string, DevRun>();
  private counter = 0;

  /**
   * Deterministic proposal-run: walks every requested tool through the policy
   * gateway (always BLOCKED_BY_POLICY in dev — proposals only), then completes
   * with a canned structured proposal that names the actual limitation. No
   * network, no model, safe for CI.
   */
  async startRun(descriptor: AgentRunDescriptor): Promise<AgentRunInfo> {
    const runId = `dev_${++this.counter}_${Date.now().toString(36)}`;
    const info: AgentRunInfo = {
      runId,
      status: 'RUNNING',
      steps: [],
    };
    this.runs.set(runId, { info, events: [], stopped: false });

    for (const tool of descriptor.allowedTools) {
      await this.requestTool(runId, tool, { requested_for: descriptor.goal.slice(0, 120) });
    }
    const gatedRequested = descriptor.allowedTools.filter((t) => GATED_TOOLS.includes(t));
    const proposal = {
      proposal: `DEV-PROPOSAL: analyzed goal "${descriptor.goal.slice(0, 200)}" with ${
        descriptor.allowedTools.length
      } requested tool(s) — all blocked by policy in dev runtime (proposals only).`,
      reasoning: [
        'DevAgentRuntime is deterministic and does not call a model.',
        'Every requested tool was evaluated by the policy gateway and blocked (BLOCKED_BY_POLICY) — auditable in the run steps.',
        gatedRequested.length > 0
          ? 'Gated tool(s) requested: ' +
            gatedRequested.join(', ') +
            ' — human approval flow is required before any external action.'
          : 'No approval-gated tools were requested.',
        'Use AGENT_RUNTIME=opencode with a model provider for real analysis.',
      ],
      needs_approval: gatedRequested.length > 0,
      evidence: [
        `allowed_tools: [${descriptor.allowedTools.join(', ')}]`,
        `context_refs: [${(descriptor.contextRefs ?? []).join(', ')}]`,
      ],
    };
    info.status = 'SUCCEEDED';
    info.proposal = JSON.stringify(proposal, null, 2);
    info.usage = { input: 0, output: 0, cost: 0 };
    return info;
  }

  async streamEvents(runId: string, onEvent: (e: AgentRuntimeEvent) => void): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`unknown run ${runId}`);
    for (const e of run.events) onEvent(e);
  }

  async requestTool(
    runId: string,
    toolName: string,
    validatedArgs: Record<string, unknown>,
    opts?: { approvedTool?: boolean },
  ) {
    const run = this.runs.get(runId);
    if (!run) return { ok: false as const, reason: 'unknown_run' as const, detail: runId };
    if (opts?.approvedTool !== true) {
      // dev runtime refuses every tool call — proposals only, still auditable
      const step: RuntimeStepRecord = {
        tool: toolName,
        argumentsRedacted: redactionJson(validatedArgs),
        status: 'BLOCKED_BY_POLICY',
        at: new Date().toISOString(),
      };
      run.info.steps.push(step);
      run.events.push({ type: 'policy_blocked', data: { tool: toolName }, at: step.at });
      return {
        ok: false as const,
        reason: 'blocked_by_policy' as const,
        detail: 'dev runtime allows proposals only',
      };
    }
    const step: RuntimeStepRecord = {
      tool: toolName,
      argumentsRedacted: redactionJson(validatedArgs),
      status: 'SUCCEEDED',
      resultRef: 'dev://noop',
      at: new Date().toISOString(),
    };
    run.info.steps.push(step);
    run.events.push({ type: 'tool_result', data: { tool: toolName }, at: step.at });
    return { ok: true as const, result: { devEcho: validatedArgs }, step };
  }

  pause(runId: string, _reason: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run && !run.stopped) run.stopped = true;
    return Promise.resolve();
  }

  resume(runId: string, _approvalId: string): Promise<AgentRunInfo> {
    const run = this.runs.get(runId);
    if (!run) return Promise.reject(new Error(`unknown run ${runId}`));
    run.stopped = false;
    return Promise.resolve(run.info);
  }

  cancel(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      run.stopped = true;
      run.info.status = 'CANCELLED';
    }
    return Promise.resolve();
  }

  async getRun(runId: string): Promise<AgentRunInfo | null> {
    return this.runs.get(runId)?.info ?? null;
  }
}
