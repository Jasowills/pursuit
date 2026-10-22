'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PursuitMark } from '../../_components/header';
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
    <main className="min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left: the casebook's cover. Hidden on small screens to keep the form immediate. */}
      <section className="ink-section relative hidden flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14">
        <div className="flex items-center gap-3">
          <PursuitMark size={28} />
          <span className="font-serif text-[24px] font-medium leading-none tracking-[-0.035em] text-[color:var(--paper)]">
            Pursuit<span className="text-[color:var(--signal-bright)]">.</span>
          </span>
        </div>

        <div className="max-w-[520px] py-16">
          <p className="eyebrow eyebrow-signal">Access / Dev sign-in</p>
          <h1 className="mt-6 font-serif text-[clamp(44px,5.4vw,76px)] font-normal leading-[0.95] tracking-[-0.045em] text-[color:var(--paper)]">
            The casebook starts with one <em className="accent-italic">truthful</em> record.
          </h1>
          <p className="mt-7 max-w-[42ch] text-[15px] leading-relaxed text-[color:var(--muted-foreground)]">
            This is a personal career operations system. It records what happened, asks before
            acting, and never invents a qualification or a submission.
          </p>
        </div>

        <div className="grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
          {[
            ['No external account', 'contacted'],
            ['7-day session', 'stored locally'],
            ['Nothing is sent', 'without approval'],
          ].map(([title, detail]) => (
            <div key={title} className="bg-[var(--ink)] p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[color:var(--signal-bright)]">
                {title}
              </p>
              <p className="mt-1 text-[12px] text-[color:var(--muted)]">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Right: the form. */}
      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[430px]">
          <div className="mb-10 flex items-center justify-between gap-4 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Pursuit home">
              <PursuitMark size={24} />
              <span className="font-serif text-[21px] font-medium leading-none tracking-[-0.035em]">
                Pursuit<span className="text-[color:var(--signal)]">.</span>
              </span>
            </Link>
            <Link href="/" className="mono-meta">
              Exit ↗
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[var(--signal)]" aria-hidden />
            <p className="eyebrow eyebrow-signal">Access request</p>
          </div>
          <h1 className="page-title mt-5">Open your casebook.</h1>
          <p className="mt-4 max-w-[40ch] text-[14px] leading-relaxed text-[color:var(--muted-foreground)]">
            Dev sign-in creates a personal tenant and a 7-day session. Nothing is sent anywhere and
            no external account is contacted.
          </p>

          <div className="mt-6 flex items-center gap-2">
            <span className="stamp stamp-warning">Development only</span>
            <span className="mono-meta">No production identity provider</span>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="display-name" className="label">
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
                className="input"
                placeholder="Your name"
              />
            </div>

            {error && (
              <div role="alert" className="notice notice-danger">
                <span className="notice-label">Sign-in failed</span>
                <p className="text-[13px] leading-relaxed text-[color:var(--ink-soft)]">{error}</p>
              </div>
            )}

            <button type="submit" disabled={busy} className="btn btn-primary btn-block btn-arrow">
              {busy ? 'Opening…' : 'Open the casebook'}
            </button>
          </form>

          <div className="mt-8 border-t border-[var(--border)] pt-5">
            <p className="text-[11px] leading-relaxed text-[color:var(--muted)]">
              Dev-only authentication. Production auth providers are not configured in this
              milestone. If the API is not running on port 4000, sign-in will fail visibly.
            </p>
            <Link href="/" className="link-underline mt-4 inline-block text-[12px] font-medium">
              ← Back to the overview
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
