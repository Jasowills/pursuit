import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './utils';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-semibold text-[var(--foreground)]">{children}</h3>;
}

export function CardSubtitle({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-[var(--muted)]">{children}</p>;
}
