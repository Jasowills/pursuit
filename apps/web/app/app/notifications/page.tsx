'use client';

import { useState } from 'react';
import { apiFetch, useResource } from '@/lib/api-client';
import { PageHeader, Loading, ErrorBox, Empty, Unavailable } from '../_components/ui';

interface NotesResponse {
  items: {
    id: string;
    title: string;
    body: string;
    read_at: string | null;
    created_at: string;
    entity_ref: string | null;
  }[];
}

export default function NotificationsPage() {
  const notes = useResource<NotesResponse>('/notifications');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function markRead(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'POST', json: {} });
      notes.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Section 08 / Notifications"
        title="Notifications"
        subtitle="Run completions, approval requests, and watcher alerts land here."
      />

      {error && (
        <div role="alert" className="notice notice-danger mb-4">
          <span className="notice-label">Action failed</span>
          <p className="text-[13px] leading-relaxed text-[color:var(--ink-soft)]">{error}</p>
        </div>
      )}

      <section>
        <div className="flex items-end justify-between gap-4 border-b border-[var(--ink)] pb-2">
          <h2 className="panel-title">Inbox</h2>
          <span className="mono-meta">{notes.data?.items.length ?? 0} entries</span>
        </div>

        {notes.error ? (
          <div className="mt-4">
            <ErrorBox error={notes.error} retry={notes.reload} />
          </div>
        ) : notes.loading ? (
          <Loading />
        ) : (notes.data?.items.length ?? 0) === 0 ? (
          <Empty>Nothing yet. Finish an agent run to generate the first notification.</Empty>
        ) : (
          <ul>
            {notes.data?.items.map((n) => (
              <li
                key={n.id}
                className={`case-row items-start ${n.read_at ? '' : 'border-l-2 border-l-[var(--signal)] pl-4'}`}
              >
                <span className="min-w-0">
                  <span
                    className={`block truncate text-[14px] leading-snug ${
                      n.read_at
                        ? 'font-normal text-[color:var(--muted-foreground)]'
                        : 'font-semibold text-[color:var(--ink)]'
                    }`}
                  >
                    {n.title}
                  </span>
                  <span className="mt-1 block truncate text-[12px] text-[color:var(--muted-foreground)]">
                    {n.body}
                  </span>
                  <span className="mono-meta mt-1 block">
                    {new Date(n.created_at).toLocaleString()}
                    {n.entity_ref ? ` · ${n.entity_ref.split(':')[0]}` : ''}
                  </span>
                </span>
                {!n.read_at && (
                  <button
                    onClick={() => markRead(n.id)}
                    disabled={busyId === n.id}
                    className="btn btn-ghost btn-sm shrink-0"
                  >
                    {busyId === n.id ? '…' : 'Mark read'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <Unavailable
          feature="Push / email delivery of notifications"
          detail="Notifications are in-app only in this milestone. Nothing is emailed or pushed to devices."
        />
      </section>
    </>
  );
}
