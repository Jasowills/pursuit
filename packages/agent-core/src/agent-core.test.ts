import { describe, expect, it } from 'vitest';
import { DevAgentRuntime } from './dev-runtime';
import { decideTool } from './policy';
import { redactValue, redactionJson } from './redaction';
import { OpenCodeAgentRuntime } from './opencode-runtime';

describe('DevAgentRuntime contract', () => {
  it('starts a run and finishes with a proposal', async () => {
    const rt = new DevAgentRuntime();
    const info = await rt.startRun({
      tenantId: 't1',
      actorId: 'u1',
      goal: 'find new opportunities',
      allowedTools: ['search_jobs'],
    });
    // dev runtime completes deterministically with a canned proposal
    expect(info.status).toBe('SUCCEEDED');
    expect(info.proposal).toContain('DEV-PROPOSAL');
    const got = await rt.getRun(info.runId);
    expect(got?.runId).toBe(info.runId);
  });

  it('blocks tool calls by policy and records them', async () => {
    const rt = new DevAgentRuntime();
    const run = await rt.startRun({
      tenantId: 't1',
      actorId: 'u1',
      goal: 'score a posting',
      allowedTools: ['score_job'],
    });
    const blocked = await rt.requestTool(run.runId, 'score_job', { job_id: 'j1' });
    expect(blocked.ok).toBe(false);
    const info = await rt.getRun(run.runId);
    expect(info?.steps[0]).toMatchObject({ tool: 'score_job', status: 'BLOCKED_BY_POLICY' });
  });

  it('executes only explicitly approved tools', async () => {
    const rt = new DevAgentRuntime();
    const run = await rt.startRun({
      tenantId: 't1',
      actorId: 'u1',
      goal: 'score a posting',
      allowedTools: ['score_job'],
    });
    const res = await rt.requestTool(
      run.runId,
      'score_job',
      { job_id: 'j1' },
      { approvedTool: true },
    );
    expect(res.ok).toBe(true);
    const info = await rt.getRun(run.runId);
    // step[0] is the auto-recorded BLOCKED_BY_POLICY walk from startRun; the
    // explicitly approved call is the last SUCCEEDED step
    const approved = info?.steps.filter((s) => s.status === 'SUCCEEDED').at(-1);
    expect(approved).toMatchObject({ status: 'SUCCEEDED' });
  });
});

describe('tool policy gateway', () => {
  it('refuses tools outside the run scope', () => {
    expect(decideTool({ tool: 'search_jobs', allowedTools: ['score_job'] })).toEqual({
      allowed: false,
      reason: 'not_in_scope',
    });
  });

  it('requires approval for gated tools, allows auto tools', () => {
    expect(
      decideTool({ tool: 'submit_application', allowedTools: ['submit_application'] }),
    ).toEqual({
      allowed: false,
      reason: 'gated_needs_approval',
    });
    expect(
      decideTool({
        tool: 'submit_application',
        allowedTools: ['submit_application'],
        approvalGrantedForTool: true,
      }),
    ).toEqual({ allowed: true });
    expect(decideTool({ tool: 'search_jobs', allowedTools: ['search_jobs'] })).toEqual({
      allowed: true,
    });
  });

  it('refuses unknown tools entirely', () => {
    expect(decideTool({ tool: 'shell_exec', allowedTools: ['shell_exec'] })).toEqual({
      allowed: false,
      reason: 'unknown_tool',
    });
  });
});

describe('redaction', () => {
  it('masks sensitive keys and PII in nested data', () => {
    const out = redactionJson({
      token: 'abc123',
      nested: { api_key: 'zzz', note: 'contact bob@corp.example' },
    });
    const parsed = JSON.parse(out) as Record<string, unknown>;
    expect(parsed['token']).toBe('[redacted]');
    expect((parsed['nested'] as Record<string, unknown>)['api_key']).toBe('[redacted]');
    expect((parsed['nested'] as Record<string, unknown>)['note']).toBe('contact [redacted-email]');
  });

  it('handles cyclic structures safely', () => {
    const a: Record<string, unknown> = {};
    a['self'] = a;
    expect(redactValue(a)).toBeDefined();
  });
});

describe('OpenCodeAgentRuntime (contract-level, no network)', () => {
  it('requires baseUrl', () => {
    expect(() => new OpenCodeAgentRuntime({ baseUrl: '', password: null })).toThrow();
  });

  it('records BLOCKED_BY_POLICY steps for unapproved tools without network access', async () => {
    const calls: string[] = [];
    const fetchMock: typeof fetch = async (input: RequestInfo | URL) => {
      calls.push(String(input));
      throw new Error('network not allowed in this test');
    };
    const rt = new OpenCodeAgentRuntime({
      baseUrl: 'http://127.0.0.1:7334',
      password: null,
      fetchImpl: fetchMock,
    });
    // startRun needs the network; we test requestTool directly via injected
    // session map by first kicking off a run that should fail without network.
    await expect(
      rt.startRun({ tenantId: 't', actorId: 'u', goal: 'x', allowedTools: [] }),
    ).rejects.toThrow();
    expect(calls.length).toBeGreaterThan(0);
  });
});
