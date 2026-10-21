'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiFetch, useResource } from '@/lib/api-client';
import type { Application, Job } from '@pursuit/shared';
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

interface AppsResponse {
  items: Application[];
}
interface JobsResponse {
  items: { job: Job; match: JobMatchLite | null }[];
}
interface JobMatchLite {
  eligibility: string;
  fit_score: number;
}

export default function ApplicationsPage() {
  const apps = useResource<AppsResponse>('/applications');
  const jobs = useResource<JobsResponse>('/jobs');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createFor(jobId: string) {
    setBusyId(jobId);
    setError(null);
    try {
      const res = await apiFetch<{ application: Application }>('/applications', {
        method: 'POST',
        json: { job_id: jobId },
      });
      window.location.href = `/app/applications/${res.application.id}`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        msg.toLowerCase().includes('application_exists')
          ? 'Application already exists for this job.'
          : msg,
      );
    } finally {
      setBusyId(null);
    }
  }

  const unapplied = (jobs.data?.items ?? []).filter(
    (j) => !(apps.data?.items ?? []).some((a) => a.job_id === j.job.id),
  );

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle="Every application is a durable state machine — transitions are legal, auditable, and SUBMITTED always carries confirmation evidence."
      />

      {apps.error ? (
        <ErrorBox error={apps.error} retry={apps.reload} />
      ) : apps.loading ? (
        <Loading />
      ) : (apps.data?.items.length ?? 0) === 0 ? (
        <Empty>No applications yet. Start one from a job below.</Empty>
      ) : (
        <ul className="space-y-2">
          {apps.data?.items.map((a) => (
            <li key={a.id}>
              <Link
                href={`/app/applications/${a.id}`}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-sm transition-colors duration-150 hover:bg-[var(--hover)]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {a.job_title} ·{' '}
                    <span className="text-[var(--muted-foreground)]">{a.company_name}</span>
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    updated {new Date(a.updated_at).toLocaleString()}
                  </span>
                </span>
                <StatusPill status={a.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold">Start an application</h2>
        {jobs.error ? (
          <ErrorBox error={jobs.error} retry={jobs.reload} />
        ) : jobs.loading ? (
          <Loading />
        ) : unapplied.length === 0 ? (
          <Empty>
            Every known job already has an application (or none exist yet) — add jobs under{' '}
            <Link href="/app/jobs" className="underline">
              Jobs
            </Link>
            .
          </Empty>
        ) : (
          <>
            {error && (
              <p
                role="alert"
                className="mb-2 rounded-[var(--radius-md)] border border-[#f4c7c3] bg-[#fdf3f2] px-3 py-2 text-sm text-[#a50e0e]"
              >
                {error}
              </p>
            )}
            <ul className="space-y-2">
              {unapplied.map(({ job }) => (
                <li
                  key={job.id}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {job.title} ·{' '}
                    <span className="text-[var(--muted-foreground)]">{job.company_name}</span>
                  </span>
                  <button
                    onClick={() => createFor(job.id)}
                    disabled={busyId === job.id}
                    className="h-9 min-h-[44px] shrink-0 rounded-[10px] bg-[var(--primary)] px-3 text-xs font-medium text-[color:var(--primary-foreground)] transition-colors duration-150 hover:bg-[#333] disabled:opacity-60"
                  >
                    {busyId === job.id ? 'Creating…' : 'Start application'}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
