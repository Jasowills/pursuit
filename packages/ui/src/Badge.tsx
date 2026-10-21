import type { HTMLAttributes } from 'react';
import { cn } from './utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Semantic color only for REAL statuses; neutral otherwise. */
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-[var(--hover)] text-[var(--muted-foreground)] border-[var(--border)]',
  success: 'bg-[#f0fdf4] text-[var(--success)] border-[#bbf7d0]',
  warning: 'bg-[#fefce8] text-[var(--warning)] border-[#fde68a]',
  danger: 'bg-[#fef2f2] text-[var(--danger)] border-[#fecaca]',
};

export function Badge({ className, tone = 'neutral', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
