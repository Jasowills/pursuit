'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/lib/api-client';
import { AppShell } from './_components/shell';

/**
 * Root of the dashboard. Requires a dev-session token (dev login only in
 * this milestone). While auth state is unknown a skeleton renders — never
 * a fake success state. The login page itself is exempt from the gate.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const [state, setState] = useState<'checking' | 'authed' | 'anon'>('checking');
  useEffect(() => {
    setState(getToken() ? 'authed' : 'anon');
  }, [pathname]);

  // The login page must render inside the shell without the auth gate.
  if (pathname === '/app/login') {
    return <AppShell>{children}</AppShell>;
  }

  return (
    <AppShell>
      {state === 'checking' ? (
        <div className="animate-pulse space-y-3 py-10" aria-busy>
          <div className="h-8 w-52 rounded bg-[var(--hover)]" />
          <div className="h-24 rounded-[var(--radius-lg)] bg-[var(--hover)]" />
        </div>
      ) : state === 'anon' ? (
        <section className="py-16 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Sign in required</h1>
          <p className="mx-auto mt-3 max-w-[420px] text-sm text-[var(--muted-foreground)]">
            This dashboard is protected. Dev sign-in is the only supported flow in this milestone —
            no production identity provider is connected yet.
          </p>
          <Link
            href="/app/login"
            className="mt-6 inline-flex h-11 min-h-[44px] items-center rounded-[10px] bg-[var(--primary)] px-5 text-sm font-medium text-[color:var(--primary-foreground)] transition-colors duration-150 hover:bg-[#333]"
          >
            Go to dev sign-in
          </Link>
        </section>
      ) : (
        children
      )}
    </AppShell>
  );
}
