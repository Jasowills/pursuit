'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

// Pen masks reveal the real Geist glyphs, so the completed signature is the brand.
const strokes = [
  ['M55 95 L55 240 M55 130 C55 55 155 55 155 130 C155 200 55 200 55 140', 0],
  ['M190 85 L190 150 C190 205 270 205 270 150 L270 85', 350],
  ['M310 190 L310 85 M310 125 Q330 75 365 85', 700],
  ['M460 100 C425 60 375 95 395 125 C410 145 465 130 460 165 C450 205 395 200 380 180', 1000],
  ['M500 85 L500 150 C500 205 580 205 580 150 L580 85', 1350],
  ['M625 85 L625 190 M625 48 L625 49', 1700],
  ['M695 55 L695 155 Q695 195 730 185 M665 90 L735 90', 2000],
  ['M770 185 L771 185', 2400],
] as const;
const letters = ['p', 'u', 'r', 's', 'u', 'i', 't', '.'];
const positions = [25, 169, 290, 366, 478, 605, 650, 740];

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
      <svg key={run} viewBox="0 0 810 270" className="footer-pen-word" focusable="false">
        <defs>
          {strokes.map(([d, delay], i) => (
            <mask
              id={`brand-pen-${run}-${i}`}
              key={i}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="810"
              height="270"
            >
              <path
                d={d}
                pathLength="1"
                className="brand-pen-mask"
                style={{ '--pen-delay': `${delay}ms` } as CSSProperties}
              />
            </mask>
          ))}
        </defs>
        {letters.map((letter, i) => (
          <g
            key={i}
            className={`brand-glyph brand-glyph-${i}`}
            style={{ '--pen-delay': `${strokes[i]![1]}ms` } as CSSProperties}
          >
            <text
              x={positions[i]}
              y="195"
              className="brand-glyph-trace"
              mask={`url(#brand-pen-${run}-${i})`}
            >
              {letter}
            </text>
            <text x={positions[i]} y="195" className="brand-glyph-finish">
              {letter}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
