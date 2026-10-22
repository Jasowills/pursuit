import { LandingHeader, PursuitMark, Wordmark } from './_components/header';
import { Icon } from './_components/icons';
import {
  HarnessShowcase,
  ResumeStudy,
  AutopilotStudy,
  DownloadOptions,
} from './_components/career-showcase';
import './landing-dark.css';

const REPO = 'https://github.com/Jasowills/pursuit';
const providers = [
  ['OpenAI', 'openai.svg', 'Your OpenAI account'],
  ['Claude', 'claude.svg', 'Your Anthropic account'],
  ['Gemini', 'gemini-color.svg', 'Your Google AI account'],
  ['OpenCode', 'opencode.svg', 'Runtime + hosted inference'],
  ['Ollama', 'ollama.svg', 'Models on your machine'],
  ['Hermes', 'nousresearch.svg', 'Through OpenRouter'],
];
const questions = [
  [
    'What can I use today?',
    'The desktop alpha supports local tasks, Career Identity review, OS credential storage, model catalogs, and managed OpenCode draft sessions with streaming and interruption. The retained web workflow also supports Greenhouse imports, BYOM preparation, approved Gmail outreach, scheduled research, and in-app notifications. These web capabilities are still being migrated into the desktop harness.',
  ],
  [
    'Does it automatically apply to jobs?',
    'That is the intended autopilot: bounded applications after you explicitly configure a policy. Scheduled research and draft preparation work in the web workflow today. The browser/ATS submission executor is still in development; the alpha does not automatically submit applications. Outreach remains approval-bound.',
  ],
  [
    'Can I bring my own AI model?',
    'Yes. The desktop connection layer includes OpenAI, Anthropic, Gemini, OpenRouter, Groq, OpenCode hosted inference, and local Ollama. You supply your own access. Model availability, fees and API compatibility depend on the provider and your account. Live paid-provider qualification is still pending. OpenCode is also the managed agent runtime, not itself a model.',
  ],
  [
    'Can I connect Gmail directly or through Composio?',
    'Both paths exist in the web workflow: direct Google OAuth and Composio. Each needs operator setup and your consent. Connecting an account never sends a message on its own. The desktop Gmail migration is planned.',
  ],
  [
    'Where does my career information go?',
    'The desktop Core stores your workspace in local SQLite and provider keys in the OS credential store. When you explicitly send a model request, that provider receives the request and any confirmed identity facts you opted to include. Local storage does not make cloud inference offline.',
  ],
  [
    'Where are the installers?',
    'Pursuit is a developer alpha. An internal macOS Intel build is verified, with macOS ARM, Windows and Linux targeted. Public signed installers are not published yet. Download the source and follow the build instructions, or contribute on GitHub.',
  ],
  [
    'Can it export PDF or Word resumes?',
    'Not yet. The web workflow prepares tailored resume text, cover letters and outreach drafts. PDF/DOCX import and export, grounded desktop application packets, and richer document handling are planned.',
  ],
  [
    'Is Pursuit open source?',
    'Yes. The source and contribution guide are on GitHub. You can inspect how your data, model connections, permissions and workflow are handled. Provider usage charges are separate; no paid Pursuit plan is currently offered.',
  ],
];

