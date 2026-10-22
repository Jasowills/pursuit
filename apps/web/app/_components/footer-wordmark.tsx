'use client';
import { useEffect, useRef, useState } from 'react';
export function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [run, setRun] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className="footer-large-word footer-lettering"
      data-visible={visible}
      onPointerEnter={() => {
        if (visible) setRun((v) => v + 1);
      }}
      aria-hidden="true"
    >
      {'pursuit.'.split('').map((letter, i) => (
        <span
          className="footer-letter"
          key={`${run}-${i}`}
          style={{ '--letter-index': i } as React.CSSProperties}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
