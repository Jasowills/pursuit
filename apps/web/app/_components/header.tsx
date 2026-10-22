'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';

export function PursuitMark({
  size = 28,
  variant = 'brand',
}: {
  size?: number;
  variant?: 'brand' | 'white';
}) {
  const tile = variant === 'white' ? '#ffffff' : '#3b32d6';
  const line = variant === 'white' ? '#3b32d6' : '#ffffff';
  const tip = variant === 'white' ? '#101012' : '#d9f36a';

  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      focusable="false"
    >
      <rect width="32" height="32" rx="9" fill={tile} />
      <path
        d="M8.5 24.2 23.4 9.3"
        fill="none"
        stroke={line}
        strokeWidth="2.35"
        strokeLinecap="round"
      />
      <path
        d="M15.2 9.2h8.4v8.4"
        fill="none"
        stroke={tip}
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="24.2" r="2.15" fill={tip} />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`}>
      pursuit<span className="wordmark-dot">.</span>
    </span>
  );
}

const REPOSITORY_URL = 'https://github.com/Jasowills/pursuit';

const NAV = [
  ['Product', '#product'],
  ['Autopilot', '#autopilot'],
  ['Models', '#models'],
  ['Connect', '#connect'],
] as const;

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1101px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 10);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab' || !menuRef.current) return;
      const items = Array.from(menuRef.current.querySelectorAll<HTMLElement>('a, button')).filter(
        (el) => !el.hasAttribute('disabled'),
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const focusTimer = window.setTimeout(() => {
      menuRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    }, 20);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  return (
    <header className="site-header" data-scrolled={scrolled}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="site-header-inner">
        <Link href="/" className="brand-lockup" aria-label="Pursuit home">
          <PursuitMark size={28} />
          <Wordmark />
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {NAV.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="site-header-actions">
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="repo-link"
            aria-label="Star Pursuit on GitHub"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.08c-3.13.68-3.8-1.33-3.8-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.23.71-1.51-2.5-.29-5.13-1.25-5.13-5.57 0-1.23.44-2.24 1.16-3.03-.12-.28-.5-1.43.11-2.99 0 0 .95-.3 3.08 1.16a10.7 10.7 0 0 1 5.61 0c2.14-1.46 3.08-1.16 3.08-1.16.61 1.56.23 2.71.11 2.99.72.79 1.16 1.8 1.16 3.03 0 4.33-2.64 5.28-5.15 5.56.4.35.76 1.03.76 2.08v3.09c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z" />
            </svg>
            <span>Star on GitHub</span>
          </a>
          <Link href="/app/login" className="site-link">
            Sign in
          </Link>
          <Link href="/#download" className="btn btn-primary">
            Get Pursuit
            <span className="btn-glyph" aria-hidden>
              <Icon name="arrowUpRight" size={12} strokeWidth={2} />
            </span>
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="mobile-menu-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-site-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <Icon name={open ? 'close' : 'menu'} size={19} />
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-site-menu" id="mobile-site-nav" ref={menuRef}>
          <nav aria-label="Mobile">
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => setOpen(false)}
            >
              Star on GitHub <Icon name="arrowUpRight" size={13} />
            </a>
            {NAV.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}>
                {label}
                <Icon name="arrowUpRight" size={13} />
              </a>
            ))}
          </nav>
          <div className="mobile-menu-actions">
            <Link href="/app/login" className="btn btn-outline" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Link href="/#download" className="btn btn-primary" onClick={() => setOpen(false)}>
              Get Pursuit
              <span className="btn-glyph" aria-hidden>
                <Icon name="arrowUpRight" size={12} strokeWidth={2} />
              </span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
