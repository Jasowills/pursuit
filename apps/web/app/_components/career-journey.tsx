'use client';
import { useEffect, useRef, useState } from 'react';
import { ResumeDocument, COVER_LETTER, VIDEO_SCRIPT, DeskIcon } from '@pursuit/ui/career-workspace';
import '@pursuit/ui/career-workspace.css';
import { Icon } from './icons';
import { ActivityLedger } from './activity-ledger';
import { PursuitMark } from './header';

function Enter({
  children,
  className = '',
  side = 'left',
}: {
  children: React.ReactNode;
  className?: string;
  side?: 'left' | 'right';
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const o = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.dataset.visible = 'true';
          o.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    el.dataset.motion = 'ready';
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return (
    <div ref={ref} className={`journey-enter ${className}`} data-side={side}>
      {children}
    </div>
  );
}
export function HarnessFeature() {
  return (
    <section className="dark-frame new-harness-section" id="product">
      <div className="section-heading-pair">
        <h2>
          Your search,
          <br />
          <span>in one workspace.</span>
        </h2>
        <p>
          Paste a posting, ask for a resume draft or check your application records. Choose which
          career facts to include as you work.
        </p>
      </div>
      <Enter>
        <figure className="new-harness-shot">
          <div>
            <span>
              <i /> Pursuit / Alex’s workspace
            </span>
            <a href="/product-tour" target="_blank" rel="noreferrer">
              Open interactive tour <Icon name="arrowUpRight" size={14} />
            </a>
          </div>
          <a
            href="/product-tour"
            target="_blank"
            rel="noreferrer"
            aria-label="Explore the Pursuit sample workspace"
          >
            <img
              src="/product/harness-dark.png?v=20261022-status"
              alt="Pursuit’s redesigned conversation workspace showing a product designer’s search, a tailored application and a job review notification. Fictional sample career in the actual desktop renderer."
              width={1536}
              height={1050}
              loading="lazy"
            />
          </a>
          <figcaption>
            Actual workspace interface with a fictional sample career. Explore the same components
            in the product tour.
          </figcaption>
        </figure>
      </Enter>
      <div className="harness-prompts">
        <span>“How many applications have we sent?”</span>
        <span>“Is this role a good fit for me?”</span>
        <span>“Help me prepare for this video.”</span>
      </div>
    </section>
  );
}

export function DocumentWorkshop() {
  const [view, setView] = useState<'resume' | 'letter' | 'video'>('resume');
  const [tailor, setTailor] = useState(true);
  const [scriptSection, setScriptSection] = useState(0);
  const [copyStatus, setCopyStatus] = useState('');
  function selectScriptSection(index: number) {
    setScriptSection(index);
    if (matchMedia('(max-width: 900px)').matches) {
      requestAnimationFrame(() => {
        const passage = document.querySelector<HTMLElement>(
          `.video-script-passage[data-section="${index}"]`,
        );
        passage?.focus({ preventScroll: true });
        passage?.scrollIntoView({
          block: 'center',
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        });
      });
    }
  }
  async function copyScript() {
    try {
      await navigator.clipboard.writeText(
        VIDEO_SCRIPT.map(([time, title, copy]) => `${time}: ${title}\n${copy}`).join('\n\n'),
      );
      setCopyStatus('Sample script copied. Replace Alex’s details with your own.');
    } catch {
      setCopyStatus('Copy is unavailable in this browser. Select the script text to copy it.');
    }
  }
  return (
    <section className="document-section dark-frame" id="features">
      <div className="section-heading-pair">
        <h2>
          Make your resume
          <br />
          <span>relevant to the role.</span>
        </h2>
        <p>
          Show the experience the employer is asking for. Compare the tailored draft with your
          original and check each claim.
        </p>
      </div>
      <div className="document-workbench">
        <div className="workbench-bar">
          <div role="group" aria-label="Application documents">
            {(['resume', 'letter', 'video'] as const).map((v) => (
              <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
                <Icon name={v === 'video' ? 'monitor' : 'file'} size={14} />
                {v === 'resume'
                  ? 'Resume tailoring'
                  : v === 'letter'
                    ? 'Cover letter'
                    : 'Video introduction'}
              </button>
            ))}
          </div>
          <span>
            {view === 'video'
              ? 'Morrow / Lead Product Designer'
              : 'Northstar / Senior Product Designer'}
          </span>
        </div>
        {view === 'resume' ? (
          <>
            <div className="document-brief">
              <div>
                <span>What the role needs</span>
                <p>B2B workflows · Customer research · Design systems · Engineering partnership</p>
              </div>
              <button
                className="document-switch"
                aria-pressed={tailor}
                onClick={() => setTailor(!tailor)}
              >
                <span data-on={tailor} />
                {tailor ? 'Changes highlighted' : 'Show tailored changes'}
              </button>
            </div>
            <div className="resume-comparison">
              <Enter>
                <div className="paper-caption">
                  <span>Your original</span>
                  <small>Career facts stay intact</small>
                </div>
                <ResumeDocument tailored={false} />
              </Enter>
              <Enter side="right">
                <div className="paper-caption">
                  <span>Tailored for Northstar</span>
                  <small>{tailor ? 'Role-specific emphasis' : 'Original emphasis'}</small>
                </div>
                <ResumeDocument tailored={tailor} />
              </Enter>
            </div>
            <div className="document-result">
              <Icon name="check" size={16} />
              <span>
                The profile and relevant experience take the lead. Your employers, dates and actual
                work stay the same.
              </span>
            </div>
          </>
        ) : view === 'letter' ? (
          <div className="cover-letter-workshop">
            <Enter className="letter-context">
              <Icon name="file" size={31} />
              <h3>
                Explain why
                <br />
                this role fits.
              </h3>
              <p>
                Connect one or two relevant projects to the employer’s needs. Keep the draft short,
                then edit it in your own words.
              </p>
              <ul>
                <li>
                  <Icon name="check" size={14} /> Connects your experience to the role
                </li>
                <li>
                  <Icon name="check" size={14} /> Uses real projects and responsibilities
                </li>
                <li>
                  <Icon name="check" size={14} /> Leaves room for your final edit
                </li>
              </ul>
            </Enter>
            <Enter side="right">
              <article className="marketing-letter">
                <header>
                  <strong>Alex Morgan</strong>
                  <span>alex.morgan@example.com · London, UK</span>
                </header>
                <h3>Senior Product Designer / Northstar</h3>
                <p>{COVER_LETTER}</p>
              </article>
            </Enter>
          </div>
        ) : (
          <div className="video-workshop">
            <Enter>
              <div className="video-studio">
                <div className="video-employer-brief">
                  <div className="video-employer-heading">
                    <span className="video-company-mark">M</span>
                    <div>
                      <strong>Morrow</strong>
                      <span>Lead Product Designer · Sample application</span>
                    </div>
                    <span className="video-duration">90 seconds</span>
                  </div>
                  <h3>A project you can speak about.</h3>
                  <p>
                    The application asks for a short introduction. Use one relevant project to
                    explain how you work.
                  </p>
                  <div className="video-project">
                    <Icon name="file" size={18} />
                    <div>
                      <strong>B2B reporting workspace</strong>
                      <p>Meridian Studio · Discovery through delivery</p>
                      <span>
                        Research with customers. Design alongside eight engineers. A clearer
                        reporting workflow.
                      </span>
                    </div>
                  </div>
                </div>
                <div className="video-outline" role="group" aria-label="Video script sections">
                  {VIDEO_SCRIPT.map(([time, title], index) => (
                    <button
                      key={time}
                      aria-pressed={scriptSection === index}
                      onClick={() => selectScriptSection(index)}
                    >
                      <span>{time}</span>
                      <strong>{title}</strong>
                      <Icon name="arrowUpRight" size={14} />
                    </button>
                  ))}
                </div>
                <div className="video-checklist">
                  <h4>Your recording checklist</h4>
                  {[
                    'Choose one project you can speak about comfortably',
                    'Put your camera at eye level and check your audio',
                    'Keep the script beside the camera, not over your story',
                    'Watch it once and check the sharing permissions',
                  ].map((t) => (
                    <label key={t}>
                      <input type="checkbox" />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
            </Enter>
            <Enter side="right" className="script-sheet">
              <h3>
                Prepare a clear
                <br />
                90-second introduction.
              </h3>
              <button className="video-copy-script" onClick={copyScript}>
                <Icon name="file" size={14} />
                Copy sample script
              </button>
              <p className="video-copy-status" role="status">
                {copyStatus}
              </p>
              {VIDEO_SCRIPT.map(([time, title, copy], index) => (
                <div
                  className="video-script-passage"
                  data-section={index}
                  tabIndex={-1}
                  data-selected={scriptSection === index}
                  key={time}
                >
                  <span>{time}</span>
                  <strong>{title}</strong>
                  <p>{copy}</p>
                </div>
              ))}
            </Enter>
          </div>
        )}
        <p className="workbench-note">
          Product scenario using Alex’s fictional career. Documents and video guidance are
          illustrative; the tour does not generate or send an application.
        </p>
      </div>
    </section>
  );
}

export function CompanionShowcase() {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [onScreen, setOnScreen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReduced(media.matches);
    const visibility = () => setPageVisible(!document.hidden);
    motion();
    visibility();
    media.addEventListener('change', motion);
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((e) => e.isIntersecting)),
      { threshold: 0.25 },
    );
    if (section.current) observer.observe(section.current);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', motion);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  useEffect(() => {
    if (!playing || !onScreen || reduced || !pageVisible || stage > 3) return;
    const timer = setTimeout(() => setStage((s) => (s + 1) % 4), 2600);
    return () => clearTimeout(timer);
  }, [playing, onScreen, reduced, pageVisible, stage]);
  function selectStage(next: number) {
    setPlaying(false);
    setStage(next);
  }
  const titles = [
    'A new role to review.',
    'Review this role.',
    'Approve the next step.',
    'Application recorded.',
    'Prepare your introduction.',
    'Ask about your search.',
    'Your applications.',
  ];
  return (
    <section className="companion-band" id="companion" ref={section}>
      <div className="dark-frame companion-layout">
        <div className="companion-copy">
          <h2>
            Review applications
            <br />
            from your phone.
          </h2>
          <p>
            Check a role and its documents without returning to your desk. The companion preview
            shows the decisions you can review on your phone.
          </p>
          <p>
            Read the tailored resume, approve the next step and see the result. Pairing and mobile
            releases are not available in this alpha.
          </p>
          <div className="companion-steps" role="group" aria-label="Companion workflow">
            {['Get the match', 'Review the role', 'Approve the next step', 'Get the update'].map(
              (s, i) => (
                <button key={s} onClick={() => selectStage(i)} aria-pressed={stage === i}>
                  <span>{stage > i ? <Icon name="check" size={13} /> : i + 1}</span>
                  {s}
                  <Icon name="arrowUpRight" size={14} />
                </button>
              ),
            )}
          </div>
          {!reduced && (
            <button
              className="companion-playback"
              onClick={() => {
                if (stage > 3) setStage(0);
                setPlaying((v) => !v);
              }}
              aria-pressed={playing}
            >
              <Icon name={playing ? 'pause' : 'arrowUpRight'} size={14} />
              {playing ? 'Pause preview' : 'Play preview'}
            </button>
          )}
          <small>Companion product preview · fictional sample career · no external actions</small>
        </div>
        <Enter side="right" className="companion-devices">
          <div className="companion-note">
            <span>
              <Icon name="monitor" size={16} /> Desktop
            </span>
            <strong>Application prepared</strong>
            <p>
              Resume tailored. Cover letter ready.
              <br />
              Waiting for Alex’s decision.
            </p>
            <div>
              <i /> Your desktop stays in control
            </div>
          </div>
          <div className="phone-device companion-refined" data-preview-stage={stage}>
            <div className="phone-notch" />
            <div className="phone-status">
              <strong>9:41</strong>
              <span>
                <i />
                <i />
                <i />
              </span>
            </div>
            <div className="phone-app-header">
              <span className="phone-mark">
                <Icon name="arrowUpRight" size={18} />
              </span>
              <strong>
                pursuit<span>.</span>
              </strong>
              <Icon name="bell" size={17} />
            </div>
            <div className="phone-greeting">
              <h3>{titles[stage]}</h3>
            </div>
            {stage === 0 ? (
              <div className="phone-content">
                <div className="phone-push">
                  <div>
                    <span className="phone-mark">
                      <Icon name="arrowUpRight" size={13} />
                    </span>
                    <strong>PURSUIT</strong>
                    <small>now</small>
                  </div>
                  <div className="phone-match-heading">
                    <span>N</span>
                    <div>
                      <small>Northstar · London</small>
                      <h4>Senior Product Designer</h4>
                    </div>
                  </div>
                  <p>£85k–£105k · Hybrid Your B2B product experience matches this role.</p>
                  <button onClick={() => selectStage(1)}>
                    Review the opportunity <Icon name="arrowUpRight" size={12} />
                  </button>
                </div>
                <div className="phone-summary">
                  <span>Your search today</span>
                  <div>
                    <strong>4</strong>
                    <span>shortlisted roles</span>
                  </div>
                  <div>
                    <strong>1</strong>
                    <span>application to review</span>
                  </div>
                </div>
              </div>
            ) : stage === 1 ? (
              <div className="phone-content">
                <div className="phone-role">
                  <span>N</span>
                  <h4>Senior Product Designer</h4>
                  <p>Northstar · London / Hybrid</p>
                  <strong>£85k–£105k</strong>
                </div>
                <div className="phone-fit">
                  <strong>Why this fits</strong>
                  <p>
                    B2B workflows, customer research and design systems, all part of your Meridian
                    experience.
                  </p>
                </div>
                <div className="phone-files">
                  <span>
                    <Icon name="file" size={14} /> Tailored resume <Icon name="check" size={12} />
                  </span>
                  <span>
                    <Icon name="file" size={14} /> Cover letter <Icon name="check" size={12} />
                  </span>
                </div>
                <button className="phone-primary" onClick={() => selectStage(2)}>
                  Review approval <Icon name="arrowUpRight" size={13} />
                </button>
              </div>
            ) : stage === 2 ? (
              <div className="phone-content">
                <div className="phone-approval">
                  <Icon name="shield" size={30} />
                  <h4>Ready for your approval.</h4>
                  <p>
                    Review the exact documents prepared for Northstar before approving this sample
                    application.
                  </p>
                  <div>
                    <span>Application</span>
                    <strong>Senior Product Designer</strong>
                  </div>
                  <div>
                    <span>Outreach</span>
                    <strong>Not included</strong>
                  </div>
                </div>
                <button className="phone-primary" onClick={() => selectStage(3)}>
                  Approve sample application <Icon name="check" size={14} />
                </button>
                <small className="phone-disclosure">
                  Interactive preview. Nothing is submitted.
                </small>
              </div>
            ) : stage === 4 ? (
              <div className="phone-content phone-video-plan">
                <span className="phone-section-label">Morrow / Introduction video</span>
                <p>A 90-second story, grounded in your experience.</p>
                {VIDEO_SCRIPT.slice(0, 2).map(([time, title, copy]) => (
                  <div key={time}>
                    <small>{time}</small>
                    <strong>{title}</strong>
                    <p>{copy}</p>
                  </div>
                ))}
                <a href="#features" className="phone-primary">
                  Explore video preparation <Icon name="arrowUpRight" size={13} />
                </a>
              </div>
            ) : stage === 5 ? (
              <div className="phone-content phone-chat-preview">
                <div className="phone-chat-question">How is my search going?</div>
                <div>
                  <span className="phone-mark">
                    <Icon name="arrowUpRight" size={14} />
                  </span>
                  <p>
                    In this sample career, you have four shortlisted roles, one application to
                    review, and a video introduction to prepare. Bramble has a sample application
                    confirmation.
                  </p>
                  <small>Illustrative assistant response</small>
                </div>
                <button className="phone-primary" onClick={() => selectStage(1)}>
                  Review the application <Icon name="arrowUpRight" size={13} />
                </button>
              </div>
            ) : stage === 6 ? (
              <div className="phone-content phone-application-list">
                {[
                  ['Northstar', 'Senior Product Designer', 'Ready for review'],
                  ['Morrow', 'Lead Product Designer', 'Video requested'],
                  ['Fieldstone', 'Product Designer', 'Prepared'],
                  ['Bramble', 'Senior Experience Designer', 'Sample applied'],
                ].map(([company, role, status]) => (
                  <button key={company} onClick={() => selectStage(company === 'Morrow' ? 4 : 1)}>
                    <strong>{company}</strong>
                    <span>{role}</span>
                    <small>{status}</small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="phone-content">
                <div className="phone-complete">
                  <span>
                    <Icon name="check" size={30} />
                  </span>
                  <h4>Application recorded.</h4>
                  <p>Northstar · Senior Product Designer</p>
                  <div>09:42 · Sample confirmation saved Resume v3 · Cover letter v2</div>
                  <small>Sample scenario · no real submission</small>
                </div>
                <div className="phone-next">
                  <Icon name="clock" size={17} />
                  <p>Your next step is already on the radar.</p>
                </div>
                <button className="phone-primary" onClick={() => selectStage(0)}>
                  Replay the journey <Icon name="arrowUpRight" size={13} />
                </button>
              </div>
            )}
            <div className="phone-bottom-nav">
              <button onClick={() => selectStage(0)} aria-pressed={stage === 0}>
                <Icon name="home" size={16} /> Today
              </button>
              <button onClick={() => selectStage(5)} aria-pressed={stage === 5}>
                <DeskIcon name="chat" size={16} /> Assistant
              </button>
              <button onClick={() => selectStage(6)} aria-pressed={stage === 6}>
                <Icon name="briefcase" size={16} /> Applications
              </button>
            </div>
            <div className="phone-home-indicator" />
          </div>
        </Enter>
      </div>
    </section>
  );
}

export function OutreachShowcase() {
  const [path, setPath] = useState<'google' | 'composio'>('google');
  const [review, setReview] = useState(false);
  return (
    <section className="outreach-section dark-frame" id="outreach">
      <div className="section-heading-pair">
        <h2>
          Reach out
          <br />
          <span>with a reason to talk.</span>
        </h2>
        <p>
          Start with a relevant person and work you can discuss. Review the source, recipient and
          exact message before sending through Gmail.
        </p>
      </div>
      <div className="outreach-story">
        <Enter className="sourcing-pipeline">
          <div className="sourcing-title">
            <Icon name="search" size={18} />
            <strong>Research the contact before writing</strong>
          </div>
          <div className="source-record">
            <span>Target company</span>
            <strong>Northstar</strong>
            <p>B2B product · Senior Product Designer</p>
          </div>
          <div className="source-connector" />
          <div className="contact-record">
            <img
              className="contact-avatar"
              src="/photos/contact-portrait.jpg"
              alt="Illustrative stock portrait for a fictional contact"
              width={40}
              height={40}
              loading="lazy"
            />
            <div>
              <strong>Priya Shah</strong>
              <span>Design Lead / Northstar</span>
              <small>Sample team page · northstar.example/team</small>
            </div>
            <Icon name="user" size={16} />
          </div>
          <div className="source-connector" />
          <div className="source-context">
            <Icon name="file" size={18} />
            <div>
              <strong>A reason to reach out</strong>
              <p>
                The sample team page mentions B2B reporting. Alex’s Meridian project gives this
                introduction a relevant example.
              </p>
            </div>
          </div>
          <p className="sourcing-note">
            Contact details in this example are fictional. Real outreach needs a legitimate source
            and your approval.
          </p>
        </Enter>
        <Enter side="right" className="outreach-draft">
          <div className="outreach-mailbar">
            <img src="/brands/gmail.svg" width={24} height={20} alt="Gmail" />
            <span>Gmail draft</span>
            <small>Draft</small>
          </div>
          <div className="outreach-field">
            <span>To</span>priya@northstar.example
          </div>
          <div className="outreach-field">
            <span>Subject</span>The design work behind a clearer workflow
          </div>
          <div className="outreach-body">
            Hi Priya,
            <br />
            <br />
            Your B2B reporting role caught my eye. At Meridian, I work with customers and engineers
            to simplify reporting workflows, and I’ve helped build the team’s component library.
            <br />
            <br />
            I’d be interested to hear how your team approaches that work. Would you have time for a
            short conversation?
            <br />
            <br />
            Alex
          </div>
          <div className="outreach-review">
            <span>
              <Icon name="shield" size={15} /> You approve the exact message
            </span>
            <button onClick={() => setReview(!review)}>
              {review ? 'Message reviewed' : 'Review draft'}
              <Icon name="arrowUpRight" size={13} />
            </button>
          </div>
          {review && (
            <p role="status" className="outreach-review-note">
              Sample message reviewed. No email was sent.
            </p>
          )}
        </Enter>
      </div>
      <div className="gmail-connect-story">
        <div>
          <img src="/brands/gmail.svg" alt="" width={38} height={30} />
          <div>
            <h3>Connect the inbox you already use.</h3>
            <p>
              Choose direct Google authorization or Composio. Connection and consent stay separate
              from sending.
            </p>
          </div>
        </div>
        <div className="gmail-connection-picker">
          <div role="group" aria-label="Gmail connection method">
            <button aria-pressed={path === 'google'} onClick={() => setPath('google')}>
              <img src="/brands/gmail.svg" alt="" width={20} height={20} /> Direct Google OAuth
            </button>
            <button aria-pressed={path === 'composio'} onClick={() => setPath('composio')}>
              <img src="/brands/composio.svg" alt="" width={20} height={20} /> Composio
            </button>
          </div>
          <div className="gmail-consent" aria-live="polite">
            <Icon name="lock" size={15} />
            <span>
              {path === 'google'
                ? 'Choose your Google account, review permissions, then return to Pursuit.'
                : 'Authorize your Gmail connection through your configured Composio project.'}
            </span>
            <Icon name="arrowUpRight" size={15} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function BackgroundShowcase() {
  return (
    <section className="background-section dark-frame" id="autopilot">
      <div className="background-copy">
        <h2>
          Let the search run.
          <br />
          <span>Review what needs you.</span>
        </h2>
        <p>
          Set your target roles and limits. Use the activity log to review source checks, prepared
          drafts and decisions waiting for you.
        </p>
        <ul>
          {[
            [
              'search',
              'Search with your requirements',
              'Target roles, location, compensation and exclusions.',
            ],
            [
              'file',
              'Review prepared documents',
              'Keep each resume draft and cover letter with its role.',
            ],
            [
              'bell',
              'See what needs attention',
              'Approval requests, video requirements and application outcomes.',
            ],
          ].map(([icon, title, copy]) => (
            <li key={title}>
              <Icon name={icon as 'search'} size={19} />
              <div>
                <strong>{title}</strong>
                <p>{copy}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Enter side="right" className="background-runs">
        <ActivityLedger />
      </Enter>
    </section>
  );
}

export function ClosingInvitation() {
  const [step, setStep] = useState(0);
  const starts = [
    {
      label: 'Find a role',
      title: 'A wider search.',
      detail: 'Start with the work you want to do.',
      request: 'Find roles that fit my experience.',
    },
    {
      label: 'Tailor a resume',
      title: 'Your experience. In focus.',
      detail: 'See how the same facts fit a different role.',
      request: 'Help tailor my resume to this role.',
    },
    {
      label: 'Review an application',
      title: 'One clear next step.',
      detail: 'Review the role and the material beside it.',
      request: 'Review my application before I apply.',
    },
  ];
  const selected = starts[step]!;
  return (
    <section className="next-move" aria-labelledby="next-move-title" data-step={step}>
      <div className="dark-frame next-move-inner">
        <div className="next-move-heading">
          <h2 id="next-move-title">Your move.</h2>
          <p>Start with one role. Put the rest in order.</p>
        </div>
        <div className="next-move-stage">
          <div className="next-move-sheets" aria-hidden="true">
            <div className="move-sheet move-sheet-back">
              <span>THE SEARCH</span>
              <i />
              <i />
              <i />
            </div>
            <div className="move-sheet move-sheet-middle">
              <span>YOUR EXPERIENCE</span>
              <i />
              <i />
              <i />
            </div>
            <div className="move-sheet move-sheet-front">
              <PursuitMark size={32} />
              <strong>{selected.title}</strong>
              <span>Ready to look closer.</span>
              <i />
              <i />
            </div>
          </div>
          <div className="next-move-track" role="group" aria-label="Choose where to start">
            {starts.map((start, i) => (
              <button key={start.label} aria-pressed={step === i} onClick={() => setStep(i)}>
                <span className="move-track-dot" aria-hidden="true" />
                {start.label}
              </button>
            ))}
          </div>
          <p className="next-move-caption" aria-live="polite">
            {selected.detail}
          </p>
        </div>
        <div className="next-move-actions">
          <a href="#download" className="dark-button primary">
            Get Pursuit <Icon name="arrowUpRight" size={18} />
          </a>
          <a
            href={`/product-tour?request=${encodeURIComponent(selected.request)}`}
            className="next-move-tour"
          >
            Explore the workspace <Icon name="arrowUpRight" size={17} />
          </a>
        </div>
        <p className="next-move-note">
          Source alpha. The tour uses a fictional career and submits nothing.
        </p>
      </div>
    </section>
  );
}
