'use client';

import { useEffect, useRef, useState } from 'react';

export function Reveal({
  children,
  className = '',
  delay = 0,
  from = 'up',
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  from?: 'up' | 'left' | 'right' | 'scale';
  tone?: 'ink' | 'brand' | 'lime' | 'soft';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'hidden' | 'visible'>('idle');

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setState('visible');
      return undefined;
    }

    // Do not hide content that is already on screen; only arm content that
    // starts below the fold. This keeps the no-JS and fast-paint states honest.
    if (node.getBoundingClientRect().top < window.innerHeight * 0.92) {
      setState('visible');
      return undefined;
    }

    setState('hidden');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState('visible');
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      data-reveal=""
      data-state={state === 'idle' ? undefined : state}
      data-from={from}
      data-tone={tone}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
