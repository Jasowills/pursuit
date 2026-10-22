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
        <div role="status" aria-busy className="space-y-3 py-10">
          <span className="sr-only">Checking session…</span>
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-9 w-72" />
          <div className="skeleton h-24 w-full" />
        </div>
      ) : state === 'anon' ? (
        <section className="max-w-[620px] py-12 md:py-20">
          <p className="eyebrow eyebrow-signal">Protected record</p>
          <h1 className="page-title mt-4">Sign in required.</h1>
          <p className="page-subtitle max-w-[46ch]">
            This dashboard is protected. Dev sign-in is the only supported flow in this milestone —
            no production identity provider is connected yet.
          </p>
          <Link href="/app/login" className="btn btn-primary btn-arrow mt-7">
            Go to dev sign-in
          </Link>
        </section>
      ) : (
        children
      )}
    </AppShell>
  );
}
