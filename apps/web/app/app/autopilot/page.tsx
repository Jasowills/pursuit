'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError, apiFetch, useResource } from '@/lib/api-client';
import { Card, ErrorBox, Field, Loading, PageHeader, StatusPill } from '../_components/ui';

type Settings = {
  revision: number;
  enabled: boolean;
  mode: 'research' | 'prepare';
  boards: string[];
  keywords: string[];
  interval_minutes: number;
  max_drafts: number;
  min_fit: number;
  connection_id: string | null;
  resume: string;
};
type Run = {
  id: string;
  status: string;
  discovered: number;
  prepared: number;
  skipped: number;
  startedAt: string;
  finishedAt: string | null;
  summary: { board?: string; job_id?: string; status: string }[];
};
type Response = { settings: Settings; running: boolean; next_run_at: string | null; runs: Run[] };
type Models = {
  connections: { id: string; provider: string; model: string | null; testedAt: string | null }[];
};

export default function AutopilotPage() {
  const resource = useResource<Response>('/autopilot');
  const models = useResource<Models>('/connections/models');
  const [form, setForm] = useState<Settings | null>(null);
  const [boards, setBoards] = useState('');
  const [keywords, setKeywords] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (resource.data && !form) {
      setForm(resource.data.settings);
      setBoards(resource.data.settings.boards.join(', '));
      setKeywords(resource.data.settings.keywords.join(', '));
    }
  }, [resource.data, form]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') resource.reload();
    }, 15000);
    return () => clearInterval(timer);
  }, []);
  async function action(kind: 'save' | 'pause' | 'run') {
    if (!form) return;
    setBusy(true);
    setError(null);
    setMessage('');
    try {
      if (kind === 'save') {
        const result = await apiFetch<Response>('/autopilot', {
          method: 'PUT',
          json: {
            ...form,
            boards: boards
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            keywords: keywords
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          },
        });
        setForm(result.settings);
        setMessage(
          result.settings.enabled
            ? 'Scheduled research enabled. The worker will check within 30 seconds.'
            : 'Settings saved. Scheduled research is off.',
        );
      } else if (kind === 'pause') {
        const result = await apiFetch<Response>('/autopilot/pause', { method: 'POST', json: {} });
        setForm(result.settings);
        setMessage(
          'Paused. A current provider request may finish, but no further drafts will be saved.',
        );
      } else {
        await apiFetch('/autopilot/run', { method: 'POST', json: {} });
        setMessage('Run queued. Results will appear here and in Notifications.');
      }
      resource.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function reloadSettings() {
    setBusy(true);
    try {
      const fresh = await apiFetch<Response>('/autopilot');
      setForm(fresh.settings);
      setBoards(fresh.settings.boards.join(', '));
      setKeywords(fresh.settings.keywords.join(', '));
      setError(null);
      setMessage('Loaded saved settings. Unsaved edits were replaced.');
      resource.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  if (resource.error && !resource.data)
    return <ErrorBox error={resource.error} retry={resource.reload} />;
  if (!form) return <Loading label="Loading autopilot settings…" />;
  const data = resource.data;
  return (
    <>
      <PageHeader
        title="Career autopilot"
        subtitle="Let Pursuit research roles and prepare drafts while you're away. Set your scope, turn it on, and return to a record of the work."
      />
      <div className="notice notice-warning mb-6">
        <strong>Automatic applications are not available yet.</strong>
        <p className="mt-2 text-sm">
          This release can research public Greenhouse boards and prepare drafts using your model. It
          does not fill or submit job applications. Completion notifications are saved in-app; push
          and email alerts are not connected.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <StatusPill
          status={data?.running ? 'RUNNING' : data?.settings.enabled ? 'ENABLED' : 'PAUSED'}
          kind="neutral"
        />
        <span className="text-xs text-[var(--muted)]">
          {data?.settings.enabled && data.next_run_at
            ? `Next check: ${new Date(data.next_run_at).toLocaleString()}`
            : 'No scheduled work while paused.'}
        </span>
        <button
          className="btn btn-outline"
          disabled={busy || !data?.settings.enabled || data.running}
          onClick={() => void action('run')}
        >
          Run soon
        </button>
        <button
          className="btn btn-outline"
          disabled={busy || !data?.settings.enabled}
          onClick={() => void action('pause')}
        >
          Pause now
        </button>
      </div>
      {error != null && (
        <div className="mb-5">
          <ErrorBox error={error} />
          {error instanceof ApiError && error.body.error === 'autopilot_changed_reload' && (
            <button
              className="btn btn-outline mt-3"
              disabled={busy}
              onClick={() => void reloadSettings()}
            >
              Reload saved settings and discard my edits
            </button>
          )}
        </div>
      )}
      {message && (
        <p role="status" className="notice mb-5">
          {message}
        </p>
      )}
      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action('save');
          }}
          className="space-y-5"
        >
          <h2>Choose what Pursuit works on</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Work mode">
              <select
                className="input"
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value as Settings['mode'] })}
              >
                <option value="research">Research and qualify roles</option>
                <option value="prepare">Research and prepare application drafts</option>
                <option disabled>Research and apply automatically — coming later</option>
              </select>
            </Field>
            <Field label="Check frequency">
              <select
                className="input"
                value={form.interval_minutes}
                onChange={(e) => setForm({ ...form, interval_minutes: Number(e.target.value) })}
              >
                <option value={60}>Every hour</option>
                <option value={360}>Every 6 hours</option>
                <option value={720}>Every 12 hours</option>
                <option value={1440}>Daily</option>
              </select>
            </Field>
          </div>
          <Field
            label="Greenhouse board identifiers"
            hint="Up to five, comma separated. Use the identifier in a company's public Greenhouse URL. Each check imports up to 25 postings per board."
          >
            <input
              required={form.enabled}
              className="input"
              value={boards}
              onChange={(e) => setBoards(e.target.value)}
              placeholder="company-board, another-board"
            />
          </Field>
          <Field
            label="Role title keywords"
            hint="Optional, comma separated. A title must match at least one keyword. Career profile exclusions and eligibility checks still apply."
          >
            <input
              className="input"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Backend, Platform, Software Engineer"
            />
          </Field>
          <div className="grid md:grid-cols-2 gap-5">
            <Field
              label="Minimum baseline fit (0–100)"
              hint="Rule-based scoring, not an AI hiring decision. Unknown eligibility is never prepared automatically."
            >
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                required
                value={form.min_fit}
                onChange={(e) => setForm({ ...form, min_fit: Number(e.target.value) })}
              />
            </Field>
            <Field
              label="Maximum preparation attempts per run"
              hint="Includes failed model requests, so errors cannot bypass your usage limit."
            >
              <input
                className="input"
                type="number"
                min={1}
                max={5}
                required
                value={form.max_drafts}
                onChange={(e) => setForm({ ...form, max_drafts: Number(e.target.value) })}
              />
            </Field>
          </div>
          {form.mode === 'prepare' && (
            <>
              <Field
                label="Your tested model"
                hint="Scheduled model requests use your account and incur your provider's charges."
              >
                <select
                  className="input"
                  required
                  value={form.connection_id ?? ''}
                  onChange={(e) => setForm({ ...form, connection_id: e.target.value || null })}
                >
                  <option value="">Choose a verified connection</option>
                  {models.data?.connections
                    .filter((c) => c.model && c.testedAt)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.provider} / {c.model}
                      </option>
                    ))}
                </select>
              </Field>
              {models.error && <ErrorBox error={models.error} retry={models.reload} />}
              <Link className="link-underline text-xs" href="/app/settings">
                Connect and test your model
              </Link>
              <Field
                label="Factual master resume"
                hint="Saved for background preparation. Resume text and your career profile are sent to your chosen model provider. Review every generated claim before use."
              >
                <textarea
                  className="input"
                  rows={7}
                  minLength={50}
                  required
                  maxLength={30000}
                  value={form.resume}
                  onChange={(e) => setForm({ ...form, resume: e.target.value })}
                />
              </Field>
            </>
          )}
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            Enable scheduled research{form.mode === 'prepare' ? ' and model preparation' : ''}
          </label>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Work runs on the API server, so closing your browser does not stop it. The server must
            remain running; a sleeping local computer cannot run checks. Pause takes effect between
            requests. Existing application records and autopilot drafts are skipped.
          </p>
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? 'Saving…' : 'Save autopilot settings'}
          </button>
        </form>
      </Card>
      <section className="overview-panel mt-6">
        <div className="overview-panel-head">
          <h2>Run history</h2>
          <button className="btn btn-outline" onClick={resource.reload}>
            Refresh
          </button>
        </div>
        {resource.error && <ErrorBox error={resource.error} retry={resource.reload} />}
        <p className="px-5 py-4 text-xs text-[var(--muted)]">
          {data?.runs.length
            ? 'Every run records its outcome. Prepared drafts are waiting in your search workflow.'
            : 'No runs yet. Add a board and enable scheduled research to start.'}
        </p>
        {data?.runs.map((run) => (
          <article key={run.id} className="p-5 border-t border-[var(--border)]">
            <div className="flex flex-wrap justify-between gap-3">
              <strong className="text-xs">{new Date(run.startedAt).toLocaleString()}</strong>
              <StatusPill status={run.status} kind="neutral" />
            </div>
            <p className="text-xs mt-3">
              {run.discovered} postings checked · {run.prepared} drafts prepared · {run.skipped}{' '}
              skipped · 0 submitted
            </p>
            {run.summary.length > 0 && (
              <details className="mt-3 text-xs">
                <summary>View results and source errors</summary>
                <ul className="mt-2 space-y-2">
                  {run.summary.map((item, i) => (
                    <li key={i}>
                      {item.board ?? (item.job_id ? 'Opportunity' : 'Run')}:{' '}
                      {item.status.replaceAll('_', ' ').toLowerCase()}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </article>
        ))}
      </section>
      <div className="flex flex-wrap gap-5 mt-5 text-xs">
        <Link href="/app/jobs" className="link-underline">
          Review opportunities
        </Link>
        <Link href="/app/workflow" className="link-underline">
          Review prepared drafts
        </Link>
        <Link href="/app/notifications" className="link-underline">
          View completion notifications
        </Link>
      </div>
    </>
  );
}
