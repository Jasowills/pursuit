'use client';

/**
 * Shared dashboard primitives. Loading/error/empty are always explicit —
 * the UI never shows fabricated data or fake success states.
 */
import { useEffect, useState } from 'react';

export function PageHeader({
  title,
  subtitle,
  eyebrow = 'Pursuit / Casebook',
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <header className="workspace-page-header">
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </header>
  );
}

export function Loading({ label = 'Loading record…' }: { label?: string }) {
  return (
    <div role="status" aria-busy className="space-y-3 py-2">
      <span className="sr-only">{label}</span>
      <div className="skeleton h-4 w-36" />
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-16 w-full" />
    </div>
  );
}

export function ErrorBox({ error, retry }: { error: unknown; retry?: () => void }) {
  const msg = error instanceof Error ? error.message : String(error);
  const is401 = msg.includes('missing_bearer') || msg.includes('invalid_or_expired');
  return (
    <div role="alert" className="notice notice-danger">
      <span className="notice-label">Request failed</span>
      <p className="text-sm font-semibold">
        {is401 ? 'Session expired or missing' : 'The record could not be loaded'}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--ink-soft)]">{msg}</p>
      {is401 ? (
        <a href="/app/login" className="link-underline mt-2 inline-block text-sm font-medium">
          Sign in again
        </a>
      ) : retry ? (
        <button onClick={retry} className="link-underline mt-2 inline-block text-sm font-medium">
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty-state">
      <div className="text-sm leading-relaxed text-[color:var(--muted-foreground)]">{children}</div>
    </div>
  );
}

/** Explicit, honest "not available yet" marker for unimplemented features. */
export function Unavailable({ feature, detail }: { feature: string; detail: string }) {
  return (
    <div className="notice notice-warning">
      <span className="notice-label">Not available in this milestone</span>
      <p className="text-sm font-semibold">{feature}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--ink-soft)]">{detail}</p>
    </div>
  );
}

const STATUS_CLASSES: Record<string, string> = {
  DISCOVERED: 'stamp-muted',
  VERIFIED: 'stamp-signal',
  QUALIFIED: 'stamp-success',
  DRAFTING: 'stamp-warning',
  READY_FOR_REVIEW: 'stamp-warning',
  APPROVED: 'stamp-success',
  APPLYING: 'stamp-warning',
  SUBMITTED: 'stamp-solid',
  NEEDS_ATTENTION: 'stamp-danger',
  NEEDS_VERIFICATION: 'stamp-warning',
  FAILED: 'stamp-danger',
  REJECTED: 'stamp-muted',
  SKIPPED: 'stamp-muted',
  WITHDRAWN: 'stamp-muted',
};

const ELIGIBILITY_CLASSES: Record<string, string> = {
  VERIFIED_ELIGIBLE: 'stamp-success',
  POSSIBLY_ELIGIBLE: 'stamp-warning',
  UNKNOWN: 'stamp-muted',
  INELIGIBLE: 'stamp-danger',
};

export function StatusPill({
  status,
  kind = 'status',
}: {
  status: string;
  kind?: 'status' | 'eligibility' | 'neutral';
}) {
  const tone =
    kind === 'eligibility'
      ? ELIGIBILITY_CLASSES[status]
      : kind === 'status'
        ? STATUS_CLASSES[status]
        : 'stamp-muted';
  return <span className={`stamp ${tone ?? 'stamp-muted'}`}>{status.replaceAll('_', ' ')}</span>;
}

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`panel ${className}`}>{children}</div>;
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
    <div className="stat-cell">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {hint && <p className="stat-hint">{hint}</p>}
    </div>
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
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint block">{hint}</span>}
    </label>
  );
}

export const inputClass = 'input';

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
