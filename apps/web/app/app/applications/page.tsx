'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiFetch, useResource } from '@/lib/api-client';
import type { Application, Job } from '@pursuit/shared';
import { PageHeader, Loading, ErrorBox, Empty, StatusPill } from '../_components/ui';

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
        eyebrow="Section 03 / Applications"
        title="Applications"
        subtitle="Every application is a durable state machine — transitions are legal, auditable, and SUBMITTED always carries confirmation evidence."
      />

      <section>
        <div className="flex items-end justify-between gap-4 border-b border-[var(--ink)] pb-2">
          <h2 className="panel-title">Your records</h2>
          <span className="mono-meta">{apps.data?.items.length ?? 0} files</span>
        </div>

        {apps.error ? (
          <div className="mt-4">
            <ErrorBox error={apps.error} retry={apps.reload} />
          </div>
        ) : apps.loading ? (
          <Loading />
        ) : (apps.data?.items.length ?? 0) === 0 ? (
          <Empty>No applications yet. Start one from a job below.</Empty>
        ) : (
          <ul>
            {apps.data?.items.map((a, index) => (
              <li key={a.id}>
                <Link href={`/app/applications/${a.id}`} className="case-row">
                  <span className="flex min-w-0 items-start gap-4">
                    <span className="index-num pt-1">{String(index + 1).padStart(2, '0')}</span>
                    <span className="min-w-0">
                      <span className="case-row-title">
                        {a.job_title} ·{' '}
                        <span className="font-normal text-[color:var(--muted-foreground)]">
                          {a.company_name}
                        </span>
                      </span>
                      <span className="case-row-meta">
                        updated {new Date(a.updated_at).toLocaleString()}
                      </span>
                    </span>
                  </span>
                  <StatusPill status={a.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--ink)] pb-2">
          <h2 className="panel-title">Start an application</h2>
          <span className="mono-meta">Jobs without a file</span>
        </div>

        {jobs.error ? (
          <div className="mt-4">
            <ErrorBox error={jobs.error} retry={jobs.reload} />
          </div>
        ) : jobs.loading ? (
          <Loading />
        ) : unapplied.length === 0 ? (
          <Empty>
            Every known job already has an application (or none exist yet) — add jobs under{' '}
            <Link href="/app/jobs" className="link-underline">
              Jobs
            </Link>
            .
          </Empty>
        ) : (
          <>
            {error && (
              <div role="alert" className="notice notice-danger mt-4">
                <span className="notice-label">Could not start application</span>
                <p className="text-[13px] leading-relaxed text-[color:var(--ink-soft)]">{error}</p>
              </div>
            )}
            <ul className="mt-1">
              {unapplied.map(({ job, match }) => (
                <li key={job.id} className="case-row">
                  <span className="min-w-0">
                    <span className="case-row-title">
                      {job.title} ·{' '}
                      <span className="font-normal text-[color:var(--muted-foreground)]">
                        {job.company_name}
                      </span>
                    </span>
                    <span className="case-row-meta">
                      {match
                        ? `${match.eligibility.replaceAll('_', ' ')} · fit ${match.fit_score}/100`
                        : 'No eligibility analysis recorded'}
                    </span>
                  </span>
                  <button
                    onClick={() => createFor(job.id)}
                    disabled={busyId === job.id}
                    className="btn btn-outline btn-sm shrink-0"
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
