'use client';
import { SourcingPanel, EngineHistory } from './SourcingPanel';
import { ApplicationReview } from './ApplicationReview';
import type { EngineClient, EngineProgress } from '@pursuit/career-engine/contracts';
import { FollowupPanel } from './FollowupPanel';
import { TailoringStudio } from './TailoringStudio';
import { StatusBadge } from './status';
import React, { useEffect, useRef, useState } from 'react';
import {
  CareerBook,
  CareerScreen,
  EMPTY_BOOK,
  Opportunity,
  RESUME,
  COVER_LETTER,
  VIDEO_SCRIPT,
  sampleBook,
} from './career-data';
export { EMPTY_BOOK, sampleBook, RESUME, COVER_LETTER, VIDEO_SCRIPT };
export type { CareerBook, CareerScreen, Opportunity };
export function DeskIcon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    chat: (
      <>
        <path d="M4 4h16v12H9l-5 4V4Z" />
        <path d="M8 8h8M8 12h5" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V3h8v4M3 12h18" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 6 9 7 9-7" />
      </>
    ),
    file: (
      <>
        <path d="M5 3h9l5 5v13H5V3Z" />
        <path d="M14 3v6h5M8 13h8M8 17h6" />
      </>
    ),
    activity: (
      <>
        <path d="M3 12h4l3-8 4 16 3-8h4" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21v-3a8 8 0 0 1 16 0v3" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
      </>
    ),
    arrow: <path d="m5 12 14 0m-6-6 6 6-6 6" />,
    up: <path d="M12 20V4m-6 6 6-6 6 6" />,
    check: <path d="m4 12 5 5L20 6" />,
    plus: <path d="M12 4v16M4 12h16" />,
    bell: (
      <>
        <path d="M5 17h14l-2-4V9a5 5 0 0 0-10 0v4l-2 4ZM10 21h4" />
      </>
    ),
    close: <path d="m5 5 14 14M5 19 19 5" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    video: (
      <>
        <rect x="3" y="6" width="13" height="12" rx="2" />
        <path d="m16 10 5-3v10l-5-3" />
      </>
    ),
    pause: (
      <>
        <path d="M8 4v16M16 4v16" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    shield: (
      <>
        <path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z" />
        <path d="m8 11 3 3 5-6" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.chat}
    </svg>
  );
}
const NAV: [CareerScreen, string, string][] = [
  ['assistant', 'Your assistant', 'chat'],
  ['opportunities', 'Opportunities', 'search'],
  ['applications', 'Applications', 'briefcase'],
  ['outreach', 'Cold outreach', 'mail'],
  ['resumes', 'Resumes & letters', 'file'],
  ['background', 'Background work', 'activity'],
];
type Props = {
  initialData?: CareerBook;
  sample?: boolean;
  connected?: boolean;
  onEngine?: EngineClient;
  engineProgress?: EngineProgress;
  onEngineSetup?: () => void;
  onSave?: (book: CareerBook) => Promise<void>;
  onAsk?: (
    text: string,
    includeFacts: boolean,
    onPartial: (value: string) => void,
  ) => Promise<string>;
  onSelectEvidence?: (prompt: string, candidateIds: string[]) => Promise<string>;
  onCancel?: () => void;
  onSettings?: (screen: 'identity' | 'models' | 'agent') => void;
  onExitSample?: () => void;
  initialRequest?: string;
  onSavePdf?: (hash: string, bytes: Uint8Array) => Promise<void>;
  onExportPdf?: (hash: string) => Promise<string>;
};
export function ResumeDocument({ tailored = true }: { tailored?: boolean }) {
  return (
    <article className="cw-paper">
      <header>
        <h3>{RESUME.name}</h3>
        <p>{RESUME.title}</p>
        <small>{RESUME.contact}</small>
      </header>
      <section>
        <h4>Profile</h4>
        <p>{tailored ? RESUME.tailored : RESUME.summary}</p>
      </section>
      <section>
        <h4>Experience</h4>
        {RESUME.experience.map((job, i) => (
          <div className="cw-resume-job" key={job.company}>
            <div>
              <strong>{job.role}</strong>
              <span>{job.date}</span>
            </div>
            <em>{job.company}</em>
            <ul>
              {job.bullets.map((b, j) => (
                <li key={b} className={tailored && i === 0 && j === 0 ? 'cw-highlight' : ''}>
                  {tailored && i === 0 && j === 0
                    ? 'Led discovery and interaction design for complex B2B reporting workflows, translating customer research into clear, accessible product experiences.'
                    : b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <section>
        <h4>Skills</h4>
        <p>{RESUME.skills.join(' · ')}</p>
      </section>
      <section>
        <h4>Education</h4>
        <p>{RESUME.education}</p>
      </section>
    </article>
  );
}
export function CareerWorkspace({
  initialData = EMPTY_BOOK,
  sample = false,
  connected = false,
  onSave,
  onAsk,
  onSelectEvidence,
  onCancel,
  onSettings,
  onExitSample,
  initialRequest = '',
  onSavePdf,
  onExportPdf,
  onEngine,
  engineProgress,
  onEngineSetup,
}: Props) {
  const [book, setBook] = useState<CareerBook>(initialData);
  const [screen, setScreen] = useState<CareerScreen>('assistant');
  const [selected, setSelected] = useState(initialData.opportunities[0]?.id ?? '');
  const [text, setText] = useState(initialRequest);
  const [conversationStart, setConversationStart] = useState(0);
  useEffect(() => {
    if (initialRequest) setText(initialRequest);
  }, [initialRequest]);
  const visibleMessages = book.messages.slice(conversationStart);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [inspector, setInspector] = useState<'role' | 'resume' | 'letter' | 'video'>('role');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notify, setNotify] = useState(sample);
  const [includeFacts, setIncludeFacts] = useState(false);
  const [draftRole, setDraftRole] = useState({ company: '', role: '', posting: '' });
  const [adding, setAdding] = useState(false);
  const [tourInbox, setTourInbox] = useState(false);
  const [tailored, setTailored] = useState(true);
  const sequence = useRef(0);
  const job = book.opportunities.find((j) => j.id === selected) ?? book.opportunities[0];
  useEffect(() => {
    setBook(initialData);
    setSelected((current) =>
      initialData.opportunities.some((j) => j.id === current)
        ? current
        : (initialData.opportunities[0]?.id ?? ''),
    );
  }, [initialData]);
  function showVideo() {
    setInspector('video');
    if (sample) setSelected('morrow');
  }
  const id = () => `${Date.now()}-${++sequence.current}`;
  async function persist(next: CareerBook) {
    setFeedback('');
    try {
      if (!sample) {
        if (!connected || !onSave)
          throw new Error(
            'Open the desktop app to save your workspace, or explore the sample workspace.',
          );
        await onSave(next);
      }
      setBook(next);
      return true;
    } catch (e) {
      setFeedback(String(e));
      return false;
    }
  }
  function navigate(next: CareerScreen) {
    setScreen(next);
    setMobileMenu(false);
  }
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const request = text.trim();
    if (!request || busy) return;
    setBusy(true);
    setText('');
    const messages = [...book.messages, { id: id(), role: 'user' as const, text: request }];
    const replyId = id();
    let reply = '';
    try {
      if (/how many|progress|applied so far|status update/i.test(request)) {
        const applied = book.opportunities.filter((j) => j.status === 'Applied').length;
        reply = `Across your local workspace, you have ${applied} recorded application${applied === 1 ? '' : 's'}, ${book.opportunities.filter((j) => j.status === 'Review').length} role${book.opportunities.filter((j) => j.status === 'Review').length === 1 ? '' : 's'} awaiting review, and ${book.opportunities.filter((j) => j.status === 'Video needed').length} video request${book.opportunities.filter((j) => j.status === 'Video needed').length === 1 ? '' : 's'}. ${sample ? 'These are sample career records.' : 'These counts come from your local workspace, not an inferred submission history.'}`;
      } else if (sample) {
        reply = /video|loom/i.test(request)
          ? 'Morrow asks for a 90-second introduction. I’ve prepared a project-based script and a recording checklist. Open Video preparation in the review panel. This is a sample response.'
          : /job|posting|role/i.test(request)
            ? 'Let’s look at the Northstar role. Your experience in B2B workflows, customer research and design systems is relevant. I’ve brought the role, tailored resume and cover letter into the review panel. This sample does not send an application.'
            : 'I can help you review opportunities, prepare materials, plan outreach and keep track of your search. In this sample workspace, explore the sections in the sidebar or ask for an application count.';
        if (/video|loom/i.test(request)) showVideo();
      } else if (onAsk) {
        setBook({
          ...book,
          messages: [
            ...messages,
            { id: replyId, role: 'assistant', text: 'Preparing your response…' },
          ],
        });
        reply = await onAsk(request, includeFacts, (value) =>
          setBook({
            ...book,
            messages: [...messages, { id: replyId, role: 'assistant', text: value }],
          }),
        );
      } else throw new Error('Connect a model in Models, then start a session in Agent workspace.');
      await persist({
        ...book,
        messages: [...messages, { id: replyId, role: 'assistant', text: reply }],
      });
    } catch (e) {
      setFeedback(String(e));
      setBook({ ...book, messages });
      setText(request);
    } finally {
      setBusy(false);
    }
  }
  async function addRole(e: React.FormEvent) {
    e.preventDefault();
    if (!draftRole.company.trim() || !draftRole.role.trim() || !draftRole.posting.trim()) return;
    const entry: Opportunity = {
      id: id(),
      company: draftRole.company.trim(),
      role: draftRole.role.trim(),
      posting: draftRole.posting.trim(),
      salary: 'Not specified',
      location: 'Review posting',
      status: 'Review',
      reason: 'Manually added. Review the job requirements and your fit before proceeding.',
    };
    if (await persist({ ...book, opportunities: [entry, ...book.opportunities] })) {
      setSelected(entry.id);
      setAdding(false);
      setDraftRole({ company: '', role: '', posting: '' });
    }
  }
  async function approveExample() {
    if (!sample) {
      setFeedback(
        'Application execution is not enabled in this alpha. You can review and save the role; no application has been sent.',
      );
      return;
    }
    if (!job) return;
    await persist({
      ...book,
      opportunities: book.opportunities.map((j) =>
        j.id === job.id
          ? { ...j, status: 'Applied' as const, confirmation: 'SAMPLE-ONLY-APPROVAL' }
          : j,
      ),
    });
    setNotify(false);
    setFeedback('Sample application approved. No external action was taken.');
  }
  function docDownload() {
    const blob = new Blob(
      [
        inspector === 'letter'
          ? COVER_LETTER
          : `${RESUME.name}\n${RESUME.contact}\n\n${tailored ? RESUME.tailored : RESUME.summary}\n\n${RESUME.experience.map((j) => `${j.role} — ${j.company}\n${j.date}\n${j.bullets.join('\n')}`).join('\n\n')}\n\n${RESUME.skills.join(', ')}\n${RESUME.education}`,
      ],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = inspector === 'letter' ? 'alex-morgan-cover-letter.txt' : 'alex-morgan-resume.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="career-workspace" data-sample={sample}>
      <aside className="cw-sidebar">
        <a href="#assistant" className="cw-brand" onClick={() => navigate('assistant')}>
          <span>
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 19 19 5M7 5h12v12" />
            </svg>
          </span>
          pursuit<span className="cw-brand-dot">.</span>
        </a>
        <div className="cw-account">
          <span className="cw-avatar">{sample ? 'AM' : 'Y'}</span>
          <div>
            <strong>{sample ? 'Alex’s workspace' : 'Your workspace'}</strong>
            <small>{sample ? 'Sample career · Product design' : 'Personal career assistant'}</small>
          </div>
        </div>
        <button
          className="cw-new"
          disabled={busy}
          onClick={() => {
            navigate('assistant');
            setText('');
            setConversationStart(book.messages.length);
          }}
        >
          <DeskIcon name="plus" size={15} /> New conversation
        </button>
        <nav aria-label="Career workspace">
          {NAV.map(([key, label, icon]) => (
            <button
              key={key}
              aria-label={label}
              onClick={() => navigate(key)}
              aria-current={screen === key ? 'page' : undefined}
            >
              <DeskIcon name={icon} size={17} />
              {label}
              {key === 'opportunities' && book.opportunities.length > 0 && (
                <span>{book.opportunities.length}</span>
              )}
            </button>
          ))}
        </nav>
        {book.messages.length > 0 && (
          <div className="cw-recent">
            <span className="cw-nav-caption">RECENT</span>
            <button
              onClick={() => {
                navigate('assistant');
                setConversationStart(0);
              }}
            >
              <DeskIcon name="chat" size={14} />
              {sample ? 'Your design role search' : 'Your career conversation'}
            </button>
          </div>
        )}
        <div className="cw-sidebar-lower">
          <span className="cw-nav-caption">YOUR CONTEXT</span>
          <button onClick={() => onSettings?.('identity')}>
            <DeskIcon name="user" size={16} /> Career Identity
          </button>
          <button onClick={() => onSettings?.('models')}>
            <DeskIcon name="settings" size={16} /> Models & connections
          </button>
          <button onClick={() => onSettings?.('agent')}>
            <DeskIcon name="activity" size={16} /> Agent workspace
          </button>
          <div className="cw-local">
            <i />
            {sample ? 'Sample workspace' : connected ? 'Saved on this device' : 'Desktop preview'}
            {sample && onExitSample && <button onClick={onExitSample}>Exit tour</button>}
          </div>
        </div>
      </aside>
      <div className="cw-main">
        <header className="cw-topbar">
          <div>
            <button
              className="cw-menu"
              aria-label="Open career navigation"
              aria-expanded={mobileMenu}
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <DeskIcon name="menu" />
            </button>
            <span>Your career</span>
            <b>/</b>
            <strong>{NAV.find((n) => n[0] === screen)?.[1]}</strong>
          </div>
          <div>
            <span className="cw-preview-label">
              {sample ? 'Product tour · sample data' : 'Personal workspace'}
            </span>
            <button aria-label="Notifications" onClick={() => setNotify(!notify)}>
              <DeskIcon name="bell" size={17} />
              {sample && <i />}
            </button>
          </div>
        </header>
        {mobileMenu && (
          <nav className="cw-mobile-nav" aria-label="Mobile career workspace">
            {NAV.map(([key, label]) => (
              <button key={key} onClick={() => navigate(key)}>
                {label}
              </button>
            ))}
          </nav>
        )}
        {feedback && (
          <div role="status" className="cw-feedback">
            {feedback}
            <button aria-label="Dismiss message" onClick={() => setFeedback('')}>
              <DeskIcon name="close" size={14} />
            </button>
          </div>
        )}
        <div className="cw-body">
          {screen === 'assistant' ? (
            <>
              <div className="cw-conversation-heading">
                <span className="cw-state-dot" />
                <h1>{sample ? 'Finding your next design role' : 'What’s your next move?'}</h1>
                {sample ? (
                  <StatusBadge tone="positive">Sourcing · demo</StatusBadge>
                ) : (
                  <span>Your assistant</span>
                )}
              </div>
              <div className="cw-thread" aria-live="polite">
                {visibleMessages.length ? (
                  visibleMessages.map((m) => (
                    <article key={m.id} className={`cw-message cw-${m.role}`}>
                      <span className="cw-message-avatar">
                        {m.role === 'user' ? (
                          sample ? (
                            'AM'
                          ) : (
                            'You'
                          )
                        ) : (
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            fill="none"
                            strokeWidth="2"
                          >
                            <path d="M5 19 19 5M7 5h12v12" />
                          </svg>
                        )}
                      </span>
                      <div>
                        <strong>{m.role === 'user' ? 'You' : 'Pursuit'}</strong>
                        <p>{m.text}</p>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="cw-welcome">
                    <span className="cw-welcome-mark">
                      <DeskIcon name="chat" size={30} />
                    </span>
                    <h2>A little closer to what’s next.</h2>
                    <p>
                      Ask about your search, paste a job posting, or work through an application
                      together.
                    </p>
                  </div>
                )}
                {sample && (
                  <div className="cw-inline-role">
                    <div>
                      <span className="cw-company">N</span>
                      <div>
                        <strong>Senior Product Designer</strong>
                        <span>Northstar · London · £85k–£105k</span>
                      </div>
                      <em>Ready for your review</em>
                    </div>
                    <p>
                      Your tailored resume and cover letter are attached. Review the changes before
                      approving the next step.
                    </p>
                    <button
                      onClick={() => {
                        setSelected('northstar');
                        setInspector('resume');
                      }}
                    >
                      Review application <DeskIcon name="arrow" size={14} />
                    </button>
                  </div>
                )}
              </div>
              <form className="cw-chat-composer" onSubmit={send}>
                <label className="cw-sr-only" htmlFor="cw-request">
                  Ask Pursuit or paste a job posting
                </label>
                <textarea
                  id="cw-request"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={8000}
                  disabled={busy}
                  placeholder="Ask Pursuit anything, or paste a job posting…"
                />
                <div>
                  <span>
                    <DeskIcon name="plus" size={15} /> Your career context
                  </span>
                  <label>
                    <input
                      type="checkbox"
                      checked={includeFacts}
                      onChange={(e) => setIncludeFacts(e.target.checked)}
                      disabled={busy}
                    />{' '}
                    Include confirmed facts
                  </label>
                  <button
                    aria-label={busy ? 'Stop response' : 'Send message'}
                    type={busy ? 'button' : 'submit'}
                    disabled={!busy && !text.trim()}
                    onClick={busy ? () => onCancel?.() : undefined}
                  >
                    <DeskIcon name={busy ? 'pause' : 'up'} size={17} />
                  </button>
                </div>
              </form>
              <div className="cw-suggestions">
                {[
                  'How many applications so far?',
                  'Help me prepare a video',
                  'Review this job posting',
                ].map((q) => (
                  <button key={q} disabled={busy} onClick={() => setText(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </>
          ) : screen === 'opportunities' || screen === 'applications' ? (
            <>
              <div className="cw-page-title">
                <div>
                  <h1>{screen === 'applications' ? 'Your applications' : 'Your opportunities'}</h1>
                  <p>
                    {screen === 'applications'
                      ? 'Keep the record, the material and the next step together.'
                      : 'Review matches and check what each application needs.'}
                  </p>
                </div>
                <button disabled={busy} onClick={() => setAdding(true)}>
                  <DeskIcon name="plus" size={15} /> Add job posting
                </button>
              </div>
              {screen === 'opportunities' && !sample && onEngine && (
                <SourcingPanel
                  call={onEngine}
                  progress={engineProgress}
                  onSetup={() => onEngineSetup?.()}
                  savedIds={book.opportunities.map((j) => j.id)}
                  onSave={async (entry) => {
                    const existing = book.opportunities.find((j) => j.id === entry.id);
                    const changed =
                      existing &&
                      (existing.posting !== entry.posting ||
                        existing.role !== entry.role ||
                        existing.company !== entry.company);
                    const refreshed = existing
                      ? {
                          ...existing,
                          ...entry,
                          status:
                            existing.status === 'Applied'
                              ? ('Applied' as const)
                              : changed
                                ? ('Review' as const)
                                : existing.status,
                          confirmation: existing.confirmation,
                          contacts: existing.contacts,
                        }
                      : entry;
                    const tailoring =
                      changed && book.tailoring?.packet?.role.id === entry.id
                        ? { resume: book.tailoring.resume, voice: book.tailoring.voice }
                        : book.tailoring;
                    const saved = await persist({
                      ...book,
                      tailoring,
                      opportunities: existing
                        ? book.opportunities.map((j) => (j.id === entry.id ? refreshed : j))
                        : [entry, ...book.opportunities],
                    });
                    if (saved) setSelected(entry.id);
                    return saved;
                  }}
                />
              )}
              {screen === 'opportunities' && (sample || !onEngine) && (
                <div className="cw-sourcing-status" data-demo={sample}>
                  <span className="cw-search-indicator">
                    <DeskIcon name="search" size={17} />
                  </span>
                  <div>
                    <strong>{sample ? 'Sourcing roles across the web' : 'Job sourcing'}</strong>
                    <p>
                      {sample
                        ? 'Demo search · checking career pages and watched companies for product design roles.'
                        : 'Web sourcing is not connected in this desktop alpha. Add a posting to review it here.'}
                    </p>
                  </div>
                  <StatusBadge tone={sample ? 'positive' : 'neutral'}>
                    {sample ? 'Simulated search' : 'Not connected'}
                  </StatusBadge>
                </div>
              )}
              <div className="cw-record-summary">
                {[
                  ['Shortlisted', book.opportunities.length],
                  [
                    'Awaiting review',
                    book.opportunities.filter((j) => j.status === 'Review').length,
                  ],
                  ['Applied', book.opportunities.filter((j) => j.status === 'Applied').length],
                ].map(([label, count]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
              {adding && (
                <form className="cw-add-role" onSubmit={addRole}>
                  <h2>Add an opportunity</h2>
                  {(['company', 'role', 'posting'] as const).map((key) => (
                    <label key={key}>
                      {key === 'posting' ? 'Job posting' : key === 'role' ? 'Job title' : 'Company'}
                      {key === 'posting' ? (
                        <textarea
                          required
                          value={draftRole[key]}
                          onChange={(e) => setDraftRole({ ...draftRole, [key]: e.target.value })}
                        />
                      ) : (
                        <input
                          required
                          value={draftRole[key]}
                          onChange={(e) => setDraftRole({ ...draftRole, [key]: e.target.value })}
                        />
                      )}
                    </label>
                  ))}
                  <div>
                    <button type="submit" disabled={busy}>
                      Save opportunity
                    </button>
                    <button type="button" onClick={() => setAdding(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              <div className="cw-jobs">
                {book.opportunities.map((j) => (
                  <button
                    className={j.id === selected ? 'cw-job selected' : 'cw-job'}
                    key={j.id}
                    onClick={() => {
                      setSelected(j.id);
                      setInspector('role');
                    }}
                  >
                    <span className="cw-company">{j.company[0]}</span>
                    <div>
                      <strong>{j.role}</strong>
                      <span>
                        {j.company} · {j.location}
                      </span>
                      <p>{j.reason}</p>
                    </div>
                    <StatusBadge
                      tone={
                        j.status === 'Review' || j.status === 'Video needed'
                          ? 'attention'
                          : j.status === 'Applied' || j.status === 'Prepared'
                            ? 'positive'
                            : 'neutral'
                      }
                    >
                      {j.status}
                    </StatusBadge>
                  </button>
                ))}
                {!book.opportunities.length && (
                  <p className="cw-empty">
                    Save a sourced role or add a job posting to start your shortlist.
                  </p>
                )}
              </div>
              {!sample && job && onEngine && (
                <ApplicationReview
                  key={`application-${job.id}`}
                  job={job}
                  tailoring={book.tailoring}
                  call={onEngine}
                  onSetup={() => onEngineSetup?.()}
                  onPrepare={() => navigate('resumes')}
                  onConfirmed={(confirmation) =>
                    persist({
                      ...book,
                      opportunities: book.opportunities.map((j) =>
                        j.id === job.id ? { ...j, status: 'Applied', confirmation } : j,
                      ),
                    })
                  }
                />
              )}
              {!sample && job && (
                <FollowupPanel
                  key={`followup-${job.id}`}
                  job={job}
                  resume={book.tailoring?.resume}
                  voice={book.tailoring?.voice}
                  onSave={(contacts) =>
                    persist({
                      ...book,
                      opportunities: book.opportunities.map((item) =>
                        item.id === job.id ? { ...item, contacts } : item,
                      ),
                    })
                  }
                />
              )}
            </>
          ) : screen === 'resumes' ? (
            <>
              <div className="cw-page-title">
                <div>
                  <h1>Your experience. Ready for the role.</h1>
                  <p>
                    Keep the original, review the tailored version, and make every claim your own.
                  </p>
                </div>
              </div>
              {sample ? (
                <>
                  <div className="cw-doc-tabs">
                    <button onClick={() => setInspector('resume')}>Tailored resume</button>
                    <button onClick={() => setInspector('letter')}>Cover letter</button>
                    <button onClick={showVideo}>Video script</button>
                  </div>
                  <div className="cw-document-list">
                    {[
                      [
                        'resume',
                        'Northstar — Senior Product Designer',
                        'Resume · role-specific version',
                      ],
                      ['letter', 'A considered introduction', 'Cover letter · Northstar'],
                      ['video', 'Your 90-second introduction', 'Video preparation · Morrow'],
                    ].map(([kind, title, detail]) => (
                      <button key={kind} onClick={() => setInspector(kind as 'resume')}>
                        <DeskIcon name={kind === 'video' ? 'video' : 'file'} size={24} />
                        <div>
                          <strong>{title}</strong>
                          <span>{detail}</span>
                        </div>
                        <DeskIcon name="arrow" size={17} />
                      </button>
                    ))}
                  </div>
                  <ResumeDocument tailored={tailored} />
                </>
              ) : (
                <TailoringStudio
                  key={selected}
                  initialJobId={selected}
                  value={book.tailoring}
                  opportunities={book.opportunities}
                  onSave={(tailoring) =>
                    persist({
                      ...book,
                      tailoring,
                      opportunities: book.opportunities.map((j) =>
                        j.id === tailoring.packet?.role.id && j.status !== 'Applied'
                          ? { ...j, status: 'Prepared' }
                          : j,
                      ),
                    })
                  }
                  onModel={
                    onSelectEvidence ??
                    (onAsk ? (prompt) => onAsk(prompt, false, () => {}) : undefined)
                  }
                  onSavePdf={onSavePdf}
                  onExportPdf={onExportPdf}
                />
              )}
            </>
          ) : screen === 'outreach' ? (
            <>
              <div className="cw-page-title">
                <div>
                  <h1>A thoughtful introduction opens doors.</h1>
                  <p>Find the right person, understand the context, review what gets sent.</p>
                </div>
              </div>
              <div className="cw-outreach-stages">
                {['Source contact', 'Check context', 'Prepare message', 'Your approval'].map(
                  (s, i) => (
                    <span key={s}>
                      <b>{i + 1}</b>
                      {s}
                    </span>
                  ),
                )}
              </div>
              {sample ? (
                <>
                  <div className="cw-contact">
                    <span className="cw-avatar">PS</span>
                    <div>
                      <strong>Priya Shah</strong>
                      <span>Design Lead · Northstar</span>
                      <small>Sample public team profile · northstar.example/team</small>
                    </div>
                    <span className="cw-badge">Ready for review</span>
                  </div>
                  <div className="cw-email">
                    <div>
                      <span>To</span>priya@northstar.example
                    </div>
                    <div>
                      <span>Subject</span>The design work behind a clearer workflow
                    </div>
                    <p>
                      Hi Priya,
                      <br />
                      <br />I noticed Northstar is looking for a designer who can bring research and
                      systems thinking together. At Meridian, I’ve been working on exactly
                      that—simplifying B2B workflows while building a component library alongside
                      engineering.
                      <br />
                      <br />
                      I’d love to hear what your team is working to make simpler. Would you be open
                      to a short conversation?
                      <br />
                      <br />
                      Alex
                    </p>
                    <footer>
                      <DeskIcon name="shield" size={15} /> Exact message approval required
                      <button onClick={() => setFeedback('Sample draft only. No email was sent.')}>
                        Review message
                      </button>
                    </footer>
                  </div>
                </>
              ) : (
                <p className="cw-empty">
                  Your contact pipeline is empty. The existing web workflow supports approved Gmail
                  outreach; desktop Gmail sending and contact discovery are not connected yet.
                </p>
              )}
              <div className="cw-gmail">
                <span className="cw-gmail-mark">
                  <DeskIcon name="mail" size={24} />
                </span>
                <div>
                  <strong>Send from your own Gmail</strong>
                  <p>
                    Connect directly with Google or through Composio. Review each message before it
                    leaves.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTourInbox(!tourInbox);
                    setFeedback(
                      sample
                        ? 'Sample connection setup. No Google authorization is performed.'
                        : 'Desktop Gmail setup is not connected yet. Use the web workflow’s connection settings.',
                    );
                  }}
                >
                  Connect Gmail
                </button>
              </div>
              {tourInbox && (
                <div className="cw-connection-options">
                  <button
                    onClick={() =>
                      setFeedback('Google OAuth preview selected. No account was connected.')
                    }
                  >
                    Continue with Google
                  </button>
                  <button
                    onClick={() =>
                      setFeedback('Composio preview selected. No account was connected.')
                    }
                  >
                    Connect with Composio
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="cw-page-title">
                <div>
                  <h1>Your search, while life happens.</h1>
                  <p>See what’s running, what needs you, and what moved forward.</p>
                </div>
              </div>
              {sample ? (
                <>
                  <div className="cw-background-heading">
                    <span>
                      <i /> Career autopilot
                    </span>
                    <button
                      onClick={() =>
                        setFeedback('Sample background work paused. No actual worker was affected.')
                      }
                    >
                      <DeskIcon name="pause" size={13} /> Pause
                    </button>
                  </div>
                  {[
                    [
                      'Review target sources',
                      '128 roles reviewed · 18 preference matches',
                      'Completed',
                    ],
                    [
                      'Prepare Northstar application',
                      'Resume and cover letter ready for review',
                      'Needs you',
                    ],
                    [
                      'Prepare Morrow introduction',
                      '90-second video script and recording checklist',
                      'Needs you',
                    ],
                    [
                      'Record Bramble application',
                      'Confirmation SAMPLE-ONLY-1042 · sample scenario',
                      'Completed',
                    ],
                  ].map(([title, detail, state]) => (
                    <div className="cw-background-task" key={title}>
                      <DeskIcon name={state === 'Completed' ? 'check' : 'clock'} size={18} />
                      <div>
                        <strong>{title}</strong>
                        <span>{detail}</span>
                      </div>
                      <StatusBadge tone={state === 'Completed' ? 'positive' : 'attention'}>
                        {state}
                      </StatusBadge>
                    </div>
                  ))}
                  <div className="cw-policy-note">
                    <DeskIcon name="shield" size={18} />
                    <p>
                      Remote or London · £80k+ · 5 applications per day · outreach approval
                      required.
                      <br />
                      Sample policy. No actual worker or submission runs in this tour.
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  {onEngine && <EngineHistory call={onEngine} progress={engineProgress} />}
                  {book.notes.length > 0 && (
                    <div className="cw-saved-work">
                      <h2>Saved career work</h2>
                      {book.notes.map((note, i) => (
                        <p key={i}>{note}</p>
                      ))}
                    </div>
                  )}
                  {!onEngine && (
                    <p className="cw-empty">
                      Background runs will appear here when desktop source watchers and application
                      execution are connected. The existing web scheduler has its own run history.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <aside className="cw-inspector">
        <header>
          <strong>
            {inspector === 'role'
              ? 'Opportunity brief'
              : inspector === 'resume'
                ? 'Your tailored resume'
                : inspector === 'letter'
                  ? 'Your cover letter'
                  : 'Video preparation'}
          </strong>
          <span>{sample ? 'Sample career' : 'Review panel'}</span>
        </header>
        <div className="cw-inspector-tabs">
          {(['role', 'resume', 'letter', 'video'] as const).map((t) => (
            <button
              key={t}
              aria-pressed={inspector === t}
              onClick={() => (t === 'video' ? showVideo() : setInspector(t))}
            >
              {t === 'role'
                ? 'Role'
                : t === 'resume'
                  ? 'Resume'
                  : t === 'letter'
                    ? 'Letter'
                    : 'Video'}
            </button>
          ))}
        </div>
        <div className="cw-inspector-body">
          {!sample && inspector !== 'role' ? (
            book.tailoring?.packet &&
            book.tailoring.packet.role.id === job?.id &&
            (inspector === 'resume' || inspector === 'letter') ? (
              <div className="cw-native-document">
                <h2>{inspector === 'resume' ? 'Saved resume selection' : 'Cover letter draft'}</h2>
                <pre>
                  {inspector === 'resume'
                    ? book.tailoring.packet.blocks.map((b) => b.text).join('\n')
                    : book.tailoring.packet.coverLetter}
                </pre>
                <button onClick={() => navigate('resumes')}>Review and export documents</button>
              </div>
            ) : (
              <div className="cw-empty">
                <p>
                  No saved {inspector === 'video' ? 'video script' : 'document'} is attached to this
                  role. Prepare the application material in Resumes & letters.
                </p>
                <button onClick={() => navigate('resumes')}>Prepare documents</button>
              </div>
            )
          ) : inspector === 'resume' ? (
            <>
              <div className="cw-document-control">
                <label>
                  <input
                    type="checkbox"
                    checked={tailored}
                    onChange={(e) => setTailored(e.target.checked)}
                  />{' '}
                  Show tailored emphasis
                </label>
                <button onClick={docDownload}>Save text</button>
              </div>
              <ResumeDocument tailored={tailored} />
            </>
          ) : inspector === 'letter' ? (
            <>
              <div className="cw-letter">
                <span>Alex Morgan → Northstar</span>
                <h2>A clear reason to start a conversation.</h2>
                <p>{COVER_LETTER}</p>
              </div>
              <button className="cw-wide-button" onClick={docDownload}>
                Save cover letter text
              </button>
            </>
          ) : inspector === 'video' ? (
            <>
              <div className="cw-video-title">
                <DeskIcon name="video" size={25} />
                <h2>Meet Alex, in 90 seconds.</h2>
                <p>
                  Morrow asks for a short introduction. Make it a story, not a read-through of your
                  resume.
                </p>
              </div>
              {VIDEO_SCRIPT.map(([time, title, copy]) => (
                <div className="cw-script-part" key={time}>
                  <span>{time}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              ))}
              <div className="cw-checklist">
                <h3>Before you hit record</h3>
                {[
                  'Camera at eye level; light in front of you',
                  'One clear project story, in your own words',
                  'Test audio and watch the recording once',
                  'Review the link permissions before sharing',
                ].map((s) => (
                  <label key={s}>
                    <input type="checkbox" />
                    {s}
                  </label>
                ))}
              </div>
            </>
          ) : job ? (
            <>
              <div className="cw-role-head">
                <span className="cw-company">{job.company[0]}</span>
                <h2>{job.role}</h2>
                <p>
                  {job.company} · {job.location}
                </p>
                <strong>{job.salary}</strong>
              </div>
              <div className="cw-fit">
                <h3>Why this could fit</h3>
                <p>{job.reason}</p>
              </div>
              <div className="cw-role-details">
                <h3>The role</h3>
                <p>{job.posting}</p>
              </div>
              <div className="cw-attachments">
                <h3>Application material</h3>
                <button onClick={() => setInspector('resume')}>
                  <DeskIcon name="file" size={16} /> Tailored resume
                  <DeskIcon name="arrow" size={13} />
                </button>
                <button onClick={() => setInspector('letter')}>
                  <DeskIcon name="file" size={16} /> Cover letter
                  <DeskIcon name="arrow" size={13} />
                </button>
                {job.status === 'Video needed' && (
                  <button onClick={showVideo}>
                    <DeskIcon name="video" size={16} /> Introduction video script
                    <DeskIcon name="arrow" size={13} />
                  </button>
                )}
              </div>
              <button
                className="cw-approve"
                disabled={busy}
                onClick={() => {
                  if (!sample && onEngine) {
                    navigate('applications');
                  } else void approveExample();
                }}
              >
                {sample ? 'Approve sample application' : 'Review application execution'}
                <DeskIcon name="arrow" size={15} />
              </button>
              {sample && (
                <small className="cw-action-note">
                  Product tour. This does not submit a real application.
                </small>
              )}
            </>
          ) : (
            <div className="cw-empty">
              <DeskIcon name="briefcase" size={28} />
              <p>Select a role to see its requirements, your material, and the next step.</p>
            </div>
          )}
        </div>
      </aside>
      {notify && (
        <div className="cw-notification" role="status">
          <span className="cw-notification-mark">
            <DeskIcon name="bell" size={18} />
          </span>
          <div>
            <strong>{sample ? 'A role worth your attention' : 'Your notifications'}</strong>
            <p>
              {sample
                ? 'Northstar fits your design experience. Your application is ready for review.'
                : 'No notifications in your local workspace yet.'}
            </p>
            {sample && (
              <button
                onClick={() => {
                  navigate('opportunities');
                  setSelected('northstar');
                  setInspector('role');
                  setNotify(false);
                }}
              >
                Review opportunity <DeskIcon name="arrow" size={13} />
              </button>
            )}
          </div>
          <button aria-label="Dismiss notification" onClick={() => setNotify(false)}>
            <DeskIcon name="close" size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
