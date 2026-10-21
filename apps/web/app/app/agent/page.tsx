'use client';

import { useState } from 'react';
import { apiFetch, useResource, ApiError } from '@/lib/api-client';
import { ToolName, AUTO_TOOLS, GATED_TOOLS } from '@pursuit/shared';
import type { ToolName as ToolNameType, AgentRun } from '@pursuit/shared';
import {
  PageHeader,
  Loading,
  ErrorBox,
  Empty,
  StatusPill,
  Card,
  Field,
  inputClass,
  Unavailable,
} from '../_components/ui';

interface RunsResponse {
  items: AgentRun[];
}

const ALL_TOOLS: ToolNameType[] = ToolName.options;

export default function AgentPage() {
  const runs = useResource<RunsResponse>('/agent/runs');
  const [goal, setGoal] = useState('');
  const [tools, setTools] = useState<string[]>([...AUTO_TOOLS]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startRun(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch<{ run: AgentRun }>('/agent/runs', {
        method: 'POST',
        json: { goal, allowed_tools: tools, context_refs: [] },
      });
      setGoal('');
      runs.reload();
    } catch (err) {
      if (err instanceof ApiError) {
        const detailMsg = (err.body['detail'] as string | undefined) ?? '';
        setError(`${err.message}${detailMsg ? ` — ${detailMsg}` : ''}`);
      } else {
        setError('Could not start the run — is the API running?');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Agent"
        subtitle="Run the proposal-only agent. Nothing is ever submitted or sent directly — the agent proposes, you decide."
      />

      <Card className="border-[#f5e3c2] bg-[#fdf6ec]">
        <p className="text-sm">
          <strong>Current runtime: “dev”.</strong> Deterministic, model-free — every requested tool
          is exercised through the policy gateway and recorded{' '}
          <code className="font-mono text-xs">BLOCKED_BY_POLICY</code>, and the run completes with a
          explicit proposal summary. Real model analysis requires selecting a provider and is still
          an open decision (see docs/OPEN_QUESTIONS.md).
        </p>
      </Card>

      <Card className="mt-4">
        <h2 className="text-sm font-semibold">Start a run</h2>
        <form onSubmit={startRun} className="mt-3 space-y-3">
          <Field label="Goal">
            <input
              required
              minLength={4}
              maxLength={400}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className={inputClass}
              placeholder="Find senior engineering roles in my pipeline and draft applications"
            />
          </Field>
          <fieldset>
            <legend className="text-sm font-medium">Allowed tools</legend>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {ALL_TOOLS.map((t) => {
                const checked = tools.includes(t);
                const gated = (GATED_TOOLS as string[]).includes(t);
                return (
                  <label
                    key={t}
                    className={`flex min-h-[44px] items-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm ${
                      checked
                        ? 'border-[var(--foreground)] bg-[var(--hover)]'
                        : 'border-[var(--border)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setTools(checked ? tools.filter((x) => x !== t) : [...tools, t])
                      }
                      className="h-4 w-4"
                    />
                    <code className="font-mono text-xs">{t}</code>
                    {gated && (
                      <span className="rounded-full border border-[#f5e3c2] bg-[#fdf6ec] px-1.5 py-0.5 text-[10px]">
                        approval-gated
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <button
            type="submit"
            disabled={busy || tools.length === 0}
            className="h-10 min-h-[44px] rounded-[10px] bg-[var(--primary)] px-5 text-sm font-medium text-[color:var(--primary-foreground)] transition-colors duration-150 hover:bg-[#333] disabled:opacity-60"
          >
            {busy ? 'Starting…' : 'Start run'}
          </button>
        </form>
        {error && (
          <p
            role="alert"
            className="mt-3 rounded-[var(--radius-md)] border border-[#f4c7c3] bg-[#fdf3f2] px-3 py-2 text-sm text-[#a50e0e]"
          >
            {error}
          </p>
        )}
      </Card>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">Run history</h2>
        {runs.error ? (
          <ErrorBox error={runs.error} retry={runs.reload} />
        ) : runs.loading ? (
          <Loading />
        ) : (runs.data?.items.length ?? 0) === 0 ? (
          <Empty>No runs yet.</Empty>
        ) : (
          <ul className="space-y-3">
            {runs.data?.items.map((r) => (
              <li key={r.id}>
                <Card>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.goal}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {new Date(r.created_at).toLocaleString()} · {r.runtime}
                        {r.finished_at
                          ? ` · finished ${new Date(r.finished_at).toLocaleTimeString()}`
                          : ''}
                      </p>
                    </div>
                    <StatusPill status={r.status} kind="neutral" />
                  </div>
                  <ol className="mt-2 space-y-1">
                    {r.steps.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-2 font-mono text-[11px]"
                      >
                        <span className="truncate text-[var(--muted-foreground)]">{s.tool}</span>
                        <span
                          className={
                            s.status === 'BLOCKED_BY_POLICY'
                              ? 'text-[#8a5a00]'
                              : s.status === 'SUCCEEDED'
                                ? 'text-[#18794e]'
                                : 'text-[#a50e0e]'
                          }
                        >
                          {s.status}
                        </span>
                      </li>
                    ))}
                  </ol>
                  {r.steps.some((s) => s.status === 'FAILED') && (
                    <p className="mt-1 text-[11px] text-[#a50e0e]">
                      A step failed — the failure is shown verbatim, never retried silently.
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 space-y-2">
        <Unavailable
          feature="Real model runs"
          detail="The verified OpenCode adapter exists behind AGENT_RUNTIME=opencode, but selecting a non-personal or paid model provider needs a decision recorded in OPEN_QUESTIONS.md — nothing runs without it."
        />
        <Unavailable
          feature="Autonomous browser actions"
          detail="The browser worker executes nothing until an approval covers the exact payload (hash-bound, single-use)."
        />
      </section>
    </>
  );
}
