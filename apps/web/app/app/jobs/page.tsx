'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch, useResource } from '@/lib/api-client';
import type { Job, JobMatch } from '@pursuit/shared';
import {
  PageHeader,
  Loading,
  ErrorBox,
  Empty,
  StatusPill,
  Card,
  Field,
  inputClass,
} from '../_components/ui';

interface JobsResponse {
  items: { job: Job; match: JobMatch | null }[];
}
interface IntakeResponse {
  job: Job;
  match: JobMatch | null;
  deduped: boolean;
}

const EMPTY_FORM = {
  company_name: '',
  title: '',
  location: '',
  remote_restrictions: '',
  source_url: '',
  description: '',
  compensation: '',
};

export default function JobsPage() {
  const jobs = useResource<JobsResponse>('/jobs');
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<IntakeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiFetch<IntakeResponse>('/jobs', {
        method: 'POST',
        json: {
          company_name: form.company_name,
          title: form.title,
          source_url: form.source_url,
          location: form.location || undefined,
          remote_restrictions: form.remote_restrictions || undefined,
          description: form.description || undefined,
          compensation: form.compensation || undefined,
        },
      });
      setResult(res);
      setForm(EMPTY_FORM);
      jobs.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle="Paste a posting manually — intake dedupes it and runs eligibility scoring. Robotic watchers are CRUD-only until watcher execution ships."
      />

      <Card>
        <h2 className="text-sm font-semibold">Add a job manually</h2>
        <form onSubmit={submit} className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Company name">
            <input
              required
              maxLength={160}
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className={inputClass}
              placeholder="Acme Systems"
            />
          </Field>
          <Field label="Role title">
            <input
              required
              maxLength={220}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              placeholder="Senior Engineer"
            />
          </Field>
          <Field label="Posting URL" hint="Canonical posting link — used for dedupe.">
            <input
              required
              type="url"
              value={form.source_url}
              onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              className={inputClass}
              placeholder="https://jobs.acme.example/eng-123"
            />
          </Field>
          <Field label="Location">
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputClass}
              placeholder="Remote (worldwide)"
            />
          </Field>
          <Field label="Compensation">
            <input
              maxLength={200}
              value={form.compensation}
              onChange={(e) => setForm({ ...form, compensation: e.target.value })}
              className={inputClass}
              placeholder="$140,000 base"
            />
          </Field>
          <Field label="Remote restrictions">
            <input
              maxLength={200}
              value={form.remote_restrictions}
              onChange={(e) => setForm({ ...form, remote_restrictions: e.target.value })}
              className={inputClass}
              placeholder="Must be US-based"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description (optional)">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1.5 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--foreground)]"
                placeholder="Paste the posting text — used for eligibility signals."
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="h-10 min-h-[44px] rounded-[10px] bg-[var(--primary)] px-5 text-sm font-medium text-[color:var(--primary-foreground)] transition-colors duration-150 hover:bg-[#333] disabled:opacity-60"
            >
              {busy ? 'Adding…' : 'Add job'}
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
        {result && (
          <div className="mt-3 rounded-[var(--radius-md)] border border-[#d3f2de] bg-[#effcf3] p-3 text-sm text-[#18794e]">
            {result.deduped ? (
              <>
                Already in the system — deduped.{' '}
                <Link href={`/app/applications`} className="underline">
                  No duplicate was created.
                </Link>
              </>
            ) : (
              <>
                Job added.{' '}
                {result.match && (
                  <>
                    Eligibility verdict:{' '}
                    <strong>{result.match.eligibility.replaceAll('_', ' ').toLowerCase()}</strong>
                    {result.match.hard_failures.length > 0 && (
                      <> · hard failures: {result.match.hard_failures.join(', ')}</>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">Known jobs</h2>
        {jobs.error ? (
          <ErrorBox error={jobs.error} retry={jobs.reload} />
        ) : jobs.loading ? (
          <Loading />
        ) : (jobs.data?.items.length ?? 0) === 0 ? (
          <Empty>No jobs yet — add the first one above.</Empty>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {jobs.data?.items.map(({ job, match }) => (
              <li key={job.id}>
                <Card className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">{job.title}</h3>
                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                        {job.company_name}
                        {job.location ? ` · ${job.location}` : ''}
                      </p>
                    </div>
                    {match && <StatusPill status={match.eligibility} kind="eligibility" />}
                  </div>
                  {match && (
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                      Fit {match.fit_score} ·{' '}
                      {match.fit_rationale.slice(0, 90) || 'no rationale recorded'}
                    </p>
                  )}
                  {match?.hard_failures.length ? (
                    <p className="mt-1 font-mono text-[11px] text-[#a50e0e]">
                      {match.hard_failures.join(', ')}
                    </p>
                  ) : null}
                  <a
                    href={job.canonical_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 text-xs underline"
                  >
                    Open posting ↗
                  </a>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
