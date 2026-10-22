import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './utils';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('panel', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="panel-heading text-[24px] text-[color:var(--foreground)]">{children}</h3>;
}

export function CardSubtitle({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-[color:var(--muted)]">{children}</p>;
}
