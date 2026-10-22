'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';
import { StatusBadge } from '@pursuit/ui/status';

const chapters = [
  {
    label: 'Find the opportunities',
    title: 'Search beyond the job board.',
    copy: 'Bring career pages, job boards and company watchers into one search. Keep the roles that match your work and where you can do it.',
  },
  {
    label: 'Check the requirements',
    title: 'Check the details before applying.',
    copy: 'Compare location, pay and required experience. Flag missing information instead of treating it as a match.',
  },
  {
    label: 'Tailor your resume',
    title: 'Put the relevant work first.',
    copy: 'Use the projects and skills that answer this posting. Compare the changes with your original resume before you approve them.',
  },
  {
    label: 'Prepare your application',
    title: 'Prepare what the employer asks for.',
    copy: 'Review a cover letter for the role. If the application needs a video, work from a short script and a recording checklist.',
  },
  {
    label: 'Apply and keep track',
    title: 'Choose how each application proceeds.',
    copy: 'Review a prepared application or use autopilot within limits you set. Keep the documents and the outcome with the role.',
  },
  {
    label: 'Get the update',
    title: 'Know what needs your attention.',
    copy: 'See the receipt, the next step or a request for your input. Pick up the review on your phone when you are away from your desk.',
  },
] as const;

function SourceScene({
  active,
  submitted,
  onApprove,
}: {
  active: number;
  submitted: boolean;
  onApprove: () => void;
}) {
  if (active === 0)
    return (
      <>
        <div className="source-window-title">
          <Icon name="search" size={20} />
          <h4>Sourcing product design roles</h4>
        </div>
        <div className="source-sourcing-line">
          <span className="source-search-dot" />
          <span>Demo search: career pages, job boards and company watchers</span>
        </div>
        <div className="source-filter">
          <span>Product design</span>
          <span>London / Remote</span>
          <span>£80k+</span>
        </div>
        <div className="source-job-head">
          <span>Opportunity</span>
          <span>Review status</span>
        </div>
        {[
          [
            'Northstar',
            'Senior Product Designer',
            'B2B workflows · Research',
            'Strong fit',
            'positive',
          ],
          [
            'Morrow',
            'Lead Product Designer',
            'Systems · Team leadership',
            'Video requested',
            'attention',
          ],
          [
            'Fieldstone',
            'Product Designer',
            'Accessible product design',
            'Ready to prepare',
            'positive',
          ],
          [
            'Harbor',
            'Design Director',
            'On-site in New York · Outside your location',
            'Not a fit',
            'negative',
          ],
        ].map(([company, title, reason, status, tone]) => (
          <div className="source-job" key={company}>
            <span className="source-company">{company![0]}</span>
            <div>
              <strong>{title}</strong>
              <p>
                {company} · {reason}
              </p>
            </div>
            <StatusBadge tone={tone as 'positive' | 'attention' | 'negative'}>{status}</StatusBadge>
          </div>
        ))}
        <div className="source-check">
          <Icon name="check" size={16} />
          <span>Group repeated listings. Keep your exclusions.</span>
        </div>
      </>
    );
  if (active === 1)
    return (
      <>
        <div className="source-window-title">
          <Icon name="shield" size={20} />
          <h4>Check Northstar against your requirements</h4>
        </div>
        <div className="source-fit-heading">
          <div>
            <strong>Senior Product Designer</strong>
            <p>Northstar · London / Hybrid</p>
          </div>
          <StatusBadge tone="attention">One detail to verify</StatusBadge>
        </div>
        <div className="source-fit-list">
          {[
            ['Role', 'Senior product design', 'Matches', 'positive'],
            ['Location', 'London with hybrid working', 'Matches', 'positive'],
            ['Salary', '£85k–£105k · your minimum is £80k', 'Matches', 'positive'],
            ['Experience', 'Research, B2B workflows and design systems', 'Relevant', 'positive'],
            [
              'Work authorization',
              'The posting does not confirm sponsorship',
              'Check required',
              'attention',
            ],
          ].map(([label, detail, status, tone]) => (
            <div key={label}>
              <span>{label}</span>
              <div>{detail}</div>
              <StatusBadge tone={tone as 'positive' | 'attention'}>{status}</StatusBadge>
            </div>
          ))}
        </div>
        <p className="source-scene-note">
          Keep the role for review. An unknown requirement is not confirmed eligibility.
        </p>
      </>
    );
  if (active === 2)
    return (
      <>
        <div className="source-window-title">
          <Icon name="file" size={20} />
          <h4>Tailor Alex’s resume for Northstar</h4>
        </div>
        <div className="source-tailoring">
          <div className="source-mini-resume">
            <h5>Alex Morgan</h5>
            <span>Product Designer</span>
            <hr />
            <small>PROFILE</small>
            <p>
              Product designer with six years of experience in B2B workflows, research and
              accessible interfaces.
            </p>
            <small>EXPERIENCE</small>
            <strong>Senior Product Designer</strong>
            <span>Meridian Studio · 2022–Present</span>
            <p className="source-highlight">
              Led discovery and interaction design for B2B reporting workflows, using customer
              research to simplify complex tasks.
            </p>
            <p>
              Partnered with eight engineers and a product manager to take an onboarding flow from
              interviews to release.
            </p>
          </div>
          <div className="source-relevance">
            <StatusBadge tone="positive">Ready to review</StatusBadge>
            <strong>Your experience, selected for this role.</strong>
            <p>
              The example brings Alex’s B2B work forward. Check each change against the original
              career facts.
            </p>
            <span>
              <Icon name="check" size={14} /> Relevant projects first
            </span>
            <span>
              <Icon name="check" size={14} /> Original resume kept
            </span>
            <a href="#features" className="text-link">
              Compare the full resume <Icon name="arrowUpRight" size={14} />
            </a>
          </div>
        </div>
      </>
    );
  if (active === 3)
    return (
      <>
        <div className="source-window-title">
          <Icon name="file" size={20} />
          <h4>Prepare the rest of the application</h4>
        </div>
        <div className="source-letter-preview">
          <div>
            <strong>Cover letter · Northstar</strong>
            <StatusBadge tone="positive">Draft ready</StatusBadge>
          </div>
          <p>Dear Northstar team,</p>
          <p>
            At Meridian Studio, I lead discovery and interaction design for B2B reporting tools.
            Your focus on complex workflows is close to the work I do with customers and engineers.
          </p>
          <p>
            I would welcome the chance to discuss how that experience could support your product
            team.
          </p>
          <span>Alex Morgan</span>
        </div>
        <div className="source-video-task">
          <Icon name="monitor" size={20} />
          <div>
            <strong>Another role asks for a video</strong>
            <p>
              Morrow · 90-second introduction. Script and recording checklist prepared for review.
            </p>
          </div>
          <StatusBadge tone="attention">Needs you</StatusBadge>
        </div>
      </>
    );
  if (active === 4)
    return (
      <>
        <div className="source-window-title">
          <Icon name="shield" size={20} />
          <h4>Review the Northstar application</h4>
        </div>
        <div className="source-application">
          <span className="source-company">N</span>
          <div>
            <strong>Senior Product Designer</strong>
            <p>Northstar · London · £85k–£105k</p>
          </div>
          <StatusBadge tone={submitted ? 'positive' : 'attention'}>
            {submitted ? 'Recorded' : 'Your approval'}
          </StatusBadge>
        </div>
        <ol className="application-progress">
          <li>
            <Icon name="check" size={14} />
            <div>
              <strong>Material prepared</strong>
              <span>Tailored resume and cover letter attached</span>
            </div>
          </li>
          <li>
            <Icon name="check" size={14} />
            <div>
              <strong>Preferences checked</strong>
              <span>Your location, pay range and confirmed career facts</span>
            </div>
          </li>
          <li>
            <Icon name={submitted ? 'check' : 'clock'} size={14} />
            <div>
              <strong>
                {submitted ? 'Sample application recorded' : 'Waiting for your decision'}
              </strong>
              <span>
                {submitted
                  ? 'The sample outcome stays with this role'
                  : 'Review the documents before approving'}
              </span>
            </div>
          </li>
        </ol>
        <div className="source-delivery">
          <Icon name="bell" size={22} />
          <div>
            <strong>
              {submitted ? 'Your application is in.' : 'Northstar is ready for review.'}
            </strong>
            <p>
              {submitted
                ? 'This preview recorded a sample confirmation. It did not submit an application.'
                : 'Review the tailored resume and cover letter, then approve the next step.'}
            </p>
          </div>
        </div>
        <button className="dark-button source-approve" onClick={onApprove}>
          {submitted ? 'Replay application preview' : 'Approve sample application'}
          <Icon name={submitted ? 'clock' : 'arrowUpRight'} size={14} />
        </button>
        <div className="source-check">
          <Icon name="shield" size={16} />
          <span>Autopilot follows your limits. Outreach requires a separate approval.</span>
        </div>
      </>
    );
  return (
    <>
      <div className="source-window-title">
        <Icon name="bell" size={20} />
        <h4>Catch up on your search</h4>
      </div>
      <div className="source-update-list">
        <div>
          <span className="source-update-icon">
            <Icon name="check" size={18} />
          </span>
          <div>
            <strong>Bramble application recorded</strong>
            <p>Sample receipt SAMPLE-ONLY-1042 · resume and letter saved with the role.</p>
          </div>
          <StatusBadge tone="positive">Complete</StatusBadge>
        </div>
        <div>
          <span className="source-update-icon">
            <Icon name="file" size={18} />
          </span>
          <div>
            <strong>Northstar needs a review</strong>
            <p>Check the documents and the sponsorship question before proceeding.</p>
          </div>
          <StatusBadge tone="attention">Needs you</StatusBadge>
        </div>
        <div>
          <span className="source-update-icon">
            <Icon name="monitor" size={18} />
          </span>
          <div>
            <strong>Morrow asks for a video</strong>
            <p>Open the script, record your introduction and add the link.</p>
          </div>
          <StatusBadge tone="attention">Needs you</StatusBadge>
        </div>
      </div>
      <a className="source-phone-link" href="#companion">
        <Icon name="phone" size={22} />
        <div>
          <strong>Review from your phone</strong>
          <span>See the companion preview</span>
        </div>
        <Icon name="arrowUpRight" size={16} />
      </a>
      <p className="source-scene-note">
        Sample updates show the intended workflow. No employer or inbox was contacted.
      </p>
    </>
  );
}