export default function HomePage() {
  return (
    <div className="dark-landing">
      <LandingHeader />
      <main id="main">
        <section className="dark-hero dark-frame">
          <div className="hero-copy">
            <h1>
              Your next opportunity
              <br />
              deserves <span>your best.</span>
            </h1>
            <p>
              A career harness that puts your experience, your AI models, and your entire search in
              one place. Built to move your career forward. On your terms.
            </p>
            <div className="dark-actions">
              <a href="#download" className="dark-button primary">
                <Icon name="monitor" size={17} /> Get Pursuit <Icon name="arrowUpRight" size={16} />
              </a>
              <a href="#product" className="dark-button">
                Explore the harness <Icon name="chevronDown" size={16} />
              </a>
            </div>
            <div className="hero-details">
              <span>
                <Icon name="layers" size={13} /> Open source
              </span>
              <span>
                <Icon name="lock" size={13} /> Local-first desktop
              </span>
              <span>
                <Icon name="sparkles" size={13} /> Your own models
              </span>
            </div>
          </div>
          <div id="product" className="hero-harness">
            <HarnessShowcase />
          </div>
        </section>
        <section className="model-strip dark-frame" aria-label="Model connections">
          <p>
            Your intelligence.
            <br />
            <strong>Your choice.</strong>
          </p>
          <div>
            {providers.slice(0, 5).map(([name, logo]) => (
              <span key={name}>
                <img src={`/brands/${logo}`} alt="" width={25} height={25} />
                {name}
              </span>
            ))}
          </div>
          <a href="#models" aria-label="Explore all model connections">
            <Icon name="arrowUpRight" size={20} />
          </a>
        </section>
        <section className="dark-section dark-frame story-intro" id="how-it-works">
          <h2>
            Less busywork.
            <br />
            <span>More next moves.</span>
          </h2>
          <div>
            <p>
              Job searching shouldn’t feel like running a second job. Pursuit connects the work
              between finding an opportunity and making your case.
            </p>
            <p>
              Build your career identity once. Bring the model you trust. Keep the research, drafts,
              decisions, and next steps together.
            </p>
            <a className="text-link" href="#features">
              Meet your career workspace <Icon name="arrowUpRight" size={16} />
            </a>
          </div>
        </section>
        <section className="dark-section dark-frame feature-split" id="features">
          <div className="feature-copy">
            <h2>
              Your experience.
              <br />
              Their role.
              <br />
              <span>A better fit.</span>
            </h2>
            <p>
              Make the relevance obvious. Tailor your resume to the opportunity with the experience
              you actually have, then review the result before it becomes your application.
            </p>
            <ul className="feature-list">
              <li>
                <Icon name="check" size={16} />
                <span>Resume text shaped around the job description</span>
              </li>
              <li>
                <Icon name="check" size={16} />
                <span>Cover letters and thoughtful outreach drafts</span>
              </li>
              <li>
                <Icon name="check" size={16} />
                <span>Your choice of model, your final say</span>
              </li>
            </ul>
            <p className="availability">
              Available in the web workflow. Grounded desktop packets and PDF/Word export are in
              development.
            </p>
          </div>
          <ResumeStudy />
        </section>
        <section className="autopilot-section" id="autopilot">
          <div className="dark-frame feature-split dark-section">
            <div className="feature-copy">
              <h2>
                Set the direction.
                <br />
                <span>Let the search move.</span>
              </h2>
              <p>
                Career autopilot is built around your boundaries: the roles you want, where you want
                to work, and how much it can do.
              </p>
              <p>
                Research and draft preparation can already run on a schedule in the web workflow.
                Next: automatic applications within an explicitly approved policy, with evidence and
                a notification when the work is done.
              </p>
              <div className="roadmap-note">
                <Icon name="clock" size={18} />
                <div>
                  <strong>Auto-apply is being built.</strong>
                  <span>
                    The preview shows the intended flow. The alpha does not submit applications
                    automatically.
                  </span>
                </div>
              </div>
            </div>
            <AutopilotStudy />
          </div>
        </section>
        <section className="dark-section dark-frame harness-section" id="harness">
          <div className="section-heading-pair">
            <h2>
              A harness for
              <br />
              <span>your whole career.</span>
            </h2>
            <p>
              One place to give your agent context, choose its intelligence, and keep the work
              inspectable.
            </p>
          </div>
          <div className="harness-detail-grid">
            <div className="harness-identity">
              <div className="identity-visual">
                <span>
                  <Icon name="user" size={18} /> Career Identity
                </span>
                <dl>
                  <div>
                    <dt>Experience</dt>
                    <dd>Source-backed</dd>
                  </div>
                  <div>
                    <dt>Skills & preferences</dt>
                    <dd>Reviewed by you</dd>
                  </div>
                  <div>
                    <dt>Canonical answers</dt>
                    <dd>
                      <Icon name="check" size={13} /> Confirmed
                    </dd>
                  </div>
                </dl>
                <p>
                  <Icon name="lock" size={14} /> Share confirmed facts only when you choose
                </p>
              </div>
              <h3>Context that belongs to you.</h3>
              <p>
                Review source excerpts, confirm career facts, and explicitly resolve conflicting
                answers. Your profile becomes a foundation you can inspect.
              </p>
            </div>
            <div className="harness-agent">
              <div className="session-visual">
                <div>
                  <Icon name="command" size={18} />
                  <span>Managed OpenCode sessions</span>
                </div>
                <p>
                  Choose a connection.
                  <br />
                  Give your agent a task.
                  <br />
                  <strong>Keep control of the session.</strong>
                </p>
                <div className="session-capabilities">
                  <span>
                    <i /> Streaming
                  </span>
                  <span>
                    <Icon name="pause" size={12} /> Interrupt
                  </span>
                  <span>
                    <Icon name="clock" size={12} /> History
                  </span>
                </div>
              </div>
              <h3>Real sessions. Visible work.</h3>
              <p>
                Stream draft text, interrupt execution, and return to saved session history. The
                desktop runtime is isolated; career action tools are still being built.
              </p>
            </div>
          </div>
        </section>
        <section className="dark-section dark-frame models-section" id="models">
          <div className="section-heading-pair">
            <h2>
              Bring your model.
              <br />
              <span>Keep your freedom.</span>
            </h2>
            <p>
              Use the intelligence you already pay for, or run local models through Ollama. No
              single-provider lock-in.
            </p>
          </div>
          <div className="provider-grid">
            {providers.map(([name, logo, description]) => (
              <div className="provider-item" key={name}>
                <img src={`/brands/${logo}`} alt="" width={38} height={38} />
                <strong>{name}</strong>
                <span>{description}</span>
              </div>
            ))}
          </div>
          <div className="models-foot">
            <p>
              Also connects to Groq and OpenRouter. Your key is stored in your OS credential store.
              Model access, compatibility, and usage charges depend on your account.
            </p>
            <a
              className="text-link"
              href={`${REPO}/blob/main/docs/DESKTOP_MODEL_CONNECTIONS.md`}
              target="_blank"
              rel="noreferrer"
            >
              Connection details <Icon name="arrowUpRight" size={15} />
            </a>
          </div>
        </section>
        <section className="dark-section dark-frame feature-split gmail-section">
          <div className="mail-visual">
            <div className="mail-heading">
              <img src="/brands/gmail.svg" alt="Gmail" width={43} height={33} />
              <span>Outreach, with your approval.</span>
            </div>
            <div className="mail-message">
              <div>
                <span>To</span>
                <strong>Your verified contact</strong>
              </div>
              <div>
                <span>Subject</span>
                <strong>A thoughtful introduction</strong>
              </div>
              <p>
                A message grounded in your experience, shaped for the person you’re reaching out to.
              </p>
              <div className="approval-state">
                <Icon name="shield" size={17} />
                <span>Review exact message before sending</span>
              </div>
            </div>
            <div className="mail-paths">
              <span>Direct Google OAuth</span>
              <span>Composio</span>
            </div>
          </div>
          <div className="feature-copy">
            <h2>
              A human connection.
              <br />
              <span>From your inbox.</span>
            </h2>
            <p>
              Start a considered conversation. Connect Gmail directly or through Composio, prepare
              your introduction, and approve the exact message before it’s sent.
            </p>
            <p>Connecting never sends on its own. Your approval stays part of every outreach.</p>
            <p className="availability">
              Available in the web workflow with operator setup and consent. Desktop integration is
              planned. Message above is illustrative.
            </p>
          </div>
        </section>
        <section className="dark-section dark-frame capabilities-section">
          <h2>
            All the details.
            <br />
            <span>Fewer loose ends.</span>
          </h2>
          <div className="capabilities-table">
            {[
              [
                'search',
                'Discover opportunities',
                'Import public Greenhouse boards, deduplicate roles, and review eligibility reasons.',
                'Web workflow',
              ],
              [
                'bell',
                'Keep the search moving',
                'Schedule research and optional draft preparation. Inspect runs and completion alerts.',
                'Web workflow',
              ],
              [
                'briefcase',
                'Track the next step',
                'Keep application records, prepared materials, and confirmed email delivery IDs together.',
                'Web workflow',
              ],
              [
                'folder',
                'Work from your own device',
                'Local SQLite records, career fact review, and OS-stored model credentials.',
                'Desktop alpha',
              ],
              [
                'phone',
                'Connect from anywhere',
                'An optional encrypted relay, with your desktop in control and no Pursuit account.',
                'Planned',
              ],
            ].map(([icon, title, copy, status]) => (
              <div key={title}>
                <Icon name={icon as 'search'} size={21} />
                <h3>{title}</h3>
                <p>{copy}</p>
                <span
                  className={
                    status === 'Planned' ? 'capability-status planned' : 'capability-status'
                  }
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="dark-section dark-frame connect-section" id="connect">
          <div className="section-heading-pair">
            <h2>
              Your desktop works.
              <br />
              <span>You stay connected.</span>
            </h2>
            <p>
              Pursuit Connect is the planned companion for checking progress, reviewing decisions,
              and pausing work while you’re away.
            </p>
          </div>
          <div
            className="connect-flow"
            aria-label="Planned encrypted connection between desktop and companion"
          >
            <div>
              <Icon name="monitor" size={31} />
              <strong>Your desktop</strong>
              <span>The authoritative workspace</span>
            </div>
            <span className="connect-bridge">
              <Icon name="lock" size={17} />
              <span>Optional encrypted relay</span>
            </span>
            <div>
              <Icon name="phone" size={31} />
              <strong>Your companion</strong>
              <span>Progress, approvals & control</span>
            </div>
          </div>
          <p className="connect-note">
            Planned · accountless pairing · no hosted career dashboard · desktop remains in control
          </p>
          <div className="roadmap-columns">
            <div>
              <h3>Know the opportunity.</h3>
              <p>
                Deeper company research, hiring signals, legitimate contact discovery, and broader
                job sources are part of the research roadmap.
              </p>
            </div>
            <div>
              <h3>Sound like yourself.</h3>
              <p>
                Writing preferences, richer career context, ATS-aware documents, and grounded form
                answers will build on your confirmed Career Identity.
              </p>
            </div>
            <div>
              <h3>Continue the conversation.</h3>
              <p>
                LinkedIn and X workflows, mobile notifications, and remote approvals are planned
                extensions. No social account automation is enabled today.
              </p>
            </div>
          </div>
        </section>
        <section className="privacy-section">
          <div className="dark-frame">
            <Icon name="shield" size={42} />
            <h2>
              Your career is personal.
              <br />
              <span>So is your workspace.</span>
            </h2>
            <p>
              Your desktop owns the local record. You decide which model receives a request and
              which confirmed facts go with it. External actions should be explicit, bounded, and
              traceable.
            </p>
            <a
              className="text-link"
              href={`${REPO}/blob/main/docs/specifications/SECURITY_AND_POLICY.md`}
              target="_blank"
              rel="noreferrer"
            >
              Read the control model <Icon name="arrowUpRight" size={16} />
            </a>
          </div>
        </section>
        <section className="dark-section dark-frame download-section" id="download">
          <div>
            <PursuitMark size={48} />
            <h2>
              Your next move,
              <br />
              <span>already in motion.</span>
            </h2>
            <p>Help build a better way to find what’s next.</p>
          </div>
          <DownloadOptions />
        </section>
        <section className="dark-section dark-frame faq-section" id="faq">
          <div>
            <h2>
              A little more
              <br />
              <span>clarity.</span>
            </h2>
            <p>Still curious? The source is open.</p>
            <a className="text-link" href={`${REPO}/issues`} target="_blank" rel="noreferrer">
              Ask on GitHub <Icon name="arrowUpRight" size={16} />
            </a>
          </div>
          <div>
            {questions.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Icon name="plus" size={17} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <footer className="dark-footer dark-frame">
        <div>
          <a href="/" className="brand-lockup">
            <PursuitMark size={27} />
            <Wordmark />
          </a>
          <p>
            A little less searching.
            <br />A little closer to what’s next.
          </p>
        </div>
        <nav aria-label="Footer">
          <a href="#product">The harness</a>
          <a href="#models">Models</a>
          <a href="#download">Download</a>
          <a href={REPO} target="_blank" rel="noreferrer">
            GitHub <Icon name="arrowUpRight" size={13} />
          </a>
          <a href={`${REPO}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer">
            Contribute <Icon name="arrowUpRight" size={13} />
          </a>
        </nav>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Pursuit</span>
          <span>Open source. Built for your next chapter.</span>
        </div>
      </footer>
    </div>
  );
}
