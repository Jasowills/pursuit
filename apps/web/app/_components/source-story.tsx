'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';

const chapters = [
  {
    title: 'A wider search. A clearer shortlist.',
    copy: 'Company career pages, job sources and the teams you watch. Bring the opportunities together before deciding where your experience belongs.',
    label: 'Find the opportunities',
    icon: 'search',
  },
  {
    title: 'Your experience. Made relevant.',
    copy: 'The role changes. The facts don’t. Shape your resume and cover letter around the experience that matters, with every change there to review.',
    label: 'Prepare your application',
    icon: 'file',
  },
  {
    title: 'Your next move, within your rules.',
    copy: 'Review a promising role, or let autopilot proceed within your limits. Follow the outcome without keeping another spreadsheet.',
    label: 'Apply and keep track',
    icon: 'shield',
  },
] as const;

export function SourceStory() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [automatic, setAutomatic] = useState(false);
  useEffect(() => {
    const track = root.current;
    const view = stage.current;
    const media = matchMedia(
      '(min-width: 901px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)',
    );
    if (!track || !view) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!media.matches) {
        view.style.removeProperty('--arrival');
        return;
      }
      const rect = track.getBoundingClientRect();
      const progress = Math.max(
        0,
        Math.min(0.999, -rect.top / Math.max(1, track.offsetHeight - innerHeight)),
      );
      setActive(Math.floor(progress * chapters.length));
      view.style.setProperty(
        '--arrival',
        String(Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight * 0.85)))),
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    media.addEventListener('change', schedule);
    return () => {
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
      media.removeEventListener('change', schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
  function select(index: number) {
    setActive(index);
    const el = root.current;
    if (
      el &&
      matchMedia(
        '(min-width: 901px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)',
      ).matches
    ) {
      scrollTo({
        top:
          scrollY +
          el.getBoundingClientRect().top +
          ((index + 0.15) / chapters.length) * (el.offsetHeight - innerHeight),
        behavior: 'smooth',
      });
    }
  }
  return (
    <section id="how-it-works" className="source-story" aria-label="From discovery to application">
      <div className="source-story-heading dark-frame">
        <h2>
          Your search.
          <br />
          <span>A little further, every day.</span>
        </h2>
        <p>
          Find the role. Make your case. Move forward.
          <br />
          One assistant keeps the whole story together.
        </p>
      </div>
      <div className="source-story-track" ref={root}>
        <div className="source-story-stage" ref={stage} data-chapter={active}>
          <div className="source-story-inner dark-frame">
            <div className="source-story-copy">
              <ol>
                {chapters.map((chapter, i) => (
                  <li key={chapter.label}>
                    <button
                      onClick={() => select(i)}
                      aria-current={active === i ? 'step' : undefined}
                    >
                      <span className="source-step-line" />
                      <span>{chapter.label}</span>
                    </button>
                  </li>
                ))}
              </ol>
              <h3>{chapters[active]!.title}</h3>
              <p>{chapters[active]!.copy}</p>
              <a className="text-link" href="/product-tour">
                Explore the workspace <Icon name="arrowUpRight" size={15} />
              </a>
            </div>
            <div className="source-center">
              <div className="source-inputs" aria-hidden="true">
                <span>
                  <Icon name="globe" size={16} /> Career pages
                </span>
                <span>
                  <Icon name="bell" size={16} /> Company watchers
                </span>
                <span>
                  <Icon name="search" size={16} /> Job sources
                </span>
              </div>
              <div className="source-product-window">
                <div className="source-window-bar">
                  <span>
                    <i /> pursuit / your search
                  </span>
                  <small>Sample career</small>
                </div>
                <div className="source-window-body" key={active}>
                  {active === 0 ? (
                    <>
                      <div className="source-window-title">
                        <Icon name="search" size={20} />
                        <h4>Find the work you want more of.</h4>
                      </div>
                      <div className="source-filter">
                        <span>Product design</span>
                        <span>London / Remote</span>
                        <span>£80k+</span>
                      </div>
                      <div className="source-job-head">
                        <span>Opportunity</span>
                        <span>Why it fits</span>
                      </div>
                      {[
                        [
                          'Northstar',
                          'Senior Product Designer',
                          'B2B workflows · Research',
                          'Strong fit',
                        ],
                        [
                          'Morrow',
                          'Lead Product Designer',
                          'Systems · Team leadership',
                          'Video requested',
                        ],
                        [
                          'Fieldstone',
                          'Product Designer',
                          'Accessible product design',
                          'Ready to prepare',
                        ],
                      ].map(([company, title, reason, status]) => (
                        <div className="source-job" key={company}>
                          <span className="source-company">{company![0]}</span>
                          <div>
                            <strong>{title}</strong>
                            <p>
                              {company} · {reason}
                            </p>
                          </div>
                          <small>{status}</small>
                        </div>
                      ))}
                      <div className="source-check">
                        <Icon name="check" size={16} />
                        <span>Duplicate roles grouped. Your exclusions kept.</span>
                      </div>
                    </>
                  ) : active === 1 ? (
                    <>
                      <div className="source-window-title">
                        <Icon name="file" size={20} />
                        <h4>A stronger case for Northstar.</h4>
                      </div>
                      <div className="source-tailoring">
                        <div className="source-mini-resume">
                          <h5>Alex Morgan</h5>
                          <span>Product Designer</span>
                          <hr />
                          <small>PROFILE</small>
                          <p>
                            Six years turning complex workflows into clear, accessible experiences.
                          </p>
                          <small>EXPERIENCE</small>
                          <strong>Senior Product Designer</strong>
                          <span>Meridian Studio · 2022—Present</span>
                          <p className="source-highlight">
                            Led discovery and interaction design for complex B2B reporting
                            workflows, translating customer research into clear, accessible product
                            experiences.
                          </p>
                          <p>
                            Partnered with eight engineers and a product manager to take a new
                            onboarding flow from interviews to release.
                          </p>
                        </div>
                        <div className="source-relevance">
                          <Icon name="check" size={20} />
                          <strong>Grounded in your experience.</strong>
                          <p>
                            Relevant work comes forward. New achievements never appear out of thin
                            air.
                          </p>
                          <span>
                            <Icon name="file" size={14} /> Resume tailored
                          </span>
                          <span>
                            <Icon name="file" size={14} /> Cover letter prepared
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="source-window-title">
                        <Icon name="shield" size={20} />
                        <h4>Keep your direction. Lose the busywork.</h4>
                      </div>
                      <div className="source-mode" role="group" aria-label="Application mode">
                        <button aria-pressed={!automatic} onClick={() => setAutomatic(false)}>
                          Review each application
                        </button>
                        <button aria-pressed={automatic} onClick={() => setAutomatic(true)}>
                          Autopilot within limits
                        </button>
                      </div>
                      <div className="source-application">
                        <span className="source-company">N</span>
                        <div>
                          <strong>Senior Product Designer</strong>
                          <p>Northstar · London · £85k–£105k</p>
                        </div>
                        <Icon name="check" size={18} />
                      </div>
                      <div className="source-delivery">
                        <Icon name="bell" size={22} />
                        <div>
                          <strong>
                            {automatic ? 'Your application is in.' : 'A role worth your attention.'}
                          </strong>
                          <p>
                            {automatic
                              ? 'Tailored material and a sample confirmation, together in your timeline.'
                              : 'Your resume and cover letter are ready. Review them before the next step.'}
                          </p>
                        </div>
                      </div>
                      <div className="source-check">
                        <Icon name="shield" size={16} />
                        <span>
                          {automatic
                            ? 'Your limits govern each application. Outreach still needs approval.'
                            : 'Your documents. Your decision. One clear next step.'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="source-window-footer">
                  <span>Fictional product walkthrough · no external actions</span>
                  <span>{active + 1} / 3</span>
                </div>
              </div>
              <div className="source-floating-note" aria-hidden="true">
                <Icon name={chapters[active]!.icon} size={17} />
                <span>
                  {active === 0
                    ? 'Less searching. More possibility.'
                    : active === 1
                      ? 'Your story, with the right emphasis.'
                      : 'A clear record of every next step.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WatchersShowcase() {
  const [checked, setChecked] = useState(false);
  return (
    <section className="watchers-story dark-frame" id="watchers">
      <div className="watchers-copy">
        <Icon name="bell" size={30} />
        <h2>
          Your favourite teams.
          <br />
          <span>On your radar.</span>
        </h2>
        <p>That company you keep coming back to? Let Pursuit keep an eye on its careers page.</p>
        <p>
          Follow the teams you care about. See a new role, understand the fit, and send it into your
          application pipeline without starting the search again.
        </p>
        <a href="/product-tour" className="text-link">
          Explore your career workspace <Icon name="arrowUpRight" size={15} />
        </a>
      </div>
      <div className="watcher-console">
        <div className="watcher-top">
          <span>
            <Icon name="bell" size={17} /> Company watchers
          </span>
          <small>Product preview</small>
        </div>
        <div className="watcher-url">
          <Icon name="globe" size={18} />
          <div>
            <strong>PostHog</strong>
            <span>posthog.com/careers</span>
          </div>
          <span className="watcher-pulse">{checked ? 'Change detected' : 'Watching'}</span>
        </div>
        <div className="watcher-rule">
          <span>Looking for</span>
          <strong>Your roles, locations and work preferences</strong>
        </div>
        <div className="watcher-history">
          <div>
            <Icon name="check" size={15} />
            <span>Compare with the previous version</span>
          </div>
          <div>
            <Icon name="check" size={15} />
            <span>Keep new roles, skip repeated listings</span>
          </div>
          <div>
            <Icon name="check" size={15} />
            <span>Check the fit before preparing anything</span>
          </div>
        </div>
        {checked && (
          <div className="watcher-found" role="status">
            <Icon name="bell" size={20} />
            <div>
              <strong>A new role to consider.</strong>
              <p>
                Example: Product Engineer. Check your requirements, then prepare the application.
              </p>
              <small>Simulated change, not a live PostHog vacancy.</small>
            </div>
          </div>
        )}
        <button className="dark-button" onClick={() => setChecked((v) => !v)}>
          <Icon name={checked ? 'check' : 'search'} size={16} />
          {checked ? 'Reset example' : 'Preview a new-role alert'}
        </button>
        <p className="watcher-boundary">
          Illustrative watcher. This preview does not poll the website or submit an application.
        </p>
      </div>
    </section>
  );
}
