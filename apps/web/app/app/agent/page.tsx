'use client';

import { useState } from 'react';
import Link from 'next/link';
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
        eyebrow="Section 04 / Agent"
        title="Agent"
        subtitle="Run the proposal-only agent. Nothing is ever submitted or sent directly — the agent proposes, you decide."
      />

      <div className="notice notice-warning">
        <span className="notice-label">Runtime / dev</span>
        <p className="text-[13px] leading-relaxed text-[color:var(--ink-soft)]">
          <strong className="font-semibold">Deterministic and model-free.</strong> Every requested
          tool is exercised through the policy gateway and recorded{' '}
          <code className="font-mono text-[11px]">BLOCKED_BY_POLICY</code>, and the run completes
          with an explicit proposal summary. For model-assisted resume and outreach preparation,
          connect your own model in Settings and open the{' '}
          <Link href="/app/workflow" className="link-underline">
            search workflow
          </Link>
          . Isolated per-user OpenCode workers and browser execution are still in development.
        </p>
      </div>

      <Card className="mt-5">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div>
            <p className="eyebrow">New run / Proposal only</p>
            <h2 className="panel-heading mt-1">Start a run.</h2>
          </div>
          <span className="stamp stamp-warning">No external actions</span>
        </div>

        <form onSubmit={startRun} className="mt-5 space-y-5">
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
            <legend className="label">Allowed tools</legend>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ALL_TOOLS.map((t) => {
                const checked = tools.includes(t);
                const gated = (GATED_TOOLS as string[]).includes(t);
                return (
                  <label
                    key={t}
                    className={`flex min-h-[44px] cursor-pointer items-center gap-3 border px-3 py-2 text-[13px] transition-colors ${
                      checked
                        ? 'border-[var(--ink)] bg-[var(--surface)]'
                        : 'border-[var(--border)] hover:bg-[var(--hover)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setTools(checked ? tools.filter((x) => x !== t) : [...tools, t])
                      }
                      className="h-4 w-4 accent-[var(--signal)]"
                    />
                    <code className="truncate font-mono text-[10px]">{t}</code>
                    {gated && <span className="stamp stamp-warning ml-auto">gated</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy || tools.length === 0}
              className="btn btn-primary btn-arrow"
            >
              {busy ? 'Starting…' : 'Start run'}
            </button>
            <span className="mono-meta">
              {tools.length} tools selected · gateway applies on every step
            </span>
          </div>
        </form>

        {error && (
          <div role="alert" className="notice notice-danger mt-4">
            <span className="notice-label">Run not started</span>
            <p className="text-[13px] leading-relaxed text-[color:var(--ink-soft)]">{error}</p>
          </div>
        )}
      </Card>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--ink)] pb-2">
          <h2 className="panel-title">Run history</h2>
          <span className="mono-meta">{runs.data?.items.length ?? 0} entries</span>
        </div>

        {runs.error ? (
          <div className="mt-4">
            <ErrorBox error={runs.error} retry={runs.reload} />
          </div>
        ) : runs.loading ? (
          <Loading />
        ) : (runs.data?.items.length ?? 0) === 0 ? (
          <Empty>No runs yet.</Empty>
        ) : (
          <div>
            {runs.data?.items.map((r) => (
              <article key={r.id} className="border-b border-[var(--border)] py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-serif text-[21px] leading-tight tracking-[-0.02em]">
                      {r.goal}
                    </p>
                    <p className="mono-meta mt-1">
                      {new Date(r.created_at).toLocaleString()} · runtime {r.runtime}
                      {r.finished_at
                        ? ` · finished ${new Date(r.finished_at).toLocaleTimeString()}`
                        : ''}
                    </p>
                  </div>
                  <StatusPill status={r.status} kind="neutral" />
                </div>

                {r.proposal && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      Read persisted proposal
                    </summary>
                    <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[var(--surface-soft)] p-4 text-xs leading-relaxed">
                      {r.proposal}
                    </pre>
                  </details>
                )}
                <div className="mt-4 border-t border-[var(--border)]">
                  {r.steps.map((s, index) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-2 last:border-0"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="font-mono text-[8px] text-[color:var(--muted)]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="truncate font-mono text-[10px] text-[color:var(--ink-soft)]">
                          {s.tool}
                        </span>
                      </span>
                      <span
                        className={`font-mono text-[9px] uppercase tracking-[0.08em] ${
                          s.status === 'BLOCKED_BY_POLICY'
                            ? 'text-[color:var(--warning)]'
                            : s.status === 'SUCCEEDED'
                              ? 'text-[color:var(--success)]'
                              : 'text-[color:var(--danger)]'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>

                {r.steps.some((s) => s.status === 'FAILED') && (
                  <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--danger)]">
                    A step failed — the failure is shown verbatim, never retried silently.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 space-y-3">
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
