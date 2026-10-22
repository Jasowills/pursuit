'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { apiFetch, useResource, ApiError } from '@/lib/api-client';
import { ALLOWED_APPLICATION_TRANSITIONS } from '@pursuit/shared';
import type { ApplicationStatus, Application, ApplicationEventItem } from '@pursuit/shared';
import { PageHeader, Loading, ErrorBox, StatusPill, Card, Field, inputClass } from '../../_components/ui';

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
        className="link-underline inline-flex min-h-[44px] items-center text-[12px] font-medium text-[color:var(--muted-foreground)]"
      >
        ← Applications
      </Link>

      <PageHeader
        eyebrow={`Case file / ${app.company_name || 'Company'}`}
        title={app.job_title || 'Application'}
        subtitle={`Record ${id}`}
      />

      <div className="grid items-start gap-6 md:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <p className="panel-title">Current state</p>
              <p className="mt-2 font-serif text-[30px] leading-none tracking-[-0.03em]">
                {app.status.replaceAll('_', ' ')}
              </p>
            </div>
            <StatusPill status={app.status} />
          </div>

          {app.submitted_at && (
            <div className="border-b border-[var(--border)] py-3">
              <p className="eyebrow">Submitted</p>
              <p className="mt-1 text-[12px] text-[color:var(--muted-foreground)]">
                {new Date(app.submitted_at).toLocaleString()} · confirmation{' '}
                <code className="font-mono text-[11px] text-[color:var(--ink)]">{app.confirmation_ref}</code>
              </p>
            </div>
          )}

          {app.source_url && (
            <a
              href={app.source_url}
              target="_blank"
              rel="noreferrer noopener"
              className="link-underline mt-4 inline-block text-[12px] font-medium"
            >
              Open posting ↗
            </a>
          )}

          <h3 className="label mt-6">Legal transitions</h3>
          {legalTargets.length === 0 ? (
            <p className="text-[13px] leading-relaxed text-[color:var(--muted-foreground)]">
              Terminal state — no further transitions.
            </p>
          ) : (
            <div className="border-t border-[var(--border)]">
              {legalTargets.map((to) => (
                <button
                  key={to}
                  onClick={() => transition(to)}
                  disabled={busy}
                  className="case-row case-row-hover w-full text-left disabled:opacity-50"
                >
                  <span className="text-[13px] font-medium">
                    → {to.replaceAll('_', ' ').toLowerCase()}
                  </span>
                  <span className="mono-meta">advance</span>
                </button>
              ))}
            </div>
          )}

          {legalTargets.includes('SUBMITTED') && (
            <div className="mt-4">
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
            </div>
          )}

          {error && (
            <div role="alert" className="notice notice-danger mt-4">
              <span className="notice-label">Transition rejected</span>
              <p className="text-[13px] leading-relaxed text-[color:var(--ink-soft)]">{error}</p>
            </div>
          )}

          {busy && <p className="mono-meta mt-3">Applying transition…</p>}
        </Card>

        <Card>
          <div className="flex items-end justify-between gap-4 border-b border-[var(--border)] pb-3">
            <h2 className="panel-title">Timeline</h2>
            <span className="mono-meta">{detail.data.events.length} events</span>
          </div>
          <ol className="mt-4">
            {detail.data.events.length === 0 ? (
              <li className="text-[13px] text-[color:var(--muted-foreground)]">No recorded events.</li>
            ) : (
              detail.data.events.map((ev) => (
                <li
                  key={ev.id}
                  className="relative border-l border-[var(--border)] pb-5 pl-5 last:pb-0"
                >
                  <span
                    aria-hidden
                    className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 bg-[var(--signal)]"
                  />
                  <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-[color:var(--muted)]">
                    {new Date(ev.created_at).toLocaleString()}
                  </p>
                  <p className="mt-1 font-serif text-[19px] leading-tight tracking-[-0.02em]">
                    {ev.from_status ? `${ev.from_status} → ` : ''}
                    {ev.to_status}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--muted-foreground)]">
                    Actor: {ev.actor}
                    {ev.reason ? ` · ${ev.reason}` : ''}
                  </p>
                  {ev.evidence_key && (
                    <p className="mt-1 break-all font-mono text-[10px] text-[color:var(--muted)]">
                      evidence: {ev.evidence_key}
                    </p>
                  )}
                </li>
              ))
            )}
          </ol>
        </Card>
      </div>
    </>
  );
}
