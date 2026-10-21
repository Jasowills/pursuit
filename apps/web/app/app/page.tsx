'use client';

import Link from 'next/link';
import { apiFetch, useResource } from '@/lib/api-client';
import type { Application, AgentRun, Watcher } from '@pursuit/shared';
import {
  PageHeader,
  Loading,
  ErrorBox,
  Empty,
  Unavailable,
  StatusPill,
  Stat,
  Card,
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

  const openApps = apps.data?.items ?? [];
  const activeRuns = (runs.data?.items ?? []).filter((r) => r.status === 'RUNNING').length;
  const unread = (notes.data?.items ?? []).filter((n) => !n.read_at).length;
  const enabledWatchers = (watchers.data?.items ?? []).filter((w) => w.enabled).length;

  return (
    <>
      <PageHeader
        title={`Welcome, ${profile.data.user.display_name}`}
        subtitle="Your job search at a glance. You approve anything that leaves the building."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Applications" value={openApps.length} hint="in your pipeline" />
        <Stat
          label="Agent runs"
          value={runs.data?.items.length ?? 0}
          hint={`${activeRuns} running`}
        />
        <Stat label="Active watchers" value={enabledWatchers} hint="checking periodically" />
        <Stat
          label="Unread alerts"
          value={unread}
          hint={unread > 0 ? 'action needed' : 'all caught up'}
        />
      </div>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent applications</h2>
          <Link
            href="/app/applications"
            className="text-sm text-[var(--muted-foreground)] underline hover:text-[var(--foreground)]"
          >
            View all
          </Link>
        </div>
        {apps.error ? (
          <ErrorBox error={apps.error} retry={apps.reload} />
        ) : apps.loading ? (
          <Loading />
        ) : openApps.length === 0 ? (
          <Empty>
            No applications yet — find a role under{' '}
            <Link href="/app/jobs" className="underline">
              Jobs
            </Link>
            .
          </Empty>
        ) : (
          <ul className="space-y-2">
            {openApps.slice(0, 5).map((a) => (
              <li key={a.id}>
                <Link
                  href={`/app/applications/${a.id}`}
                  className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-sm transition-colors duration-150 hover:bg-[var(--hover)]"
                >
                  <span className="min-w-0 truncate font-medium">
                    {a.job_title} ·{' '}
                    <span className="text-[var(--muted-foreground)]">{a.company_name}</span>
                  </span>
                  <StatusPill status={a.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Agent activity</h2>
          <Link
            href="/app/agent"
            className="text-sm text-[var(--muted-foreground)] underline hover:text-[var(--foreground)]"
          >
            Agent runs
          </Link>
        </div>
        {runs.error ? (
          <ErrorBox error={runs.error} retry={runs.reload} />
        ) : runs.loading ? (
          <Loading />
        ) : (runs.data?.items.length ?? 0) === 0 ? (
          <Empty>No agent runs yet.</Empty>
        ) : (
          <ul className="space-y-2">
            {(runs.data?.items ?? []).slice(0, 4).map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-sm"
              >
                <span className="min-w-0 truncate">{r.goal}</span>
                <StatusPill status={r.status} kind="neutral" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 space-y-2">
        <Unavailable
          feature="Outreach"
          detail="Drafting and sending contact messages is not implemented in this milestone. Nothing has been or will be emailed on your behalf."
        />
        <Unavailable
          feature="Gmail integration"
          detail="Gmail OAuth has not been provisioned. When it ships, the requested scope is shown before anything connects."
        />
        <Unavailable
          feature="Resume upload & tailoring"
          detail="The vault currently lists resume versions recorded by the API. Upload and AI tailoring land in a later phase."
        />
      </section>

      <Card className="mt-6 text-xs text-[var(--muted)]">
        Tenant <code className="font-mono">{profile.data.tenant_id.slice(0, 8)}…</code> · agent
        runtime label “dev” means the deterministic, model-free runtime — real model analysis
        requires an opt-in provider and is recorded as an open decision.
      </Card>
    </>
  );
}
