'use client';

import Link from 'next/link';
import { WorkspaceIcon } from './_components/shell';
import { useResource } from '@/lib/api-client';
import type { Application, AgentRun, Watcher } from '@pursuit/shared';
import {
  PageHeader,
  Loading,
  ErrorBox,
  Empty,
  Unavailable,
  StatusPill,
  Stat,
} from './_components/ui';

interface ProfileResponse {
  user: { id: string; email: string; display_name: string };
  tenant_id: string;
  profile: { id: string; location: string | null; role_families: string[] };
}
interface AppsResponse {
  items: Pick<Application, 'id' | 'job_title' | 'company_name' | 'status' | 'updated_at'>[];
}
interface RunsResponse {
  items: Pick<AgentRun, 'id' | 'goal' | 'status' | 'runtime' | 'created_at'>[];
}
interface WatchersResponse {
  items: Watcher[];
}
interface NotesResponse {
  items: { id: string; title: string; body: string; read_at: string | null; created_at: string }[];
}

export default function OverviewPage() {
  const profile = useResource<ProfileResponse>('/profile');
  const apps = useResource<AppsResponse>('/applications');
  const runs = useResource<RunsResponse>('/agent/runs');
  const watchers = useResource<WatchersResponse>('/watchers');
  const notes = useResource<NotesResponse>('/notifications');
  if (profile.error) return <ErrorBox error={profile.error} retry={profile.reload} />;
  if (profile.loading || !profile.data) return <Loading />;
  const applications = apps.data?.items ?? [];
  const unread = (notes.data?.items ?? []).filter((n) => !n.read_at).length;
  const stages = [
    {
      label: 'Getting started',
      color: '#b9b1e9',
      count: applications.filter((a) => ['DISCOVERED', 'VERIFIED', 'QUALIFIED'].includes(a.status))
        .length,
    },
    {
      label: 'Preparing & reviewing',
      color: '#8c7ed9',
      count: applications.filter((a) =>
        ['DRAFTING', 'READY_FOR_REVIEW', 'APPROVED', 'APPLYING'].includes(a.status),
      ).length,
    },
    {
      label: 'Submitted',
      color: '#6cbaa0',
      count: applications.filter((a) => a.status === 'SUBMITTED').length,
    },
    {
      label: 'Other statuses',
      color: '#d4d4dc',
      count: applications.filter(
        (a) =>
          ![
            'DISCOVERED',
            'VERIFIED',
            'QUALIFIED',
            'DRAFTING',
            'READY_FOR_REVIEW',
            'APPROVED',
            'APPLYING',
            'SUBMITTED',
          ].includes(a.status),
      ).length,
    },
  ];
  return (
    <>
      <div className="overview-heading">
        <PageHeader
          title="Overview"
          subtitle={`Welcome back, ${profile.data.user.display_name}. Here's where your search stands.`}
        />
        <span className="overview-date">
          {new Date().toLocaleDateString(undefined, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>
      <div className="stat-strip">
        <Stat
          label="Total applications"
          value={apps.loading || apps.error ? '—' : applications.length}
          hint="Across your pipeline"
        />
        <Stat
          label="Submitted"
          value={apps.loading || apps.error ? '—' : (stages[2]?.count ?? 0)}
          hint="Confirmed application records"
        />
        <Stat
          label="Agent runs"
          value={runs.loading || runs.error ? '—' : (runs.data?.items.length ?? 0)}
          hint="Proposals and run history"
        />
        <Stat
          label="Unread notifications"
          value={notes.loading || notes.error ? '—' : unread}
          hint="Updates to review"
        />
      </div>
      <div className="overview-grid">
        <section className="overview-panel">
          <div className="overview-panel-head">
            <h2>Recent applications</h2>
            <Link href="/app/applications">View applications ↗</Link>
          </div>
          {apps.error ? (
            <ErrorBox error={apps.error} retry={apps.reload} />
          ) : apps.loading ? (
            <Loading />
          ) : !applications.length ? (
            <Empty>
              Your pipeline starts with a role.{' '}
              <Link href="/app/jobs" className="link-underline">
                Browse opportunities
              </Link>
              .
            </Empty>
          ) : (
            <ul>
              {applications.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <Link href={`/app/applications/${a.id}`} className="case-row">
                    <span>
                      <span className="case-row-title">{a.job_title}</span>
                      <span className="case-row-meta">
                        {a.company_name} · Updated {new Date(a.updated_at).toLocaleDateString()}
                      </span>
                    </span>
                    <StatusPill status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="overview-panel">
          <div className="overview-panel-head">
            <h2>Application pipeline</h2>
            <span className="text-[10px] text-[var(--muted)]">
              {apps.loading || apps.error ? '—' : applications.length} total
            </span>
          </div>
          {apps.error ? (
            <ErrorBox error={apps.error} retry={apps.reload} />
          ) : apps.loading ? (
            <Loading />
          ) : (
            <>
              <div className="overview-pipeline" aria-hidden="true">
                {stages
                  .filter((s) => s.count > 0)
                  .map((s) => (
                    <span key={s.label} style={{ flex: s.count, background: s.color }} />
                  ))}
              </div>
              {stages.map((s) => (
                <div className="overview-stage" key={s.label}>
                  <i style={{ background: s.color }} />
                  {s.label}
                  <strong>{s.count}</strong>
                </div>
              ))}
              <div className="h-4" />
            </>
          )}
        </section>
      </div>
      <div className="overview-shortcuts">
        {(
          [
            ['jobs', 'Find your next role', 'Add a posting and review your fit.', '/app/jobs'],
            [
              'workflow',
              'Prepare your application',
              'Work through your next opportunity.',
              '/app/workflow',
            ],
            [
              'settings',
              'Connect your tools',
              'Bring your model and Gmail account.',
              '/app/settings',
            ],
          ] as const
        ).map(([icon, title, body, href]) => (
          <Link key={href} href={href}>
            <WorkspaceIcon name={icon} />
            <div>
              <strong>{title}</strong>
              <span>{body}</span>
            </div>
          </Link>
        ))}
      </div>
      <section className="overview-panel mt-6">
        <div className="overview-panel-head">
          <h2>Recent agent activity</h2>
          <Link href="/app/agent">View run history ↗</Link>
        </div>
        {runs.error ? (
          <ErrorBox error={runs.error} retry={runs.reload} />
        ) : runs.loading ? (
          <Loading />
        ) : !runs.data?.items.length ? (
          <Empty>
            No runs yet. Start a proposal from{' '}
            <Link href="/app/agent" className="link-underline">
              Agent activity
            </Link>
            .
          </Empty>
        ) : (
          <ul>
            {runs.data.items.slice(0, 3).map((r) => (
              <li key={r.id} className="case-row">
                <span>
                  <span className="case-row-title">{r.goal}</span>
                  <span className="case-row-meta">
                    {new Date(r.created_at).toLocaleString()} · {r.runtime} runtime
                  </span>
                </span>
                <StatusPill status={r.status} kind="neutral" />
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="overview-footnote">
        You review every external action. Model preparation requires a tested connection. Browser
        submissions, PDF/DOCX support, and scheduled watcher execution are still in development.{' '}
        {watchers.error
          ? 'Watcher status is unavailable.'
          : `${(watchers.data?.items ?? []).filter((w) => w.enabled).length} watchers enabled for configuration.`}
      </p>
    </>
  );
}
