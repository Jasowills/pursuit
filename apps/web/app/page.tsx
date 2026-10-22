import { LandingHeader, PursuitMark, Wordmark } from './_components/header';
import { Icon } from './_components/icons';
import { DownloadOptions } from './_components/career-showcase';
import { OpportunityField } from './_components/opportunity-field';
import {
  HarnessFeature,
  DocumentWorkshop,
  CompanionShowcase,
  OutreachShowcase,
  BackgroundShowcase,
  ClosingInvitation,
} from './_components/career-journey';
import './landing-dark.css';
import './career-story.css';
import './source-story.css';
import { SourceStory, WatchersShowcase } from './_components/source-story';
import { HeroDownload } from './_components/platform-download';

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
    'How does Pursuit learn about me?',
    'Career Identity keeps your confirmed experience, preferences and career facts together. You review source material, correct assumptions and choose which confirmed facts go with a model request.',
  ],
  [
    'Can I choose when Pursuit applies?',
    'The product supports two intended workflows: review individual applications or set explicit limits for autopilot. Your preferences and exclusions define the boundaries. Cold outreach always requires your approval.',
  ],
  [
    'Which models can I use?',
    'Bring your own access to OpenAI, Claude, Gemini, OpenRouter, Groq or OpenCode hosted inference, or use local models through Ollama. Your provider determines access and usage charges. OpenCode is also the managed agent runtime.',
  ],
  [
    'Can I connect my own Gmail?',
    'Yes, the existing web workflow supports direct Google OAuth and Composio. Each connection requires setup and consent; connecting an inbox never sends an email on its own.',
  ],
  [
    'What happens when a role asks for a video?',
    'The product journey brings that requirement to your attention, connects it to a relevant career story, and prepares a timed script and recording checklist. You record and review the video yourself.',
  ],
  [
    'What is available in the current alpha?',
    'The interactive tour shows the intended complete career experience using fictional sample data. The desktop alpha provides local career records, model connections, identity review and managed AI draft conversations. Desktop source discovery, Gmail execution, application packets, autonomous submission and the companion are not connected yet. Scheduled research, preparation and approved Gmail outreach exist in the retained web workflow. Public signed installers are not published; source builds are available.',
  ],
  [
    'Where does my data go?',
    'Your desktop workspace is stored locally in SQLite and model keys use the operating system credential store. Your selected model provider receives the requests you explicitly send and any confirmed career facts you choose to include.',
  ],
  [
    'Can I contribute?',
    'Pursuit is open source. The repository includes the source, build instructions and contribution guide. Help shape a career assistant that people can inspect and make their own.',
  ],
];
export default function HomePage() {
  return (
    <div className="dark-landing">
      <LandingHeader />
      <main id="main">
        {' '}
        <section className="dark-hero">
          <OpportunityField />
          <div className="hero-copy dark-frame">
            <h1>
              Your career.
              <br />
              <span>In forward motion.</span>
            </h1>
            <p>
              An open source career harness for the work between
              <br className="desktop-break" /> where you are and where you want to be.
            </p>
            <div className="dark-actions">
              <HeroDownload />
              <a href="#how-it-works" className="hero-watch">
                <span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="m5 3 8 5-8 5z" />
                  </svg>
                </span>{' '}
                See it in motion
              </a>
            </div>
            <p className="hero-alpha-note">Desktop alpha. Your models. Your direction.</p>
          </div>
          <div className="hero-path-labels" aria-hidden="true">
            <span>
              <Icon name="search" size={14} /> Find your fit
            </span>
            <span>
              <Icon name="file" size={14} /> Make your case
            </span>
            <span>
              <Icon name="arrowUpRight" size={14} /> Move forward
            </span>
          </div>
          <div className="hero-models dark-frame">
            <span>Made for your model.</span>
            <div>
              {providers.map(([name, logo]) => (
                <a key={name} href="#models" aria-label={`Explore ${name} connection`}>
                  <img src={`/brands/${logo}`} alt="" width={28} height={28} />
                  <span>{name}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
        <SourceStory />
        <HarnessFeature />
        <DocumentWorkshop />
        <CompanionShowcase />
        <BackgroundShowcase />
        <WatchersShowcase />
        <OutreachShowcase />{' '}
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
        <section className="career-context-section dark-frame">
          <div>
            <Icon name="user" size={32} />
            <h2>
              An assistant that
              <br />
              <span>starts with you.</span>
            </h2>
          </div>
          <div>
            <p>
              Your history is more than a list of employers. It’s what you’re proud of, the work you
              want more of, and the things you won’t compromise on.
            </p>
            <p>
              Keep your career facts, preferences and writing voice close to the work. Review the
              context. Correct it. Make the next application feel more like you.
            </p>
            <a className="text-link" href="/product-tour">
              Explore Career Identity <Icon name="arrowUpRight" size={15} />
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
            <p>
              Bring your model. Bring your experience.
              <br />
              Make room for what comes next.
            </p>
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
            <p>Your questions, answered.</p>
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
        <ClosingInvitation />
      </main>{' '}
      <footer className="new-footer">
        <div className="dark-frame">
          <div className="footer-directory">
            <div className="footer-about">
              <a href="/" className="brand-lockup">
                <PursuitMark size={30} />
                <Wordmark />
              </a>
              <p>
                Your career, in forward motion.
                <br />
                Open source. Local-first. Yours.
              </p>
            </div>
            <nav aria-label="Footer product">
              <h3>Product</h3>
              <a href="#product">The harness</a>
              <a href="#features">Resume tailoring</a>
              <a href="#autopilot">Career autopilot</a>
              <a href="#connect">Pursuit Connect</a>
              <a href="#download">Download</a>
            </nav>
            <nav aria-label="Footer resources">
              <h3>Resources</h3>
              <a
                href={`${REPO}/blob/main/docs/DESKTOP_BUILD_STATUS.md`}
                target="_blank"
                rel="noreferrer"
              >
                Documentation <Icon name="arrowUpRight" size={12} />
              </a>
              <a href="#models">Model connections</a>
              <a href="#faq">Questions & answers</a>
              <a
                href={`${REPO}/blob/main/docs/specifications/SECURITY_AND_POLICY.md`}
                target="_blank"
                rel="noreferrer"
              >
                Privacy & control <Icon name="arrowUpRight" size={12} />
              </a>
            </nav>
            <nav aria-label="Footer open source">
              <h3>Build with us</h3>
              <a href={REPO} target="_blank" rel="noreferrer">
                GitHub <Icon name="arrowUpRight" size={12} />
              </a>
              <a href={`${REPO}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer">
                Contribute <Icon name="arrowUpRight" size={12} />
              </a>
              <a href={`${REPO}/issues`} target="_blank" rel="noreferrer">
                Report an issue <Icon name="arrowUpRight" size={12} />
              </a>
            </nav>
          </div>
          <div className="footer-large-word" aria-hidden="true" data-animated="true">
            pursuit<span>.</span>
          </div>
          <div className="footer-colophon">
            <span>© {new Date().getFullYear()} Pursuit</span>
            <span>
              <i /> Built for what’s next.
            </span>
            <a href="#main">
              Back to top <Icon name="arrowUpRight" size={13} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
