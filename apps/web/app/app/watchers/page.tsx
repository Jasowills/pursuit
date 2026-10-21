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
        title="Watchers"
        subtitle="Watch company career pages and search URLs for new or reopened roles."
      />

      <Card className="border-[#f5e3c2] bg-[#fdf6ec]">
        <p className="text-sm text-[#8a5a00]">
          <strong>Honest status:</strong> watchers are stored and can be toggled, but checking is
          not scheduled yet — no robotic execution runs in this milestone, so nothing has been
          fetched from these URLs automatically. Manual job intake covers discovery for now.
        </p>
      </Card>

      <Card className="mt-4">
        <h2 className="text-sm font-semibold">New watcher</h2>
        <form onSubmit={create} className="mt-3 grid gap-3 md:grid-cols-2">
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
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="h-10 min-h-[44px] rounded-[10px] bg-[var(--primary)] px-5 text-sm font-medium text-[color:var(--primary-foreground)] transition-colors duration-150 hover:bg-[#333] disabled:opacity-60"
            >
              {busy ? 'Adding…' : 'Add watcher'}
            </button>
          </div>
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
        <h2 className="mb-2 text-sm font-semibold">Your watchers</h2>
        {watchers.error ? (
          <ErrorBox error={watchers.error} retry={watchers.reload} />
        ) : watchers.loading ? (
          <Loading />
        ) : (watchers.data?.items.length ?? 0) === 0 ? (
          <Empty>No watchers yet.</Empty>
        ) : (
          <ul className="space-y-2">
            {watchers.data?.items.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{w.source_url}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {w.kind === 'COMPANY_URL'
                      ? 'company page'
                      : `keywords: ${w.keywords.join(', ') || 'none'}`}{' '}
                    · every {w.frequency_minutes} min
                    {w.error_streak > 0 ? ` · ${w.error_streak} errors` : ''}
                  </span>
                </span>
                <button
                  onClick={() => toggle(w)}
                  className={`h-9 min-h-[44px] shrink-0 rounded-[10px] border px-3 text-xs font-medium transition-colors duration-150 ${
                    w.enabled
                      ? 'border-[#d3f2de] bg-[#effcf3] text-[#18794e] hover:bg-[#e2f7ea]'
                      : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--hover)]'
                  }`}
                >
                  {w.enabled ? 'Enabled — disable' : 'Disabled — enable'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <Unavailable
          feature="Watcher execution"
          detail="Scheduled fetching (Redis-backed queue + browser worker) lands in M2. Watchers are stored; jobs are not auto-discovered from them yet."
        />
      </section>
    </>
  );
}
