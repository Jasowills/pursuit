'use client';
import { useEffect, useState } from 'react';
export function GitHubStars() {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    fetch('/api/github', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && Number.isSafeInteger(data?.stars) && data.stars >= 0) setStars(data.stars);
      })
      .catch(() => {});
    return () => {
      alive = false;
      controller.abort();
    };
  }, []);
  return (
    <span
      className="github-live-count"
      aria-label={stars === null ? 'GitHub star count unavailable' : `${stars} GitHub stars`}
    >
      {stars === null
        ? '—'
        : new Intl.NumberFormat('en', {
            notation: stars >= 1000 ? 'compact' : 'standard',
            maximumFractionDigits: 1,
          }).format(stars)}
    </span>
  );
}
