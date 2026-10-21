import { PursuitMark, LandingHeader } from './_components/header';
import { Badge, Card } from '@pursuit/ui';

const STEPS = [
  {
    n: '1',
    title: 'Connect your career profile',
    body: 'Build a verified profile: experience, education, skills, work authorization. Facts stay facts — nothing is invented on your behalf.',
  },
  {
    n: '2',
    title: 'Discover and qualify',
    body: 'Manual intake and page watchers surface new postings. Every job gets an explainable eligibility verdict and fit score.',
  },
  {
    n: '3',
    title: 'Review and approve',
    body: 'The agent drafts applications and outreach. You approve the exact payload before anything external happens. Always.',
  },
  {
    n: '4',
    title: 'Track every outcome',
    body: 'A durable state machine tracks each application from discovery to confirmation, with the evidence attached.',
  },
];

const FEATURES = [
  {
    title: 'Discovery',
    body: 'Manual intake with dedupe, eligibility scoring and hard-failure explanations.',
  },
  {
    title: 'Page watchers',
    body: 'Watch company pages and ATS listings for new or reopened roles — even while offline.',
  },
  {
    title: 'Browser agent',
    body: 'A proposal-only agent plans drafts; its every step lands in a transparent timeline.',
  },
  {
    title: 'Tailored resume vault',
    body: 'Versioned resumes per application, review status and download history.',
  },
  {
    title: 'Outreach',
    body: 'Draft contact messages with confidence levels — sends require your approval.',
  },
  {
    title: 'Mobile sync',
    body: 'The same REST + event stream drives web and mobile, so nothing gets stale.',
  },
];

const FAQ = [
  {
    q: 'What platforms are supported?',
    a: 'Web today; a mobile shell ships in this milestone. Gmail integration and deeper ATS wiring are planned for later phases.',
  },
  {
    q: 'What Gmail permissions do you ask for?',
    a: 'None yet — the Gmail integration has not been provisioned. The product design asks and shows you the scope before anything connects.',
  },
  {
    q: 'Which browsers are supported?',
    a: 'Evergreen Chromium, Firefox, and Safari. Accessibility and reduced-motion are first-class, not an afterthought.',
  },
  {
    q: 'What does it cost?',
    a: 'Not decided yet. The product will show pricing clearly before anything beyond the free dev usage.',
  },
  {
    q: 'How is my data handled?',
    a: 'Your data stays in your tenant. The agent can only propose; payloads are shown for approval, hashed, and single-use.',
  },
  {
    q: 'Are there limits on applications?',
    a: 'Openings are paced by policy; the platform never fabricates submissions — confirmation evidence is required.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
      <summary className="cursor-pointer list-none text-[15px] font-medium marker:content-none">
        <span className="group-open:text-[var(--muted-foreground)]">{q}</span>
      </summary>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{a}</p>
    </details>
  );
}

