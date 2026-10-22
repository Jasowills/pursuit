'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';
import { MobileProductWindow, ProductWindow, type Scene } from './product-preview';

const STEPS: Array<{
  scene: Scene;
  title: string;
  body: string;
  status: string;
}> = [
  {
    scene: 'overview',
    title: 'Start with facts.',
    body: 'Build a profile the agent cannot embellish: verified work authorization, role families, compensation floor, and hard exclusions. Facts stay facts.',
    status: 'Profile read + update',
  },
  {
    scene: 'discover',
    title: 'Discover and qualify.',
    body: 'Manual intake, dedupe, and eligibility reasons you can inspect. Unknown fields stay unknown; they never become a silent pass.',
    status: 'Manual intake',
  },
  {
    scene: 'approve',
    title: 'Review and approve.',
    body: 'The agent proposes a plan and stops at the policy gate. You see the exact destination, fields, attachments, and hash before anything can run.',
    status: 'Single-use approval',
  },
  {
    scene: 'track',
    title: 'Track every outcome.',
    body: 'A durable timeline records each transition and the evidence behind it. A submitted state requires a real confirmation reference. Nothing else claims success.',
    status: 'Durable record',
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ScrollStory() {
  const [active, setActive] = useState(0);
  const [mobileActive, setMobileActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = track.getBoundingClientRect();
      const stickyHeight = Math.min(window.innerHeight - 116, 820);
      const distance = Math.max(1, track.offsetHeight - stickyHeight);
      const progress = clamp((-rect.top + 92) / distance, 0, 0.999);
      const next = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));
      setActive((current) => (current === next ? current : next));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function goToStep(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const stickyHeight = Math.min(window.innerHeight - 116, 820);
    const distance = Math.max(1, track.offsetHeight - stickyHeight);
    const start = window.scrollY + rect.top - 92;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: start + (index / STEPS.length) * distance + 2,
      behavior: reduced ? 'auto' : 'smooth',
    });
  }

  const activeStep = STEPS[active] ?? STEPS[0]!;
  const mobileStep = STEPS[mobileActive] ?? STEPS[0]!;

  return (
    <section className="story" id="how-it-works">
      <div className="site-frame">
        <div className="story-head">
          <div>
            <h2 className="display-lg">Four moves. One record.</h2>
          </div>
          <div className="story-head-copy">
            The agent can search, score, and propose. Every gated step stops for
            you. Scroll the four records and watch the workspace change.
            <span>Illustrative workspace · fictional seed records</span>
          </div>
        </div>
      </div>

      <div className="site-frame">
        <div className="story-track" ref={trackRef}>
          <div className="story-sticky">
            <div className="story-copy">
              <ol className="story-steps">
                {STEPS.map((step, index) => (
                  <li key={step.title}>
                    <button
                      type="button"
                      className="story-step"
                      aria-current={active === index ? 'step' : undefined}
                      onClick={() => goToStep(index)}
                    >
                      <span className="story-step-index">0{index + 1}</span>
                      <span className="story-step-copy">
                        <span className="story-step-title">{step.title}</span>
                        <span className="story-step-body">{step.body}</span>
                        <span className="story-step-status">{step.status}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
              <div className="story-progress" aria-hidden>
                <span
                  className="story-progress-bar"
                  style={{ width: `${((active + 1) / STEPS.length) * 100}%` }}
                />
              </div>
              <div className="story-note">
                <Icon name="shield" size={12} />
                Nothing sends itself. The approval is bound to one payload and
                consumed once.
              </div>
              <p className="sr-only" aria-live="polite">
                Step {active + 1} of {STEPS.length}: {activeStep.title}
              </p>
            </div>

            <div className="story-stage" aria-live="polite">
              <div className="story-stage-chrome">
                <span>Live workspace</span>
                <span>{activeStep.status}</span>
              </div>
              <div className="story-stage-frame">
                <ProductWindow scene={activeStep.scene} />
              </div>
            </div>
          </div>
        </div>

        <div className="story-mobile">
          <div
            className="story-mobile-controls"
            role="tablist"
            aria-label="How Pursuit works"
          >
            {STEPS.map((step, index) => (
              <button
                key={step.title}
                type="button"
                role="tab"
                className="story-mobile-tab"
                aria-selected={mobileActive === index}
                aria-controls="story-mobile-panel"
                id={`story-mobile-tab-${index}`}
                tabIndex={mobileActive === index ? 0 : -1}
                onClick={() => setMobileActive(index)}
              >
                0{index + 1} {step.title.replace('.', '')}
              </button>
            ))}
          </div>
          <div className="story-mobile-copy">
            <h3>{mobileStep.title}</h3>
            <p>{mobileStep.body}</p>
            <span className="story-step-status">{mobileStep.status}</span>
          </div>
          <div
            className="story-mobile-stage"
            id="story-mobile-panel"
            role="tabpanel"
            aria-labelledby={`story-mobile-tab-${mobileActive}`}
          >
            <MobileProductWindow scene={mobileStep.scene} />
          </div>
        </div>
      </div>
    </section>
  );
}
