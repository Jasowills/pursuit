import Link from 'next/link';

export function PursuitMark({ size = 28 }: { size?: number }) {
  // north-east trajectory mark — original composition (spec §logo direction)
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false">
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="8"
        fill="none"
        stroke="var(--foreground)"
        strokeWidth="2"
      />
      <path
        d="M9 23c6-1 12-5 14-13"
        fill="none"
        stroke="var(--foreground)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M16.5 10H23v6.5"
        fill="none"
        stroke="var(--foreground)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_86%,transparent)] backdrop-blur">
      <div className="container-pursuit flex h-[64px] items-center justify-between gap-4 md:h-[76px]">
        <Link href="/" className="flex items-center gap-2" aria-label="Pursuit home">
          <PursuitMark />
          <span className="text-[19px] font-bold tracking-tight">pursuit.</span>
        </Link>
        <nav
          aria-label="Primary"
          className="hidden items-center gap-7 text-sm text-[var(--muted-foreground)] md:flex"
        >
          <a
            href="#product"
            className="transition-colors duration-150 hover:text-[var(--foreground)]"
          >
            Product
          </a>
          <a
            href="#how-it-works"
            className="transition-colors duration-150 hover:text-[var(--foreground)]"
          >
            How it works
          </a>
          <a
            href="#features"
            className="transition-colors duration-150 hover:text-[var(--foreground)]"
          >
            Features
          </a>
          <a href="#faq" className="transition-colors duration-150 hover:text-[var(--foreground)]">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/app/login"
            className="hidden px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors duration-150 hover:text-[var(--foreground)] min-h-[44px] items-center sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/app/login"
            className="inline-flex h-[44px] items-center rounded-[10px] bg-[var(--primary)] px-4 text-sm font-medium text-[color:var(--primary-foreground)] transition-colors duration-150 hover:bg-[#333]"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
