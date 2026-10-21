'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const NAV: ReadonlyArray<readonly [label: string, href: string]> = [
  ['Overview', '/app'],
  ['Jobs', '/app/jobs'],
  ['Applications', '/app/applications'],
  ['Agent', '/app/agent'],
  ['Outreach', '/app/outreach'],
  ['Watchers', '/app/watchers'],
  ['Resume Vault', '/app/vault'],
  ['Notifications', '/app/notifications'],
  ['Settings', '/app/settings'],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState('');
  useEffect(() => setPath(window.location.pathname), []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto flex max-w-[1100px] flex-col px-5 py-6 md:flex-row">
        {/* top bar: mobile; side nav: desktop */}
        <div className="mb-4 flex items-center justify-between md:hidden">
          <Link href="/" className="font-bold tracking-tight">
            pursuit.
          </Link>
          <Link href="/" className="text-sm text-[var(--muted)]" aria-label="Back to landing">
            Exit
          </Link>
        </div>

        <nav
          className="flex flex-wrap gap-1 border-b border-[var(--border)] pb-3 md:sticky md:top-6 md:h-fit md:w-[190px] md:flex-col md:border-b-0 md:border-r md:border-[var(--border)] md:pb-0 md:pr-4"
          aria-label="Dashboard"
        >
          {NAV.map(([label, href]) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[44px] items-center rounded-[var(--radius-md)] px-3 text-sm transition-colors duration-150 ${
                  active
                    ? 'bg-[var(--hover)] font-medium text-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--hover)] hover:text-[var(--foreground)]'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1 md:pl-8 md:pt-1">{children}</main>
      </div>
    </div>
  );
}
