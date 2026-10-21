'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch, setToken, clearToken, ApiError, LoginResponse } from '@/lib/api-client';

/**
 * Dev passwordless sign-in (ENABLE_DEV_LOGIN on the API). Explicitly
 * labeled dev-only: no production identity provider is connected in this
 * milestone, and this page says so.
 */
export default function DevLoginPage() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch<LoginResponse>('/auth/dev-login', {
        method: 'POST',
        json: { email, display_name: displayName },
      });
      setToken(res.token);
      // hard navigation so the auth gate re-evaluates with the new token
      window.location.href = '/app';
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401
            ? 'Dev sign-in is disabled on the API (ENABLE_DEV_LOGIN=false) or rate limited (10/min).'
            : `Sign-in failed: ${err.message}`,
        );
      } else {
        setError('Sign-in failed: API unreachable. Is apps/api running on port 4000?');
      }
      clearToken();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <div className="w-full max-w-[400px]">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2"
          aria-label="Pursuit home"
        >
          <span className="text-xl font-bold tracking-tight">pursuit.</span>
        </Link>
        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface-raised)] p-8 shadow-[var(--shadow-panel)]">
          <h1 className="text-xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Dev sign-in creates a personal tenant and a 7-day session. Nothing is sent anywhere and
            no external account is contacted.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--foreground)]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="display-name" className="block text-sm font-medium">
                Display name
              </label>
              <input
                id="display-name"
                type="text"
                required
                maxLength={120}
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--foreground)]"
                placeholder="Your name"
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-[var(--radius-md)] border border-[#f4c7c3] bg-[#fdf3f2] px-3 py-2 text-sm text-[#a50e0e]"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="h-11 min-h-[44px] w-full rounded-[10px] bg-[var(--primary)] text-sm font-medium text-[color:var(--primary-foreground)] transition-colors duration-150 hover:bg-[#333] disabled:opacity-60"
            >
              {busy ? 'Signing in…' : 'Continue'}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          Dev-only authentication. Production auth providers are not configured in this milestone.
        </p>
      </div>
    </main>
  );
}
