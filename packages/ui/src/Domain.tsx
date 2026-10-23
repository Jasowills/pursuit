import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { Skeleton, StatusIndicator } from './Primitives';
import type {
  AgentRun,
  Approval,
  Job,
  JobMatch,
  Notification,
  ResumeVersion,
  Watcher,
} from '@pursuit/shared';
import type { ApplicationEventItem } from '@pursuit/shared';

export type { ApplicationEventItem };

/* JobCard ------------------------------------------------------------------ */

export function JobCard({
  job,
  match,
  onOpen,
  onSave,
}: {
  job: Job;
  match?: JobMatch | null;
  onOpen?: () => void;
  onSave?: () => void;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">
            {job.company_name}
          </p>
          <h4 className="mt-0.5 text-base font-semibold">{job.title}</h4>
        </div>
        <StatusIndicator
          record={match ? { eligibility: match.eligibility as never } : { status: 'UNKNOWN' }}
        />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-[color:var(--muted-foreground)]">
        <dt className="font-medium">Location</dt>
        <dd>{job.location ?? '—'}</dd>
        <dt className="font-medium">Remote</dt>
        <dd>{job.remote_restrictions ?? '—'}</dd>
        <dt className="font-medium">Compensation</dt>
        <dd>{job.compensation ?? 'Not disclosed'}</dd>
      </dl>
      {match ? (
        <p className="font-mono text-xs text-[color:var(--muted)]">
          fit {match.fit_score}/100 — {match.fit_rationale}
          {match.hard_failures.length > 0
            ? ` | hard failures: ${match.hard_failures.join('; ')}`
            : ''}
        </p>
      ) : null}
      <div className="mt-1 flex gap-2">
        {onOpen ? (
          <Button size="sm" variant="secondary" onClick={onOpen}>
            View
          </Button>
        ) : null}
        {onSave ? (
          <Button size="sm" variant="outline" onClick={onSave}>
            Save
          </Button>
        ) : null}
        <a
          href={job.source_url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex min-h-[44px] items-center px-2 text-sm text-[color:var(--muted-foreground)] underline underline-offset-2"
        >
          Source link
        </a>
      </div>
    </Card>
  );
}

/* ApplicationTimeline ------------------------------------------------------ */

export function ApplicationTimeline({
  application,
  events,
}: {
  application: { id: string; status: string; submitted_confirmation?: string | null };
  events: ApplicationEventItem[];
}) {
  return (
    <Card>
      <p className="font-mono text-xs text-[color:var(--muted)]">application {application.id}</p>
      <div className="mt-3">
        <StatusIndicator record={{ status: application.status }} />
      </div>
      {application.status !== 'SUBMITTED' ? (
        <p className="mt-2 text-sm text-[color:var(--warning)]">
          Not yet submitted. Final submission always requires your approval of the exact payload.
        </p>
      ) : null}
      <ol className="mt-4 space-y-3">
        {events.length === 0 ? (
          <li className="text-sm text-[color:var(--muted)]">No recorded events yet.</li>
        ) : null}
        {events.map((e) => (
          <li key={e.id} className="border-l-2 border-[var(--border)] pl-3">
            <p className="text-sm font-medium">
              {e.from_status ? `${e.from_status} → ${e.to_status}` : e.to_status}
            </p>
            <p className="font-mono text-xs text-[color:var(--muted)]">
              {e.created_at} · actor {e.actor}
              {e.evidence_key ? ` · evidence ${e.evidence_key}` : ''}
            </p>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ApprovalCard ------------------------------------------------------------- */

export function ApprovalCard({
  approval,
  onApprove,
  onReject,
  busy,
}: {
  approval: Approval;
  onApprove: () => void;
  onReject: () => void;
  busy?: boolean;
}) {
  const p = approval.preview;
  return (
    <Card className="border-2 border-[var(--foreground)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{approval.action_type.replace(/_/g, ' ')}</p>
        <Badge
          tone={
            approval.status === 'PENDING'
              ? 'warning'
              : approval.status === 'APPROVED'
                ? 'success'
                : 'neutral'
          }
        >
          {approval.status.toLowerCase().replace(/_/g, ' ')}
        </Badge>
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="font-medium">Destination</dt>
        <dd className="font-mono break-all">{p.destination}</dd>
        {p.recipient ? (
          <>
            <dt className="font-medium">Recipient</dt>
            <dd>{p.recipient}</dd>
          </>
        ) : null}
        <dt className="font-medium">Summary</dt>
        <dd>{p.summary}</dd>
        {p.attachments.length > 0 ? (
          <>
            <dt className="font-medium">Attachments</dt>
            <dd>{p.attachments.join(', ')}</dd>
          </>
        ) : null}
        <dt className="font-medium">Payload hash</dt>
        <dd className="font-mono text-xs">{p.payload_hash}</dd>
        <dt className="font-medium">Approval expires</dt>
        <dd>{new Date(approval.expires_at).toLocaleString()}</dd>
      </dl>
      {approval.status === 'PENDING' ? (
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="destructive" onClick={onReject} disabled={busy}>
            Reject
          </Button>
          <Button size="sm" loading={busy} onClick={onApprove}>
            Approve exact payload
          </Button>
        </div>
      ) : null}
      <p className="mt-3 text-xs text-[color:var(--muted)]">
        Approval is single-use and binds the exact payload above. Any modification invalidates it.
      </p>
    </Card>
  );
}

/* WatcherCard -------------------------------------------------------------- */

export function WatcherCard({ watcher, onToggle }: { watcher: Watcher; onToggle?: () => void }) {
  const tone = !watcher.enabled ? 'neutral' : watcher.error_streak > 0 ? 'warning' : 'success';
  const state = !watcher.enabled
    ? 'Paused'
    : watcher.error_streak > 0
      ? `Error streak ×${watcher.error_streak}`
      : 'Healthy';
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Badge tone={tone as 'neutral' | 'warning' | 'success'}>{state}</Badge>
        <span className="font-mono text-xs text-[color:var(--muted)]">
          {watcher.kind.toLowerCase().replace(/_/g, ' ')}
        </span>
      </div>
      <p className="font-mono text-xs break-all text-[color:var(--muted-foreground)]">
        {watcher.source_url}
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="font-medium">Every</dt>
        <dd>{watcher.frequency_minutes} min</dd>
        <dt className="font-medium">Last check</dt>
        <dd>
          {watcher.last_checked_at ? new Date(watcher.last_checked_at).toLocaleString() : 'never'}
        </dd>
        <dt className="font-medium">Next check</dt>
        <dd>{watcher.next_check_at ? new Date(watcher.next_check_at).toLocaleString() : '—'}</dd>
      </dl>
      {onToggle ? (
        <div className="mt-1">
          <Button size="sm" variant="outline" onClick={onToggle}>
            {watcher.enabled ? 'Pause' : 'Resume'}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

/* ResumeVersionCard -------------------------------------------------------- */

export function ResumeVersionCard({
  version,
  onDownload,
}: {
  version: ResumeVersion;
  onDownload?: () => void;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Badge tone={version.status === 'APPROVED' ? 'success' : 'neutral'}>
          {version.status.toLowerCase().replace(/_/g, ' ')}
        </Badge>
        <span className="font-mono text-xs text-[color:var(--muted)]">
          {version.template_version}
        </span>
      </div>
      <p className="text-sm font-medium">{version.label}</p>
      <p className="text-xs text-[color:var(--muted)]">
        Created {new Date(version.created_at).toLocaleString()}
        {version.is_submitted ? ' · submitted for an application' : ''}
      </p>
      {onDownload ? (
        <div>
          <Button size="sm" variant="outline" onClick={onDownload}>
            Download
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

/* AgentRunTimeline --------------------------------------------------------- */

export function AgentRunTimeline({ run }: { run: AgentRun }) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Badge>{run.status.toLowerCase().replace(/_/g, ' ')}</Badge>
        <span className="font-mono text-xs text-[color:var(--muted)]">runtime: {run.runtime}</span>
      </div>
      <p className="text-sm">{run.goal}</p>
      {run.steps.length === 0 ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <ol className="mt-1 space-y-2">
          {run.steps.map((s, i) => (
            <li key={`${s.id ?? i}`} className="border-l-2 border-[var(--border)] pl-3">
              <p className="font-mono text-xs font-medium">{s.tool}</p>
              <p className="font-mono text-[11px] text-[color:var(--muted)] break-all">
                {s.arguments_redacted}
              </p>
              <p className="text-xs">
                {s.status === 'BLOCKED_BY_POLICY' ? (
                  <Badge tone="warning">blocked by policy</Badge>
                ) : s.status === 'SUCCEEDED' ? (
                  <Badge tone="success">{s.result_ref ?? 'succeeded'}</Badge>
                ) : (
                  <Badge>{s.status.toLowerCase()}</Badge>
                )}
              </p>
            </li>
          ))}
        </ol>
      )}
      {run.usage ? (
        <p className="font-mono text-xs text-[color:var(--muted)]">
          tokens in {run.usage.input} / out {run.usage.output} · cost {run.usage.cost}
        </p>
      ) : null}
    </Card>
  );
}

/* NotificationItem --------------------------------------------------------- */

export function NotificationItem({
  notification,
  onOpen,
}: {
  notification: Notification;
  onOpen?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--border)] p-4 text-left transition-colors duration-150 hover:bg-[var(--hover)] min-h-[44px] ${
        notification.read_at ? '' : 'border-[var(--foreground)] bg-[var(--surface)]'
      }`}
    >
      <span className="text-sm font-medium">{notification.title}</span>
      <span className="text-sm text-[color:var(--muted)]">{notification.body}</span>
      <span className="font-mono text-[11px] text-[color:var(--muted)]">
        {notification.created_at}
      </span>
    </button>
  );
}
