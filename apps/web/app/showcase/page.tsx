import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingHeader } from '../_components/header';

/**
 * Living style guide: paper, ink, type, stamps, controls, and notice patterns.
 * Single source of truth for visuals — pages compose from these pieces.
 */
export const metadata: Metadata = { title: 'Showcase' };

function Row({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--ink)] pb-2">
        <h2 className="panel-title">{title}</h2>
        {note && <p className="mono-meta max-w-[46ch]">{note}</p>}
      </div>
      <div className="pt-6">{children}</div>
    </section>
  );
}

const COLORS = [
  ['paper', 'var(--paper)', '#f3eee0'],
  ['paper-raised', 'var(--paper-raised)', '#faf6ea'],
  ['paper-deep', 'var(--paper-deep)', '#e9e1cf'],
  ['ink', 'var(--ink)', '#17150f'],
  ['signal', 'var(--signal)', '#c23a1b'],
  ['success', 'var(--success)', '#2d5a3a'],
  ['warning', 'var(--warning)', '#7c5200'],
  ['danger', 'var(--danger)', '#9e2b1b'],
] as const;

export default function ShowcasePage() {
  return (
    <main>
      <LandingHeader />
      <div className="container-pursuit py-12 md:py-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-[var(--signal)]" aria-hidden />
          <p className="eyebrow eyebrow-signal">Design system / Specimen 01</p>
        </div>
        <h1 className="hero-h1 mt-5 max-w-[760px] text-[clamp(42px,6vw,78px)]">
          The casebook, <em>on paper.</em>
        </h1>
        <p className="lede mt-5 max-w-[58ch]">
          Warm stock, ink, hairline rules, and a single vermilion signal. Every dashboard surface
          composes from these pieces.{' '}
          <Link href="/app" className="link-underline font-medium">
            Open the dashboard →
          </Link>
        </p>

        <Row
          title="01 / Foundations"
          note="Paper is the canvas. Ink is the voice. Vermilion marks the decision point."
        >
          <div className="grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
            {COLORS.map(([name, value, hex]) => (
              <div key={name} className="bg-[var(--paper-raised)] p-4">
                <span
                  className="block h-14 border border-[var(--border)]"
                  style={{ background: value }}
                  aria-hidden
                />
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em]">{name}</p>
                <p className="mono-meta mt-0.5">{hex}</p>
              </div>
            ))}
          </div>
          <p className="mono-meta mt-3">
            Squared geometry: radius 0–3px. The only hard shadow is reserved for the hero artefact.
          </p>
        </Row>

        <Row title="02 / Type" note="Newsreader · Instrument Sans · IBM Plex Mono. Self-hosted.">
          <div className="space-y-6">
            <p className="font-serif text-[clamp(42px,6vw,78px)] leading-[0.94] tracking-[-0.045em]">
              A record, <em className="accent-italic">not a feed.</em>
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="eyebrow mb-2">Display / Newsreader 420</p>
                <p className="font-serif text-[38px] leading-[1.02] tracking-[-0.03em]">
                  Your next move, already in motion.
                </p>
              </div>
              <div>
                <p className="eyebrow mb-2">Body / Instrument Sans 400</p>
                <p className="text-[15px] leading-relaxed text-[color:var(--muted-foreground)]">
                  The interface is deliberately quiet. It should read like a well-set document:
                  clear hierarchy, generous margins, and nothing competing with the record itself.
                </p>
              </div>
            </div>
            <div className="grid gap-6 border-t border-[var(--border)] pt-6 md:grid-cols-3">
              <div>
                <p className="eyebrow mb-2">Metadata / IBM Plex Mono</p>
                <p className="mono-meta">CASE 0042 / SUBMITTED / 21 OCT 2026</p>
              </div>
              <div>
                <p className="eyebrow mb-2">Small / 12</p>
                <p className="text-[12px] leading-relaxed text-[color:var(--muted-foreground)]">
                  Secondary explanation and field hints.
                </p>
              </div>
              <div>
                <p className="eyebrow mb-2">Micro / 10</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[color:var(--muted)]">
                  Section labels and stamps
                </p>
              </div>
            </div>
          </div>
        </Row>

        <Row title="03 / Buttons" note="Minimum 48px primary height; 44px for small. Offset hover, no pill radii.">
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-primary btn-arrow">Primary action</button>
            <button className="btn btn-outline">Secondary</button>
            <button className="btn btn-ghost">Ghost</button>
            <button className="btn btn-danger">Destructive</button>
            <button disabled className="btn btn-primary">
              Disabled
            </button>
            <button className="btn btn-outline btn-sm">Small action</button>
          </div>
        </Row>

        <Row title="04 / Stamps" note="Status is text first. Color reinforces; it never carries the meaning alone.">
          <div className="flex flex-wrap gap-2">
            <span className="stamp stamp-muted">Discovered</span>
            <span className="stamp stamp-signal">Verified</span>
            <span className="stamp stamp-warning">Possibly eligible</span>
            <span className="stamp stamp-success">Qualified</span>
            <span className="stamp stamp-danger">Ineligible</span>
            <span className="stamp stamp-solid">Submitted</span>
          </div>
          <p className="mt-3 text-[12px] text-[color:var(--muted-foreground)]">
            UNKNOWN never renders as a pass — it is its own visible state.
          </p>
        </Row>

        <Row title="05 / Inputs" note="48px baseline, square corners, vermilion focus ring.">
          <div className="grid max-w-[720px] gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label">Text input</span>
              <input className="input" placeholder="you@example.com" />
            </label>
            <label className="block">
              <span className="label">Select</span>
              <select className="input" defaultValue="remote">
                <option value="remote">Remote (worldwide)</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="label">Textarea</span>
              <textarea className="input" rows={3} placeholder="Paste the posting text…" />
            </label>
          </div>
        </Row>

        <Row title="06 / Panels & notices" note="One hairline border. No floating cards, no stacked shadows.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel">
              <p className="panel-title">Standard panel</p>
              <h3 className="panel-heading mt-2">A record surface.</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted-foreground)]">
                Used for forms, state, and timelines. 1px border, 2px radius, paper-raised stock.
              </p>
            </div>
            <div className="notice notice-warning">
              <span className="notice-label">Not available in this milestone</span>
              <p className="text-sm font-semibold">Feature</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--ink-soft)]">
                Honest unavailable notice used across the dashboard. Nothing is simulated.
              </p>
            </div>
            <div className="notice notice-danger">
              <span className="notice-label">Request failed</span>
              <p className="text-sm font-semibold">The record could not be loaded</p>
              <p className="mt-1 text-[13px] text-[color:var(--ink-soft)]">Error detail appears here.</p>
            </div>
            <div className="notice notice-success">
              <span className="notice-label">Record added</span>
              <p className="text-[13px] leading-relaxed text-[color:var(--ink-soft)]">
                Dedupe runs before a record is created.
              </p>
            </div>
          </div>
        </Row>

        <Row title="07 / Records" note="Rows, not cards. Rules carry the structure; the content carries the weight.">
          <div className="stat-strip max-w-[760px]">
            {[
              ['Applications', '05'],
              ['Agent runs', '03'],
              ['Active watchers', '02'],
              ['Unread alerts', '01'],
            ].map(([label, value]) => (
              <div key={label} className="stat-cell">
                <p className="stat-label">{label}</p>
                <p className="stat-value">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 max-w-[760px]">
            {[
              ['Senior Platform Engineer', 'Acme Systems · Remote', 'Eligible', 'stamp-success'],
              ['Staff Product Manager', 'Northstar · Hybrid', 'Possibly', 'stamp-warning'],
              ['Integration Engineer', 'Relay Labs · Remote', 'Unknown', 'stamp-muted'],
            ].map(([title, meta, state, tone]) => (
              <div key={title} className="case-row">
                <span className="min-w-0">
                  <span className="case-row-title">{title}</span>
                  <span className="case-row-meta">{meta}</span>
                </span>
                <span className={`stamp ${tone}`}>{state}</span>
              </div>
            ))}
          </div>
        </Row>
      </div>
    </main>
  );
}
