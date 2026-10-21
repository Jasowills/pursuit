'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { apiFetch, useResource, ApiError } from '@/lib/api-client';
import { ALLOWED_APPLICATION_TRANSITIONS } from '@pursuit/shared';
import type { ApplicationStatus, Application, ApplicationEventItem } from '@pursuit/shared';
import {
  PageHeader,
  Loading,
  ErrorBox,
  StatusPill,
  Card,
  Field,
  inputClass,
} from '../../_components/ui';

interface DetailResponse {
  application: Application;
  events: ApplicationEventItem[];
}

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const detail = useResource<DetailResponse>(id ? `/applications/${id}` : null);
  const [confirmationRef, setConfirmationRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const app = detail.data?.application;
  const legalTargets: ApplicationStatus[] = app
    ? ([...(ALLOWED_APPLICATION_TRANSITIONS[app.status] ?? [])] as ApplicationStatus[])
    : [];

  async function transition(to: ApplicationStatus) {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch<DetailResponse>(`/applications/${id}/status`, {
        method: 'PATCH',
        json: {
          to_status: to,
          reason: `via web dashboard`,
          ...(to === 'SUBMITTED' ? { confirmation_ref: confirmationRef } : {}),
        },
      });
      setConfirmationRef('');
      detail.reload();
    } catch (err) {
      if (err instanceof ApiError) {
        const detailMsg = (err.body['detail'] as string | undefined) ?? '';
        setError(`${err.message}${detailMsg ? ` — ${detailMsg}` : ''}`);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setBusy(false);
    }
  }

  if (detail.error) return <ErrorBox error={detail.error} retry={detail.reload} />;
  if (detail.loading || !detail.data || !app) return <Loading />;

  return (
    <>
      <Link
        href="/app/applications"
        className="text-sm text-[var(--muted-foreground)] underline hover:text-[var(--foreground)]"
      >
        ← Applications
      </Link>
      <PageHeader
        title={`${app.job_title || 'Job'} — ${app.company_name || 'company'}`}
        subtitle={id}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">State</h2>
            <StatusPill status={app.status} />
          </div>
          {app.submitted_at && (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Submitted {new Date(app.submitted_at).toLocaleString()} · confirmation:{' '}
              <code className="font-mono">{app.confirmation_ref}</code>
            </p>
          )}
          {app.source_url && (
            <a
              href={app.source_url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 block text-xs underline"
            >
              Open posting ↗
            </a>
          )}

          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Legal transitions
          </h3>
          {legalTargets.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Terminal state — no further transitions.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {legalTargets.map((to) => (
                <div key={to} className="flex items-center gap-2">
                  <button
                    onClick={() => transition(to)}
                    disabled={busy}
                    className="h-9 min-h-[44px] flex-1 rounded-[10px] border border-[var(--border)] px-3 text-left text-sm transition-colors duration-150 hover:bg-[var(--hover)] disabled:opacity-60"
                  >
                    → {to.replaceAll('_', ' ').toLowerCase()}
                  </button>
                </div>
              ))}
              {legalTargets.includes('SUBMITTED') && (
                <Field
                  label="Confirmation reference (required for SUBMITTED)"
                  hint="Paste the real confirmation ID/email reference from the application site. Fabricated submissions are rejected."
                >
                  <input
                    value={confirmationRef}
                    onChange={(e) => setConfirmationRef(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. confirmation email ID"
                  />
                </Field>
              )}
            </div>
          )}
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-[var(--radius-md)] border border-[#f4c7c3] bg-[#fdf3f2] px-3 py-2 text-sm text-[#a50e0e]"
            >
              {error}
            </p>
          )}
          {busy && <p className="mt-2 text-xs text-[var(--muted)]">Applying transition…</p>}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold">Timeline</h2>
          <ol className="mt-3 space-y-3">
            {detail.data.events.map((ev) => (
              <li key={ev.id} className="border-l-2 border-[var(--border)] pl-3 text-sm">
                <p className="font-medium">
                  {ev.from_status ? `${ev.from_status} → ` : ''}
                  {ev.to_status}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {new Date(ev.created_at).toLocaleString()} · {ev.actor}
                  {ev.reason ? ` · ${ev.reason}` : ''}
                </p>
                {ev.evidence_key && (
                  <p className="font-mono text-[11px] text-[var(--muted-foreground)]">
                    evidence: {ev.evidence_key}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
