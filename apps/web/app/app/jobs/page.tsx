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
        eyebrow="Section 02 / Jobs"
        title="Opportunities"
        subtitle="Keep your roles in one place. Add a posting to review your fit and eligibility."
      />

      <details className="mb-8">
        <summary className="btn btn-outline w-fit">Add a posting</summary>
        <Card className="mt-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="panel-heading mt-1">Add a posting.</h2>
            </div>
            <span className="stamp stamp-muted">Manual only</span>
          </div>

          <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
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
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input"
                  placeholder="Paste the posting text — used for eligibility signals."
                />
              </Field>
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={busy} className="btn btn-primary btn-arrow">
                {busy ? 'Adding…' : 'Add job'}
              </button>
              <span className="mono-meta">Dedupe runs before a record is created.</span>
            </div>
          </form>

          {error && (
            <div role="alert" className="notice notice-danger mt-5">
              <span className="notice-label">Intake failed</span>
              <p className="text-[11px] leading-relaxed text-[color:var(--ink-soft)]">{error}</p>
            </div>
          )}

          {result && (
            <div className="notice notice-success mt-5">
              <span className="notice-label">
                {result.deduped ? 'Record deduped' : 'Record added'}
              </span>
              {result.deduped ? (
                <p className="text-[11px] leading-relaxed text-[color:var(--ink-soft)]">
                  Already in the system. No duplicate was created.{' '}
                  <Link href="/app/applications" className="link-underline font-medium">
                    Go to applications
                  </Link>
                </p>
              ) : (
                <p className="text-[11px] leading-relaxed text-[color:var(--ink-soft)]">
                  Job added.{' '}
                  {result.match && (
                    <>
                      Eligibility verdict:{' '}
                      <strong className="font-semibold">
                        {result.match.eligibility.replaceAll('_', ' ').toLowerCase()}
                      </strong>
                      {result.match.hard_failures.length > 0 && (
                        <>
                          {' '}
                          · hard failures:{' '}
                          {result.match.hard_failures
                            .map((reason) => reason.replaceAll('_', ' ').replaceAll(':', ': '))
                            .join(' · ')}
                        </>
                      )}
                    </>
                  )}
                </p>
              )}
            </div>
          )}
        </Card>
      </details>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--border)] pb-4">
          <h2 className="panel-title">Known jobs</h2>
          <span className="mono-meta">{jobs.data?.items.length ?? 0} records</span>
        </div>

        {jobs.error ? (
          <div className="mt-4">
            <ErrorBox error={jobs.error} retry={jobs.reload} />
          </div>
        ) : jobs.loading ? (
          <Loading />
        ) : (jobs.data?.items.length ?? 0) === 0 ? (
          <Empty>No jobs yet — add the first one above.</Empty>
        ) : (
          <div>
            {jobs.data?.items.map(({ job, match }, index) => (
              <article
                key={job.id}
                className="job-workspace-row grid gap-4 border-b border-[var(--border)] py-5 md:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex items-start gap-4">
                    <span className="index-num pt-1">{String(index + 1).padStart(2, '0')}</span>
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-semibold leading-tight tracking-[-0.015em]">
                        {job.title}
                      </h3>
                      <p className="mono-meta mt-1">
                        {job.company_name}
                        {job.location ? ` · ${job.location}` : ''}
                      </p>
                    </div>
                  </div>
                  {match && (
                    <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--muted-foreground)] md:pl-8">
                      Fit {match.fit_score}/100 ·{' '}
                      {match.fit_rationale.slice(0, 120) || 'no rationale recorded'}
                    </p>
                  )}
                  {match?.hard_failures.length ? (
                    <p className="mt-1 font-mono text-[10px] text-[color:var(--danger)] md:pl-8">
                      {match.hard_failures
                        .map((reason) => reason.replaceAll('_', ' ').replaceAll(':', ': '))
                        .join(' · ')}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-row items-center gap-4 md:flex-col md:items-end">
                  {match && <StatusPill status={match.eligibility} kind="eligibility" />}
                  <a
                    href={job.canonical_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-underline text-[11px] font-medium"
                  >
                    Open posting ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
