'use client';

import { useState } from 'react';
import { apiFetch, useResource } from '@/lib/api-client';
import type { Watcher } from '@pursuit/shared';
import {
  PageHeader,
  Loading,
  ErrorBox,
  Empty,
  Card,
  Field,
  inputClass,
  Unavailable,
} from '../_components/ui';

interface WatchersResponse {
  items: Watcher[];
}

const EMPTY = {
  kind: 'COMPANY_URL',
  source_url: '',
  frequency_minutes: 60,
  keywords: '',
};

export default function WatchersPage() {
  const watchers = useResource<WatchersResponse>('/watchers');
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch<{ watcher: Watcher }>('/watchers', {
        method: 'POST',
        json: {
          kind: form.kind,
          source_url: form.source_url,
          frequency_minutes: Number(form.frequency_minutes),
          keywords: form.keywords
            ? form.keywords
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean)
            : [],
        },
      });
      setForm(EMPTY);
      watchers.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(w: Watcher) {
    setError(null);
    try {
      await apiFetch<{ watcher: Watcher }>(`/watchers/${w.id}`, {
        method: 'PATCH',
        json: { enabled: !w.enabled },
      });
      watchers.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Section 06 / Watchers"
        title="Watchers"
        subtitle="Watch company career pages and search URLs for new or reopened roles."
      />

      <div className="notice notice-warning">
        <span className="notice-label">Honest status</span>
        <p className="text-[13px] leading-relaxed text-[color:var(--ink-soft)]">
          <strong className="font-semibold">
            Watchers are stored and can be toggled, but checking is not scheduled yet.
          </strong>{' '}
          No robotic execution runs in this milestone, so nothing has been fetched from these URLs
          automatically. Manual job intake covers discovery for now.
        </p>
      </div>

      <Card className="mt-5">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div>
            <p className="eyebrow">New watcher / stored record</p>
            <h2 className="panel-heading mt-1">Add a source.</h2>
          </div>
          <span className="stamp stamp-muted">No scheduler</span>
        </div>

        <form onSubmit={create} className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Kind">
            <select
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value })}
              className={inputClass}
            >
              <option value="COMPANY_URL">Company careers page</option>
              <option value="KEYWORD">Keyword / search URL</option>
            </select>
          </Field>
          <Field label="Source URL">
            <input
              required
              type="url"
              value={form.source_url}
              onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              className={inputClass}
              placeholder="https://acme.com/careers"
            />
          </Field>
          <Field label="Frequency (minutes, 15–14400)">
            <input
              required
              type="number"
              min={15}
              max={14400}
              value={form.frequency_minutes}
              onChange={(e) => setForm({ ...form, frequency_minutes: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Keywords (comma separated, keyword watchers)">
            <input
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              className={inputClass}
              placeholder="platform, senior, staff"
            />
          </Field>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className="btn btn-primary btn-arrow">
              {busy ? 'Adding…' : 'Add watcher'}
            </button>
            <span className="mono-meta">Stored only · no fetch will run.</span>
          </div>
        </form>

        {error && (
          <div role="alert" className="notice notice-danger mt-4">
            <span className="notice-label">Watcher action failed</span>
            <p className="text-[13px] leading-relaxed text-[color:var(--ink-soft)]">{error}</p>
          </div>
        )}
      </Card>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--ink)] pb-2">
          <h2 className="panel-title">Your watchers</h2>
          <span className="mono-meta">{watchers.data?.items.length ?? 0} sources</span>
        </div>

        {watchers.error ? (
          <div className="mt-4">
            <ErrorBox error={watchers.error} retry={watchers.reload} />
          </div>
        ) : watchers.loading ? (
          <Loading />
        ) : (watchers.data?.items.length ?? 0) === 0 ? (
          <Empty>No watchers yet.</Empty>
        ) : (
          <ul>
            {watchers.data?.items.map((w, index) => (
              <li key={w.id} className="case-row">
                <span className="flex min-w-0 items-start gap-4">
                  <span className="index-num pt-1">{String(index + 1).padStart(2, '0')}</span>
                  <span className="min-w-0">
                    <span className="case-row-title">{w.source_url}</span>
                    <span className="case-row-meta">
                      {w.kind === 'COMPANY_URL'
                        ? 'company page'
                        : `keywords: ${w.keywords.join(', ') || 'none'}`}{' '}
                      · every {w.frequency_minutes} min
                      {w.error_streak > 0 ? ` · ${w.error_streak} errors` : ''}
                    </span>
                  </span>
                </span>
                <button
                  onClick={() => toggle(w)}
                  className={`btn btn-sm shrink-0 ${w.enabled ? 'btn-outline' : 'btn-ghost'}`}
                >
                  {w.enabled ? 'Enabled — disable' : 'Disabled — enable'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <Unavailable
          feature="Watcher execution"
          detail="Scheduled fetching (Redis-backed queue + browser worker) lands in M2. Watchers are stored; jobs are not auto-discovered from them yet."
        />
      </section>
    </>
  );
}
