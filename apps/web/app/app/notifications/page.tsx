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
        title="Notifications"
        subtitle="Run completions, approval requests, and watcher alerts land here."
      />

      {error && (
        <p
          role="alert"
          className="mb-3 rounded-[var(--radius-md)] border border-[#f4c7c3] bg-[#fdf3f2] px-3 py-2 text-sm text-[#a50e0e]"
        >
          {error}
        </p>
      )}
      {notes.error ? (
        <ErrorBox error={notes.error} retry={notes.reload} />
      ) : notes.loading ? (
        <Loading />
      ) : (notes.data?.items.length ?? 0) === 0 ? (
        <Empty>Nothing yet. Finish an agent run to generate the first notification.</Empty>
      ) : (
        <ul className="space-y-2">
          {notes.data?.items.map((n) => (
            <li
              key={n.id}
              className={`rounded-[var(--radius-lg)] border p-3 text-sm ${n.read_at ? 'border-[var(--border)] bg-[var(--surface)]' : 'border-[var(--border)] bg-[var(--surface-raised)]'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={`truncate ${n.read_at ? 'font-normal text-[var(--muted-foreground)]' : 'font-medium'}`}
                  >
                    {n.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">{n.body}</p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    {new Date(n.created_at).toLocaleString()}
                    {n.entity_ref ? ` · ${n.entity_ref.split(':')[0]}` : ''}
                  </p>
                </div>
                {!n.read_at && (
                  <button
                    onClick={() => markRead(n.id)}
                    disabled={busyId === n.id}
                    className="h-8 min-h-[44px] shrink-0 rounded-[10px] border border-[var(--border)] px-2 text-xs transition-colors duration-150 hover:bg-[var(--hover)] disabled:opacity-60"
                  >
                    {busyId === n.id ? '…' : 'Mark read'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-6">
        <Unavailable
          feature="Push / email delivery of notifications"
          detail="Notifications are in-app only in this milestone. Nothing is emailed or pushed to devices."
        />
      </section>
    </>
  );
}
