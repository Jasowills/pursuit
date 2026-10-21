/**
 * OpenCodeAgentRuntime — adapter over the OpenCode v2 HTTP server ABI.
 *
 * ABI verified live against `opencode serve` (docs/TECHNICAL_AUDIT.md):
 *   POST /api/session                       -> create session
 *   POST /api/session/{id}/agent {agent}    -> switch to a tool-disabled Pursuit agent
 *   POST /api/session/{id}/model {model}    -> explicit provider/model selection
 *   POST /api/session/{id}/prompt {text}    -> deliver prompt (returns user msg)
 *   GET  /api/session/{id}/message          -> transcript (poll until assistant stop)
 *   GET  /api/event                         -> SSE
 *
 * Security posture:
 * - Sessions run against a dedicated server directory containing
 *   `.opencode/agent/pursuit-copilot.md` with ALL tools disabled (proposal-only).
 * - All external content is neutralized via wrapUntrusted/neutralizeForPrompt.
 * - Agent output is a proposal only; the tool gateway enforces permissions.
 *
 * NOTE: model provider availability is a runtime concern, not the adapter's.
 * `provider.auth` (OpenCode free-tier gating) and `provider.quota` errors are
 * surfaced verbatim so callers never mistake them for integration failures.
 */

import {
  buildAgentSystemPrompt,
  buildAgentUserPrompt,
  extractLastJsonObject,
  parseJsonSafe,
} from '@pursuit/shared';
import type {
  AgentRunDescriptor,
  AgentRunInfo,
  AgentRuntime,
  AgentRuntimeEvent,
  RuntimeStepRecord,
} from './runtime';
import { redactionJson } from './redaction';

export interface OpenCodeModelRef {
  providerID: string;
  id: string;
}

export interface OpenCodeRuntimeConfig {
  baseUrl: string; // e.g. http://127.0.0.1:7334
  password: string | null; // per-boot password printed by `opencode serve`
  agentName?: string | null; // pursuit-copilot (tool-disabled agent)
  model?: OpenCodeModelRef | null; // explicit provider/model selection
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

interface OcTextPart {
  type: string;
  text?: string;
}

interface OcMessage {
  id: string;
  type: string;
  finish?: string;
  content?: OcTextPart[];
  tokens?: Record<string, number>;
  cost?: number;
  error?: { type?: string; message?: string } | null;
}

export function bootOpencodeServe(options: {
  directory: string;
  port: number;
  logFile?: string;
  spawn?: () => ReturnType<typeof import('node:child_process').spawn>;
}): ReturnType<typeof import('node:child_process').spawn> {
  // Implemented deliberately via child_process here so the dev workflow can
  // start its own isolated server; the adapter itself never spawns agents.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { spawn } = require('node:child_process') as typeof import('node:child_process');
  return spawn('opencode', ['serve', '--port', String(options.port)], {
    cwd: options.directory,
    stdio: options.logFile ? 'ignore' : 'ignore',
    detached: true,
  });
}

export class OpenCodeAgentRuntime implements AgentRuntime {
  readonly name = 'opencode' as const;
  private baseUrl: string;
  private password: string | null;
  private agentName: string | null;
  private model: OpenCodeModelRef | null;
  private timeoutMs: number;
  private fetchImpl: typeof fetch;
  private steps = new Map<string, RuntimeStepRecord[]>();
  private lastMessages = new Map<string, OcMessage[]>();
  private sessionMap = new Map<string, string>(); // runId -> sessionId

  constructor(cfg: OpenCodeRuntimeConfig) {
    if (!cfg.baseUrl) throw new Error('OpenCodeAgentRuntime: baseUrl required');
    this.baseUrl = cfg.baseUrl.replace(/\/$/, '');
    this.password = cfg.password ?? null;
    this.agentName = cfg.agentName ?? null;
    this.model = cfg.model ?? null;
    this.timeoutMs = cfg.timeoutMs ?? 240_000;
    this.fetchImpl = cfg.fetchImpl ?? fetch;
  }

  private authHeaders(): Record<string, string> {
    if (!this.password) return {};
    const b64 = Buffer.from(`opencode:${this.password}`).toString('base64');
    return { Authorization: `Basic ${b64}` };
  }

