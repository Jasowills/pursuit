import type { ReactNode } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Badge } from './Badge';
import { cn } from './utils';

/* status indicator helpers ------------------------------------------------ */

type StatusExpr =
  | { eligibility: 'VERIFIED_ELIGIBLE' | 'POSSIBLY_ELIGIBLE' | 'UNKNOWN' | 'INELIGIBLE' }
  | { status: string }
  | null;

export function StatusIndicator({ record }: { record: StatusExpr }) {
  if (!record) return <Badge>UNKNOWN</Badge>;
  if ('eligibility' in record) {
    const map = {
      VERIFIED_ELIGIBLE: ['success', 'Verified eligible'],
      POSSIBLY_ELIGIBLE: ['warning', 'Possibly eligible'],
      UNKNOWN: ['neutral', 'Unknown'],
      INELIGIBLE: ['danger', 'Ineligible'],
    } as const;
    const found = map[record.eligibility];
    return (
      <Badge tone={found[0] as 'success' | 'warning' | 'neutral' | 'danger'}>{found[1]}</Badge>
    );
  }
  const s = record.status;
  if (s === 'SUBMITTED') return <Badge tone="success">Submitted</Badge>;
  if (s === 'NEEDS_ATTENTION') return <Badge tone="warning">Needs attention</Badge>;
  if (s === 'FAILED' || s === 'REJECTED') return <Badge tone="danger">{s.toLowerCase()}</Badge>;
  if (s === 'APPROVED' || s === 'OPEN') return <Badge tone="success">{s.toLowerCase()}</Badge>;
  return <Badge>{s.toLowerCase().replace(/_/g, ' ')}</Badge>;
}

/* Tabs --------------------------------------------------------------------- */

export const Tabs = TabsPrimitive.Root;

export function TabsBar({
  value,
  onValueChange,
  tabs,
  ariaLabel,
}: {
  value: string;
  onValueChange: (v: string) => void;
  tabs: { id: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange}>
      <TabsPrimitive.List
        aria-label={ariaLabel}
        className="flex flex-wrap gap-1 border-b border-[var(--border)]"
      >
        {tabs.map((t) => (
          <TabsPrimitive.Trigger
            key={t.id}
            value={t.id}
            className="rounded-t-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--muted)] transition-colors duration-150 data-[state=active]:border-b-2 data-[state=active]:border-[var(--foreground)] data-[state=active]:text-[var(--foreground)] min-h-[44px]"
          >
            {t.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {tabs.map((t) => (
        <TabsPrimitive.Content key={t.id} value={t.id} className="mt-4 focus-visible:outline-none">
          {t.label}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

/* Table skeleton ------------------------------------------------------------ */

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  caption,
  emptyState,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  caption: string;
  emptyState?: ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <>{emptyState ?? <EmptyState title="Nothing here yet" body="No records to display." />}</>
    );
  }
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)]">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn('px-4 py-3 font-medium text-[var(--muted-foreground)]', c.className)}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-[var(--border)] last:border-0 transition-colors duration-150 hover:bg-[var(--hover)]"
            >
              {columns.map((c) => (
                <td key={c.key} className={cn('px-4 py-3 align-top', c.className)}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* empty / loading / error states ------------------------------------------- */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
      <p className="font-medium text-[var(--foreground)]">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--muted)]">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-pulse rounded-[var(--radius-sm)] bg-[var(--hover)]',
        className ?? 'h-4 w-full',
      )}
    />
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 py-8 text-sm text-[var(--muted)]"
    >
      <span
        aria-hidden
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--muted)] border-t-transparent"
      />
      {label}
    </div>
  );
}

export function ErrorState({
  title,
  detail,
  retry,
}: {
  title: string;
  detail?: string;
  retry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-[var(--radius-lg)] border border-[#fecaca] bg-[#fef2f2] p-6"
    >
      <p className="font-medium text-[var(--danger)]">{title}</p>
      {detail ? <p className="mt-1 text-sm text-[var(--muted-foreground)]">{detail}</p> : null}
      {retry ? (
        <button onClick={retry} className="mt-3 underline underline-offset-2 text-sm" type="button">
          Try again
        </button>
      ) : null}
    </div>
  );
}