export function SourceStory() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [submitted, setSubmitted] = useState(false);
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
        view.style.removeProperty('--rail-opacity');
        view.querySelector<HTMLElement>('.source-story-copy')?.removeAttribute('inert');
        view.querySelectorAll<HTMLElement>('.source-scene-layer').forEach((layer) => {
          layer.style.removeProperty('opacity');
          layer.style.removeProperty('transform');
          layer.style.removeProperty('pointer-events');
        });
        return;
      }
      const rect = track.getBoundingClientRect();
      const progress = Math.max(
        0,
        Math.min(0.999, -rect.top / Math.max(1, track.offsetHeight - innerHeight)),
      );
      const position = progress * chapters.length;
      setActive(Math.floor(position));
      // Continuous camera and panel coordinates; scrolling backwards rewinds the same stage.
      const chapter = Math.floor(position);
      const local = position - chapter;
      const ease = (x: number) => {
        const t = Math.max(0, Math.min(1, x));
        return t * t * (3 - 2 * t);
      };
      view.style.setProperty('--story-progress', String(progress));
      // A camera keyframe track: list overview, requirements close-up, full-width
      // paper, supporting material, approval and the final receipt overview.
      const cameras = [
        [0.94, 0],
        [1.04, -12],
        [1.19, -112],
        [1.03, -28],
        [1.15, -95],
        [0.98, -10],
        [0.98, -10],
      ];
      const from = cameras[chapter]!;
      const to = cameras[chapter + 1]!;
      const travel = ease((local - 0.64) / 0.36);
      view.style.setProperty('--camera-scale', String(from[0]! + (to[0]! - from[0]!) * travel));
      view.style.setProperty('--camera-x', `${from[1]! + (to[1]! - from[1]!) * travel}px`);
      const railOpacity =
        chapter === 2 || chapter === 4
          ? 0
          : chapter === 1 || chapter === 3
            ? 1 - travel
            : chapter === 5
              ? ease(local / 0.2)
              : 1;
      view.style.setProperty('--rail-opacity', String(railOpacity));
      const rail = view.querySelector<HTMLElement>('.source-story-copy');
      if (rail) rail.inert = railOpacity < 0.5;
      view.querySelectorAll<HTMLElement>('.source-scene-layer').forEach((layer, index) => {
        const distance = index - chapter;
        const leaving = ease((local - 0.82) / 0.18);
        const opacity = distance === 0 ? 1 - leaving : distance === 1 ? leaving : 0;
        layer.style.opacity = String(opacity);
        layer.style.transform = `translate3d(${distance === 0 ? -leaving * 45 : (1 - leaving) * 90}px, ${distance === 0 ? 0 : (1 - leaving) * 20}px, 0) scale(${distance === 0 ? 1 + leaving * 0.025 : 0.96 + leaving * 0.04})`;
        layer.style.pointerEvents = distance === 0 ? 'auto' : 'none';
      });
      view.style.setProperty('--focus', String(ease((local - 0.22) / 0.5)));

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
          From the search
          <br />
          <span>to the next application.</span>
        </h2>
        <p>
          Follow a sample search through the workspace, from a new role to the documents and
          decisions it needs.
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
                <div className="source-window-body source-film">
                  {chapters.map((chapter, index) => (
                    <div
                      className="source-scene-layer"
                      key={chapter.label}
                      data-scene={index}
                      data-current={active === index}
                      aria-hidden={active !== index}
                      inert={active !== index}
                    >
                      <SourceScene
                        active={index}
                        submitted={submitted}
                        onApprove={() => setSubmitted((v) => !v)}
                      />
                    </div>
                  ))}
                  <div className="source-focus-caption" aria-hidden="true">
                    <span>{String(active + 1).padStart(2, '0')}</span>
                    {
                      [
                        'A wider search. One shortlist.',
                        'Requirements checked before preparation.',
                        'Your experience, tailored to this role.',
                        'Documents and answers in one place.',
                        'Your decision, with the evidence beside it.',
                        'A record you can return to.',
                      ][active]
                    }
                  </div>
                </div>
                <div className="source-window-footer">
                  <span>Fictional product walkthrough · no external actions</span>
                  <div className="source-frame-controls">
                    <button
                      onClick={() => select(Math.max(0, active - 1))}
                      disabled={active === 0}
                      aria-label="Previous walkthrough step"
                    >
                      <Icon name="arrowUpRight" size={14} />
                    </button>
                    <span>
                      {active + 1} / {chapters.length}
                    </span>
                    <button
                      onClick={() => select(Math.min(chapters.length - 1, active + 1))}
                      disabled={active === chapters.length - 1}
                      aria-label="Next walkthrough step"
                    >
                      <Icon name="arrowUpRight" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WatchersShowcase() {
  return (
    <section className="watchers-story dark-frame" id="watchers">
      <div className="watcher-console">
        <div className="watcher-top">
          <span>
            <Icon name="bell" size={17} /> Company watchers
          </span>
          <small>Product preview</small>
        </div>
        <div className="watcher-url">
          <img
            className="watcher-company-logo"
            src="/brands/posthog.svg"
            alt="PostHog"
            width={34}
            height={34}
          />
          <div>
            <strong>PostHog</strong>
            <span>posthog.com/careers</span>
          </div>
          <StatusBadge tone="positive">Watching</StatusBadge>
        </div>
        <div className="watcher-other-companies">
          {[
            ['Stripe', 'stripe.svg', 'stripe.com/jobs'],
            ['Linear', 'linear.svg', 'linear.app/careers'],
            ['Cloudflare', 'cloudflare.png', 'cloudflare.com/careers'],
          ].map(([name, logo, url]) => (
            <div key={name}>
              <img src={`/brands/${logo}`} alt={name} width={28} height={28} />
              <div>
                <strong>{name}</strong>
                <span>{url}</span>
              </div>
              <small>Example watch</small>
            </div>
          ))}
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
        <p className="watcher-boundary">
          Illustrative watcher. This preview does not poll the website or submit an application.
        </p>
      </div>
      <div className="watchers-copy">
        <Icon name="bell" size={30} />
        <h2>
          Hear when a team
          <br />
          <span>you follow is hiring.</span>
        </h2>
        <p>Keep a watch on the companies you want to join, with your roles and locations saved.</p>
        <p>
          The preview shows how a new listing enters your search. Check the fit, then prepare an
          application without re-entering the company details.
        </p>
        <a href="/product-tour" className="text-link">
          Explore your career workspace <Icon name="arrowUpRight" size={15} />
        </a>
      </div>
    </section>
  );
}
