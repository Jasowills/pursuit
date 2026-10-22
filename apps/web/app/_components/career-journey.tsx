'use client';
import { useEffect, useRef, useState } from 'react';
import { ResumeDocument, COVER_LETTER, VIDEO_SCRIPT, DeskIcon } from '@pursuit/ui/career-workspace';
import '@pursuit/ui/career-workspace.css';
import { Icon } from './icons';

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
          Not another dashboard.
          <br />
          <span>Your career assistant.</span>
        </h2>
        <p>
          Paste a job posting. Ask what’s moved forward. Work through your next application, with
          the context already beside you.
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
              src="/product/harness-dark.png"
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
  return (
    <section className="document-section dark-frame" id="features">
      <div className="section-heading-pair">
        <h2>
          Same experience.
          <br />
          <span>A stronger application.</span>
        </h2>
        <p>
          Your resume should read like you—and make it obvious why you belong in this role. Review
          every change before it goes anywhere.
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
                A reason to meet.
                <br />
                In your own voice.
              </h3>
              <p>
                Specific to the role. Grounded in your work. Written to open a conversation, not
                repeat your entire resume.
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
                <div className="video-preview">
                  <span className="camera-corners" />
                  <div>
                    <Icon name="monitor" size={44} />
                    <span>Your space. Your story.</span>
                  </div>
                  <span className="video-length">01:30</span>
                </div>
                <div className="video-request">
                  <Icon name="bell" size={18} />
                  <div>
                    <strong>Morrow asks for an introduction video.</strong>
                    <p>
                      Pursuit brings the requirement forward and helps you prepare before you
                      record.
                    </p>
                  </div>
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
                A 90-second introduction.
                <br />
                Already thought through.
              </h3>
              {VIDEO_SCRIPT.map(([time, title, copy]) => (
                <div key={time}>
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
  const titles = [
    'A role that fits you.',
    'Everything you need to decide.',
    'A clear yes, on your terms.',
    'One less loose end.',
  ];
  return (
    <section className="companion-band" id="companion">
      <div className="dark-frame companion-layout">
        <div className="companion-copy">
          <h2>
            Your next move.
            <br />
            In your pocket.
          </h2>
          <p>
            Your desktop does the work. Pursuit Connect brings the moments that need you to your
            phone.
          </p>
          <p>
            Review a new role on the train. Check your tailored resume. Approve the next step, then
            get on with your day.
          </p>
          <div className="companion-steps" role="group" aria-label="Companion workflow">
            {['Get the match', 'Review the role', 'Approve the next step', 'Get the update'].map(
              (s, i) => (
                <button key={s} onClick={() => setStage(i)} aria-pressed={stage === i}>
                  <span>{stage > i ? <Icon name="check" size={13} /> : i + 1}</span>
                  {s}
                  <Icon name="arrowUpRight" size={14} />
                </button>
              ),
            )}
          </div>
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
          <div className="phone-device">
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
              <span>Good morning, Alex</span>
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
                  <h4>A role worth your attention</h4>
                  <p>
                    Senior Product Designer at Northstar. A strong match for your B2B product
                    experience.
                  </p>
                  <button onClick={() => setStage(1)}>
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
                    B2B workflows, customer research and design systems—all part of your Meridian
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
                <button className="phone-primary" onClick={() => setStage(2)}>
                  Review approval <Icon name="arrowUpRight" size={13} />
                </button>
              </div>
            ) : stage === 2 ? (
              <div className="phone-content">
                <div className="phone-approval">
                  <Icon name="shield" size={30} />
                  <h4>You choose what leaves.</h4>
                  <p>
                    Northstar will receive your tailored resume, cover letter and the answers you
                    reviewed.
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
                <button className="phone-primary" onClick={() => setStage(3)}>
                  Approve sample application <Icon name="check" size={14} />
                </button>
                <small className="phone-disclosure">
                  Interactive preview. Nothing is submitted.
                </small>
              </div>
            ) : (
              <div className="phone-content">
                <div className="phone-complete">
                  <span>
                    <Icon name="check" size={30} />
                  </span>
                  <h4>Your application is in.</h4>
                  <p>Northstar · Senior Product Designer</p>
                  <div>
                    Resume, cover letter and sample confirmation saved to your application record.
                  </div>
                  <small>Sample scenario · no real submission</small>
                </div>
                <div className="phone-next">
                  <Icon name="clock" size={17} />
                  <p>Your next step is already on the radar.</p>
                </div>
                <button className="phone-primary" onClick={() => setStage(0)}>
                  Replay the journey <Icon name="arrowUpRight" size={13} />
                </button>
              </div>
            )}
            <div className="phone-bottom-nav">
              <span>
                <Icon name="home" size={16} /> Today
              </span>
              <span>
                <DeskIcon name="chat" size={16} /> Assistant
              </span>
              <span>
                <Icon name="briefcase" size={16} /> Applications
              </span>
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
          Find the right person.
          <br />
          <span>Say something worth reading.</span>
        </h2>
        <p>
          Cold outreach, with context. A relevant contact, a reason to reach out, and an
          introduction that sounds like you.
        </p>
      </div>
      <div className="outreach-story">
        <Enter className="sourcing-pipeline">
          <div className="sourcing-title">
            <Icon name="search" size={18} />
            <strong>From company to conversation.</strong>
          </div>
          <div className="source-record">
            <span>Target company</span>
            <strong>Northstar</strong>
            <p>B2B product · Senior Product Designer</p>
          </div>
          <div className="source-connector" />
          <div className="contact-record">
            <span className="contact-avatar">PS</span>
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
                Priya’s team is simplifying complex workflows. Your Meridian project gives you a
                specific, relevant starting point.
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
            <span>Your Gmail. Your introduction.</span>
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
            <br />I noticed Northstar is looking for a designer who can bring research and systems
            thinking together. At Meridian, I’ve been working on exactly that—simplifying B2B
            workflows while building a component library alongside engineering.
            <br />
            <br />
            I’d love to hear what your team is working to make simpler. Would you be open to a short
            conversation?
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
              Direct Google OAuth
            </button>
            <button aria-pressed={path === 'composio'} onClick={() => setPath('composio')}>
              Composio
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
          Close the laptop.
          <br />
          <span>Keep your momentum.</span>
        </h2>
        <p>
          Your search has a rhythm. Research, preparation, approvals and follow-ups shouldn’t depend
          on keeping every tab open.
        </p>
        <ul>
          {[
            [
              'search',
              'Research with your preferences',
              'Target roles, location, compensation and exclusions.',
            ],
            [
              'file',
              'Prepare before you return',
              'Tailored material, relevant contacts and clear next steps.',
            ],
            [
              'bell',
              'Bring the important moments to you',
              'A promising role. An approval. A video request. A completed application.',
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
        <div className="background-top">
          <span>
            <i /> Career autopilot
          </span>
          <span>Daily · 5 application limit</span>
        </div>
        <div className="background-run-summary">
          <strong>
            A morning’s work,
            <br />
            already organized.
          </strong>
          <span>Sample run / Alex’s career</span>
        </div>
        {[
          ['Review target sources', '128 roles reviewed · 4 shortlisted', 'Complete'],
          [
            'Tailor the Northstar application',
            'Resume and cover letter prepared',
            'Ready for review',
          ],
          ['Prepare the Morrow video', '90-second script and recording checklist', 'Needs you'],
          ['Apply to Bramble', 'Sample confirmation recorded', 'Complete'],
        ].map(([title, detail, status], i) => (
          <div className="background-run-row" key={title}>
            <span className={status === 'Complete' ? 'done' : ''}>
              <Icon name={status === 'Complete' ? 'check' : 'clock'} size={15} />
            </span>
            <div>
              <strong>{title}</strong>
              <p>{detail}</p>
            </div>
            <em>{status}</em>
          </div>
        ))}
        <div className="background-notification">
          <Icon name="bell" size={20} />
          <div>
            <strong>Pursuit has an update for you.</strong>
            <p>
              Your Northstar application is ready. Morrow needs a short introduction video—we’ve
              prepared a script to help.
            </p>
          </div>
        </div>
      </Enter>
    </section>
  );
}

export function ClosingInvitation() {
  const [prompt, setPrompt] = useState('Find the work that fits me.');
  return (
    <section className="closing-invitation">
      <div className="closing-grid" aria-hidden="true" />
      <div className="dark-frame">
        <div className="closing-copy">
          <h2>
            There’s a next chapter
            <br />
            with your name on it.
          </h2>
          <p>Give it a place to begin.</p>
          <form action="/product-tour">
            <label htmlFor="closing-prompt">Your next move</label>
            <div>
              <input
                id="closing-prompt"
                name="request"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={250}
              />
              <button type="submit" aria-label="Explore Pursuit with this request">
                <Icon name="arrowUpRight" size={23} />
              </button>
            </div>
            <span>Open the interactive product tour · no account needed</span>
          </form>
        </div>
        <div className="closing-art" aria-hidden="true">
          <div className="closing-orbit" />
          <div className="closing-letter">
            <span>YOUR NEXT CHAPTER</span>
            <strong>Alex Morgan</strong>
            <p>Product Designer</p>
            <div />
            <div />
            <div />
            <small>Experience that speaks for itself.</small>
          </div>
          <div className="closing-ping">
            <span>
              <Icon name="check" size={16} />
            </span>
            <div>
              <strong>A little closer.</strong>
              <p>Your next move starts with a conversation.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
