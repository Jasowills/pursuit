import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingHeader } from '../_components/header';

/**
 * Living style guide: tokens, type scale, buttons, inputs, cards, badges.
 * Single source of truth for visuals — pages compose from these pieces.
 */
export const metadata: Metadata = { title: 'Showcase' };

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
        {title}
      </h2>
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface-raised)] p-6">
        {children}
      </div>
    </section>
  );
}

export default function ShowcasePage() {
  return (
    <main>
      <LandingHeader />
      <div className="container-pursuit py-12">
        <h1 className="text-3xl font-bold tracking-tight">Showcase</h1>
        <p className="mt-2 max-w-[560px] text-sm text-[var(--muted-foreground)]">
          The Pursuit design system on one page — tokens, primitives, and patterns. Every dashboard
          surface composes from these pieces.{' '}
          <Link href="/app" className="underline">
            Open the dashboard →
          </Link>
        </p>

        <Row title="Color tokens">
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            {[
              ['background', 'var(--background)'],
              ['surface', 'var(--surface)'],
              ['surface-raised', 'var(--surface-raised)'],
              ['hover', 'var(--hover)'],
              ['foreground', 'var(--foreground)'],
              ['muted-foreground', 'var(--muted-foreground)'],
              ['muted', 'var(--muted)'],
              ['border', 'var(--border)'],
              ['primary', 'var(--primary)'],
              ['primary-foreground', 'var(--primary-foreground)'],
            ].map(([name, value]) => (
              <div key={name} className="flex items-center gap-2">
                <span
                  className="h-8 w-8 shrink-0 rounded-md border border-[var(--border)]"
                  style={{ background: value }}
                  aria-hidden
                />
                <code className="font-mono">{name}</code>
              </div>
            ))}
          </div>
        </Row>

        <Row title="Type scale">
          <div className="space-y-4">
            <p className="hero-h1 text-[44px]">Hero H1 — clamp scale</p>
            <p className="text-3xl font-bold tracking-tight">Section heading / text-3xl bold</p>
            <p className="text-base">Body copy / text-base — the standard reading size.</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Secondary text / text-sm muted.
            </p>
            <p className="font-mono text-xs text-[var(--muted)]">Mono caption / text-xs mono.</p>
          </div>
        </Row>

        <Row title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <button className="h-11 min-h-[44px] rounded-[10px] bg-[var(--primary)] px-5 text-sm font-medium text-[color:var(--primary-foreground)] transition-colors duration-150 hover:bg-[#333]">
              Primary action
            </button>
            <button className="h-11 min-h-[44px] rounded-[10px] border border-[var(--border)] px-5 text-sm font-medium transition-colors duration-150 hover:bg-[var(--hover)]">
              Secondary
            </button>
            <button className="h-9 min-h-[44px] rounded-[10px] border border-[#d3f2de] bg-[#effcf3] px-3 text-xs font-medium text-[#18794e]">
              Toggle chip
            </button>
            <button
              disabled
              className="h-11 min-h-[44px] rounded-[10px] bg-[var(--primary)] px-5 text-sm font-medium text-[color:var(--primary-foreground)] opacity-60"
            >
              Disabled
            </button>
          </div>
        </Row>

        <Row title="Inputs">
          <div className="grid max-w-[520px] gap-3">
            <label className="block">
              <span className="block text-sm font-medium">Text input</span>
              <input
                className="mt-1.5 h-10 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--foreground)]"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium">Textarea</span>
              <textarea
                rows={2}
                className="mt-1.5 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--foreground)]"
                placeholder="Paste the posting text…"
              />
            </label>
          </div>
        </Row>

        <Row title="Status pills">
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              'DISCOVERED',
              'VERIFIED',
              'QUALIFIED',
              'APPLYING',
              'SUBMITTED',
              'FAILED',
              'REJECTED',
            ].map((s) => (
              <span
                key={s}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 font-medium"
              >
                {s.replaceAll('_', ' ').toLowerCase()}
              </span>
            ))}
            {['VERIFIED_ELIGIBLE', 'POSSIBLY_ELIGIBLE', 'UNKNOWN', 'INELIGIBLE'].map((s) => {
              const tone =
                s === 'VERIFIED_ELIGIBLE'
                  ? 'border-[#d3f2de] bg-[#effcf3] text-[#18794e]'
                  : s === 'INELIGIBLE'
                    ? 'border-[#f4c7c3] bg-[#fdf3f2] text-[#a50e0e]'
                    : s === 'POSSIBLY_ELIGIBLE'
                      ? 'border-[#f5e3c2] bg-[#fdf6ec] text-[#8a5a00]'
                      : 'bg-[var(--surface)] text-[var(--muted-foreground)]';
              return (
                <span key={s} className={`rounded-full border px-2.5 py-0.5 font-medium ${tone}`}>
                  {s.replaceAll('_', ' ').toLowerCase()}
                </span>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            UNKNOWN never renders as a pass — it is its own visible state (PRD rule).
          </p>
        </Row>

        <Row title="Cards & unavailable notice">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-4">
              <h3 className="text-sm font-semibold">Standard card</h3>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Used for jobs, runs, settings sections. 1px border, radius-lg, no heavy shadows.
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <span aria-hidden>⏳</span>
                Feature — not available yet
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Honest empty/unavailable notice pattern used across the dashboard.
              </p>
            </div>
          </div>
        </Row>
      </div>
    </main>
  );
}
