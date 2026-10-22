import type { ReactNode } from 'react';
import './status.css';

/** Color supplements the visible status label; it never carries meaning alone. */
export function StatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: 'positive' | 'attention' | 'negative' | 'neutral';
  children: ReactNode;
}) {
  return (
    <span className="status-badge" data-tone={tone}>
      <i aria-hidden="true" />
      {children}
    </span>
  );
}