function AppPreview() {
  // Screenshot-style preview of the real dashboard structure (genuine product
  // surface; not decorative fake data in production — landing preview only).
  return (
    <div
      className="browser-frame rise-in mt-20 w-[min(1100px,100%)]"
      role="img"
      aria-label="Pursuit dashboard preview"
    >
      <div className="flex h-9 items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-[#e4e4e7]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e4e4e7]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e4e4e7]" aria-hidden />
        <span className="ml-3 font-mono text-[11px] text-[var(--muted)]">pursuit · overview</span>
      </div>
      <div className="grid grid-cols-[150px_1fr] gap-0 text-left">
        <div className="hidden border-r border-[var(--border)] p-3 sm:block">
          <div className="mb-3 flex items-center gap-2 px-1">
            <PursuitMark size={18} />
            <span className="text-xs font-bold">pursuit.</span>
          </div>
          {[
            'Overview',
            'Jobs',
            'Applications',
            'Agent',
            'Outreach',
            'Watchers',
            'Vault',
            'Notifications',
          ].map((item) => (
            <div
              key={item}
              className={`rounded-md px-2 py-1.5 text-[11px] ${item === 'Overview' ? 'bg-[var(--hover)] font-medium' : 'text-[var(--muted)]'}`}
            >
              {item}
            </div>
          ))}
          <div className="px-2 py-1.5 text-[11px] text-[var(--muted)]">Resume Vault</div>
        </div>
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Open jobs', '12'],
              ['Applications', '5'],
              ['Awaiting approval', '1'],
              ['Outreach drafts', '—'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-[var(--border)] p-3">
                <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{k}</p>
                <p className="mt-1 text-lg font-semibold">{v}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[var(--border)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold">Agent activity</p>
              <Badge tone="warning">1 pending approval</Badge>
            </div>
            {['search_jobs — ok', 'score_job — ok', 'draft_application — ok'].map((s) => (
              <p key={s} className="font-mono text-[10px] text-[var(--muted)]">
                {s}
              </p>
            ))}
          </div>
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="mb-2 text-xs font-semibold">Jobs pipeline</p>
            <div className="space-y-1.5">
              {[
                'Senior Engineer — Verified eligible',
                'Staff PM — Possibly eligible',
                'Platform Engineer — Unknown',
              ].map((j) => (
                <div
                  key={j}
                  className="flex items-center justify-between rounded-md bg-[var(--surface)] px-2 py-1.5 text-[11px]"
                >
                  <span>{j}</span>
                  <span aria-hidden> ··· </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main>
      <LandingHeader />

      {/* hero */}
      <section className="container-pursuit pb-24 pt-16 text-center md:pt-24">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            aria-hidden
            className="text-[var(--muted-foreground)]"
          >
            <path d="M5 0l1.2 3.8L10 5l-3.8 1.2L5 10 3.8 6.2 0 5l3.8-1.2z" fill="currentColor" />
          </svg>
          Personal career automation
        </span>
        <h1 className="hero-h1 mx-auto mt-6 max-w-[960px]">
          Your next opportunity doesn&rsquo;t wait. Neither should you.
        </h1>
        <p className="hero-subhead mx-auto mt-6 max-w-[650px]">
          Find better roles, tailor every application, reach the right people, and keep your job
          search moving. Even when you&rsquo;re offline.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/app/login"
            className="inline-flex h-12 min-h-[48px] items-center rounded-[10px] bg-[var(--primary)] px-6 text-base font-medium text-[color:var(--primary-foreground)] transition-colors duration-150 hover:bg-[#333]"
          >
            Start your search
          </a>
          <a
            href="#how-it-works"
            className="inline-flex h-12 min-h-[48px] items-center rounded-[10px] border border-[var(--border)] bg-transparent px-6 text-base font-medium transition-colors duration-150 hover:bg-[var(--hover)]"
          >
            See how it works
          </a>
        </div>
        <p className="mt-4 text-sm text-[var(--muted)]">You approve what gets sent.</p>

        <div className="flex justify-center">
          <AppPreview />
        </div>
      </section>

      {/* how it works */}
      <section
        id="how-it-works"
        className="border-y border-[var(--border)] bg-[var(--surface)] py-24"
      >
        <div className="container-pursuit">
          <h2 className="text-center text-3xl font-bold tracking-tight">How it works</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {STEPS.map((s) => (
              <Card key={s.n}>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-[color:var(--primary-foreground)]">
                  {s.n}
                </span>
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {s.body}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="py-24">
        <div className="container-pursuit">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Everything the search needs
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title}>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {f.body}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* safety */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)] py-24">
        <div className="container-pursuit max-w-[760px]">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Safety and control, by construction
          </h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              [
                'Approvals are single-use',
                'Each approval binds one exact payload hash. Any change invalidates it.',
              ],
              [
                'Transparent history',
                'Every state change, tool call and evidence item is on the timeline.',
              ],
              [
                'No invented qualifications',
                'The agent works from your verified profile — it never fabricates eligibility.',
              ],
            ].map(([t, b]) => (
              <li key={t}>
                <Card>
                  <h3 className="text-sm font-semibold">{t}</h3>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">{b}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="container-pursuit max-w-[760px]">
          <h2 className="text-3xl font-bold tracking-tight">Frequently asked</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="py-24 text-center">
        <div className="container-pursuit">
          <h2 className="hero-h1 mx-auto max-w-[720px] text-[40px]">
            Your next move, already in motion.
          </h2>
          <a
            href="/app/login"
            className="mt-8 inline-flex h-12 min-h-[48px] items-center rounded-[10px] bg-[var(--primary)] px-6 text-base font-medium text-[color:var(--primary-foreground)] transition-colors duration-150 hover:bg-[#333]"
          >
            Start your search
          </a>
        </div>
      </section>

      {/* legal footer */}
      <footer className="border-t border-[var(--border)] py-10">
        <div className="container-pursuit flex flex-col items-center justify-between gap-4 text-xs text-[var(--muted)] md:flex-row">
          <p>
            <span className="font-bold">pursuit.</span> — working name; pending trademark, domain
            and store checks. Not yet shipped.
          </p>
          <nav aria-label="Legal" className="flex gap-5">
            <span aria-disabled>Privacy</span>
            <span aria-disabled>Terms</span>
            <span aria-disabled>Security</span>
          </nav>
        </div>
      </footer>
    </main>
  );
}
