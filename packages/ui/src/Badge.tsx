import type { HTMLAttributes } from 'react';
import { cn } from './utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Semantic color only for REAL statuses; neutral otherwise. */
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'stamp-muted',
  success: 'stamp-success',
  warning: 'stamp-warning',
  danger: 'stamp-danger',
};

export function Badge({ className, tone = 'neutral', children, ...props }: BadgeProps) {
  return (
    <span className={cn('stamp', toneClasses[tone], className)} {...props}>
      {children}
    </span>
  );
}
