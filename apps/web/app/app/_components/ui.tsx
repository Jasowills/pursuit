'use client';

/**
 * Shared dashboard primitives. Loading/error/empty are always explicit —
 * the UI never shows fabricated data or fake success states.
 */
import { useEffect, useState } from 'react';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-[var(--muted-foreground)]">{subtitle}</p>}
    </header>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="animate-pulse space-y-3 py-4" aria-busy>
      <div className="h-16 rounded-[var(--radius-lg)] bg-[var(--hover)]" />
      <div className="h-16 rounded-[var(--radius-lg)] bg-[var(--hover)]" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ErrorBox({ error, retry }: { error: unknown; retry?: () => void }) {
  const msg = error instanceof Error ? error.message : String(error);
  const is401 = msg.includes('missing_bearer') || msg.includes('invalid_or_expired');
  return (
    <div
      role="alert"
      className="rounded-[var(--radius-md)] border border-[#f4c7c3] bg-[#fdf3f2] p-4 text-sm text-[#a50e0e]"
    >
      <p className="font-medium">{is401 ? 'Session expired or missing' : 'Request failed'}</p>
      <p className="mt-1 opacity-80">{msg}</p>
      {is401 ? (
        <a href="/app/login" className="mt-2 inline-block font-medium underline">
          Sign in again
        </a>
      ) : retry ? (
        <button onClick={retry} className="mt-2 block font-medium underline">
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">
      {children}
    </div>
  );
}

/** Explicit, honest "not available yet" marker for unimplemented features. */
export function Unavailable({ feature, detail }: { feature: string; detail: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <span aria-hidden>⏳</span>
        {feature} — not available yet
      </p>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{detail}</p>
    </div>
  );
}

const STATUS_TONES: Record<string, string> = {
  DISCOVERED: 'bg-[var(--surface)] text-[var(--muted-foreground)] border-[var(--border)]',
  VERIFIED: 'bg-[#eef4fd] text-[#1d4fd8] border-[#d4e2fb]',
  QUALIFIED: 'bg-[#effcf3] text-[#18794e] border-[#d3f2de]',
  DRAFTING: 'bg-[var(--hover)] text-[var(--foreground)] border-[var(--border)]',
  READY_FOR_REVIEW: 'bg-[var(--hover)] text-[var(--foreground)] border-[var(--border)]',
  APPROVED: 'bg-[#effcf3] text-[#18794e] border-[#d3f2de]',
  APPLYING: 'bg-[#fdf6ec] text-[#8a5a00] border-[#f5e3c2]',
  SUBMITTED: 'bg-[#18794e] text-white border-transparent',
  NEEDS_ATTENTION: 'bg-[#fdf3f2] text-[#a50e0e] border-[#f4c7c3]',
  NEEDS_VERIFICATION: 'bg-[#fdf6ec] text-[#8a5a00] border-[#f5e3c2]',
  FAILED: 'bg-[#fdf3f2] text-[#a50e0e] border-[#f4c7c3]',
  REJECTED: 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]',
  SKIPPED: 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]',
  WITHDRAWN: 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]',
};

const ELIGIBILITY_TONES: Record<string, string> = {
  VERIFIED_ELIGIBLE: 'bg-[#effcf3] text-[#18794e] border-[#d3f2de]',
  POSSIBLY_ELIGIBLE: 'bg-[#fdf6ec] text-[#8a5a00] border-[#f5e3c2]',
  UNKNOWN: 'bg-[var(--surface)] text-[var(--muted-foreground)] border-[var(--border)]',
  INELIGIBLE: 'bg-[#fdf3f2] text-[#a50e0e] border-[#f4c7c3]',
};

export function StatusPill({
  status,
  kind = 'status',
}: {
  status: string;
  kind?: 'status' | 'eligibility' | 'neutral';
}) {
  const tones =
    kind === 'eligibility'
      ? ELIGIBILITY_TONES[status]
      : kind === 'status'
        ? STATUS_TONES[status]
        : undefined;
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
        tones ??
        STATUS_TONES[status] ??
        'bg-[var(--surface)] text-[var(--muted-foreground)] border-[var(--border)]'
      }`}
    >
      {status.replaceAll('_', ' ').toLowerCase()}
    </span>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{hint}</p>}
    </Card>
  );
}

/** Field with label — used by forms. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--muted-foreground)]">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'mt-1.5 h-10 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--foreground)] disabled:opacity-60';

export function formError(err: unknown): string {
  if (err instanceof Error) {
    try {
      // ApiError messages carry structured detail already
      return err.message;
    } catch {
      /* fallthrough */
    }
  }
  return String(err);
}

/** Small hook: dismissible notices. */
export function useDismiss(initial = true) {
  const [open, setOpen] = useState(initial);
  useEffect(() => undefined, []);
  return { open, close: () => setOpen(false) };
}