  private url(path: string): string {
    return this.baseUrl + path;
  }

  async startRun(descriptor: AgentRunDescriptor): Promise<AgentRunInfo> {
    const createRes = await this.withTimeout(
      this.fetchImpl(this.url('/api/session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
        body: JSON.stringify({
          title: `pursuit:${descriptor.tenantId}:${descriptor.goal.slice(0, 60)}`,
        }),
      }),
      this.timeoutMs,
    );
    if (!createRes.ok) {
      throw new Error(`OpenCode session create failed: ${createRes.status}`);
    }
    const created = (await parseJsonSafe(await createRes.text())) as {
      data?: { id: string; model?: unknown };
    } | null;
    const sessionId = created?.data?.id;
    if (!sessionId) throw new Error('OpenCode session id missing in response');

    // policy: dispatch into the tool-disabled Pursuit agent when configured
    if (this.agentName) {
      const switchRes = await this.withTimeout(
        this.fetchImpl(this.url(`/api/session/${sessionId}/agent`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
          body: JSON.stringify({ agent: this.agentName }),
        }),
        this.timeoutMs,
      );
      if (!switchRes.ok) {
        throw new Error(
          `OpenCode agent switch failed (${this.agentName}): HTTP ${switchRes.status}`,
        );
      }
    }

    // policy: explicit provider/model selection when configured
    if (this.model) {
      const modelRes = await this.withTimeout(
        this.fetchImpl(this.url(`/api/session/${sessionId}/model`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
          body: JSON.stringify({ model: this.model }),
        }),
        this.timeoutMs,
      );
      if (!modelRes.ok) {
        throw new Error(
          `OpenCode model switch failed (${this.model.providerID}/${this.model.id}): HTTP ${modelRes.status}`,
        );
      }
    }

    const userPrompt = `${buildAgentSystemPrompt()}\n\n${buildAgentUserPrompt({
      tenantId: descriptor.tenantId,
      goal: descriptor.goal,
      externalContexts: (descriptor.contextRefs ?? []).length
        ? [{ label: 'context_refs', text: JSON.stringify(descriptor.contextRefs) }]
        : [],
    })}`;

    const promptRes = await this.withTimeout(
      this.fetchImpl(this.url(`/api/session/${sessionId}/prompt`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
        body: JSON.stringify({ text: userPrompt }),
      }),
      this.timeoutMs,
    );
    if (!promptRes.ok) {
      throw new Error(`OpenCode prompt failed: ${promptRes.status} ${await promptRes.text()}`);
    }

    // poll transcript until a completed assistant message or timeout
    const deadline = Date.now() + this.timeoutMs;
    await new Promise((r) => setTimeout(r, 1500));
    let messages: OcMessage[] = [];
    let target: OcMessage | null = null;
    while (Date.now() < deadline) {
      const msgRes = await this.withTimeout(
        this.fetchImpl(this.url(`/api/session/${sessionId}/message`), {
          headers: { ...this.authHeaders() },
        }),
        this.timeoutMs,
      );
      const raw = (await msgRes.json()) as { data?: OcMessage[] } | OcMessage[];
      messages = ('data' in raw && raw.data ? raw.data : raw) as OcMessage[];
      const completed = messages.filter((m) => m.type === 'assistant' && m.finish);
      if (completed.length > 0) {
        // prefer the LAST completed stop message; fall back to last completed
        const stops = completed.filter((m) => m.finish === 'stop');
        target = (stops.length ? stops[stops.length - 1] : completed[completed.length - 1]) ?? null;
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (!target) throw new Error('OpenCode agent did not produce a completed response in time');

    this.lastMessages.set(sessionId, messages);
    const text =
      (target.content ?? [])
        .filter((p) => p.type === 'text')
        .map((p) => p.text ?? '')
        .join('\n')
        .trim() || undefined;

    const runId = `oc_${sessionId}`;
    this.sessionMap.set(runId, sessionId);
    const tokens = target.tokens ?? {};
    const isError = target.finish === 'error';
    const info: AgentRunInfo = {
      runId,
      sessionId,
      status: isError ? 'FAILED' : 'SUCCEEDED',
      steps: this.steps.get(runId) ?? [],
      usage: {
        input: Number(tokens.input ?? 0),
        output: Number(tokens.output ?? 0),
        cost: Number(target.cost ?? 0),
      },
      proposal: text,
    };
    return info;
  }

  async streamEvents(runId: string, onEvent: (e: AgentRuntimeEvent) => void): Promise<void> {
    const sessionId = this.sessionMap.get(runId);
    if (!sessionId) throw new Error(`unknown run ${runId}`);
    const messages = this.lastMessages.get(sessionId) ?? [];
    onEvent({ type: 'session_created', sessionId, at: new Date().toISOString() });
    for (const m of messages) {
      onEvent({
        type: 'message',
        messageId: m.id,
        text: (m.content ?? []).find((p) => p.type === 'text')?.text,
        data: m.error ? { error: m.error } : undefined,
        at: new Date().toISOString(),
      });
    }
    onEvent({ type: 'run_finished', sessionId, at: new Date().toISOString() });
  }

  async requestTool(
    runId: string,
    toolName: string,
    validatedArgs: Record<string, unknown>,
    opts?: { approvedTool?: boolean },
  ) {
    if (!this.sessionMap.has(runId)) {
      return { ok: false as const, reason: 'unknown_run' as const, detail: runId };
    }
    if (opts?.approvedTool !== true) {
      const step: RuntimeStepRecord = {
        tool: toolName,
        argumentsRedacted: redactionJson(validatedArgs),
        status: 'BLOCKED_BY_POLICY',
        at: new Date().toISOString(),
      };
      this.recordStep(runId, step);
      return {
        ok: false as const,
        reason: 'blocked_by_policy' as const,
        detail: 'tool not pre-approved for this run',
      };
    }
    const step: RuntimeStepRecord = {
      tool: toolName,
      argumentsRedacted: redactionJson(validatedArgs),
      status: 'SUCCEEDED',
      resultRef: 'opencode://approved-tool-frame',
      at: new Date().toISOString(),
    };
    this.recordStep(runId, step);
    return { ok: true as const, result: { frame: 'approved' }, step };
  }

  pause(runId: string, _reason: string): Promise<void> {
    void runId;
    return Promise.resolve();
  }

  async resume(runId: string, _approvalId: string): Promise<AgentRunInfo> {
    const sid = this.sessionMap.get(runId);
    if (!sid) throw new Error(`unknown run ${runId}`);
    const info: AgentRunInfo = {
      runId,
      sessionId: sid,
      status: 'RUNNING',
      steps: this.steps.get(runId) ?? [],
    };
    return info;
  }

  cancel(runId: string): Promise<void> {
    void runId;
    return Promise.resolve();
  }

  async getRun(runId: string): Promise<AgentRunInfo | null> {
    const sid = this.sessionMap.get(runId);
    if (!sid) return null;
    const messages = this.lastMessages.get(sid) ?? [];
    const assistantMsg = [...messages].reverse().find((m) => m.type === 'assistant');
    const tokens = assistantMsg?.tokens ?? {};
    const text =
      (assistantMsg?.content ?? [])
        .filter((p) => p.type === 'text')
        .map((p) => p.text ?? '')
        .join('\n')
        .trim() || undefined;
    return {
      runId,
      sessionId: sid,
      status: assistantMsg?.finish === 'error' ? 'FAILED' : 'SUCCEEDED',
      steps: this.steps.get(runId) ?? [],
      usage: {
        input: Number(tokens.input ?? 0),
        output: Number(tokens.output ?? 0),
        cost: Number(assistantMsg?.cost ?? 0),
      },
      proposal: text,
    };
  }

  /** Extract the first JSON proposal object from the assistant output. */
  static extractProposal(proposalText: string): Record<string, unknown> | null {
    return extractLastJsonObject(proposalText);
  }

  private recordStep(runId: string, step: RuntimeStepRecord): void {
    const arr = this.steps.get(runId) ?? [];
    arr.push(step);
    this.steps.set(runId, arr);
  }

  private async withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return await Promise.race([
      p,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('opencode timeout')), ms)),
    ]);
  }
}
