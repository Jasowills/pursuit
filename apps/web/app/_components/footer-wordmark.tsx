'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

// Original pen trajectories. Each stroke follows a letter's shape, including
// separate pen lifts for the i dot and t crossbar; no typed or clipped reveal.
const strokes = [
  [
    'M99 113 C94 145 87 190 78 231 L95 143 C109 109 159 105 166 135 C173 169 137 189 92 171',
    0,
    740,
  ],
  [
    'M207 115 C201 137 188 171 206 177 C225 185 253 158 267 115 C260 136 253 158 253 171 C253 181 266 179 279 170',
    650,
    570,
  ],
  ['M311 177 L326 115 L319 143 C332 118 350 108 370 119', 1170, 440],
  [
    'M447 122 C433 105 400 110 394 128 C386 150 437 142 436 161 C435 182 402 191 382 174',
    1570,
    560,
  ],
  [
    'M483 119 C477 142 466 172 484 179 C504 186 530 158 545 116 C538 140 530 162 532 174 C534 184 546 180 557 173',
    2080,
    550,
  ],
  ['M596 119 C591 139 581 164 584 174 C587 183 599 180 611 172', 2580, 350],
  ['M665 72 C657 107 639 153 641 171 C642 187 660 184 680 171', 2880, 480],
  ['M624 119 C646 115 668 113 691 112', 3320, 220],
  ['M604 83 L605 82', 3570, 130],
  ['M737 176 L738 175', 3750, 150],
] as const;

export function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className="footer-large-word footer-lettering footer-handwriting"
      data-visible={visible}
      onPointerEnter={() => {
        if (visible) setRun((v) => v + 1);
      }}
      aria-hidden="true"
    >
      <svg
        key={run}
        viewBox="25 45 760 205"
        fill="none"
        className="footer-pen-word"
        focusable="false"
      >
        {strokes.map(([d, delay, duration], i) => (
          <path
            key={i}
            d={d}
            pathLength="1"
            className={`footer-pen-stroke${i === strokes.length - 1 ? ' footer-pen-dot' : ''}`}
            style={
              { '--pen-delay': `${delay}ms`, '--pen-duration': `${duration}ms` } as CSSProperties
            }
          />
        ))}
      </svg>
    </div>
  );
}
