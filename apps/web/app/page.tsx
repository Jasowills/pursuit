import { LandingHeader, PursuitMark, Wordmark } from './_components/header';
import { Icon } from './_components/icons';
import { DownloadOptions } from './_components/career-showcase';
import { OpportunityField } from './_components/opportunity-field';
import {
  HarnessFeature,
  DocumentWorkshop,
  OutreachShowcase,
  BackgroundShowcase,
  ClosingInvitation,
} from './_components/career-journey';
import './landing-dark.css';
import './career-story.css';
import './source-story.css';
import './neutral-refinement.css';
import { FooterWordmark } from './_components/footer-wordmark';
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
    'The planned autopilot offers individual review or automatic applications within limits you set. The current desktop does not submit applications. Approved Gmail outreach is available in the retained web workflow.',
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
    'The tour shows a script and recording checklist for a sample role. You record the video yourself. Automatic detection of video requirements is not connected in the desktop alpha.',
  ],
  [
    'What is available in the current alpha?',
    'The desktop alpha stores career records locally, connects to your model, discovers roles from configured sources and prepares source-backed resumes and PDFs. The Ashby executor supports inspecting a form and approving an exact application, with fixture testing completed. Live submissions and clean-machine installs still need qualification. Gmail outreach runs through the separate web workflow. Public signed installers are not published; source builds are available.',
  ],
  [
    'Where does my data go?',
    'Your desktop workspace is stored locally in SQLite and model keys use the operating system credential store. Your selected model provider receives the requests you explicitly send and any confirmed career facts you choose to include.',
  ],
  [
    'Can I contribute?',
    'Yes. Read the contribution guide, open an issue or submit a pull request. The repository includes build instructions and a checklist of the features that still need work.',
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
              Find roles, prepare applications and keep track of your search.
              <br className="desktop-break" /> An open-source workspace for your own AI model.
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
            <p className="hero-alpha-note">
              Desktop alpha · local workspace · bring your own model
            </p>
          </div>
          <div className="hero-path-labels" aria-hidden="true">
            <span>
              <Icon name="search" size={14} /> Find roles
            </span>
            <span>
              <Icon name="file" size={14} /> Tailor your resume
            </span>
            <span>
              <Icon name="arrowUpRight" size={14} /> Review applications
            </span>
          </div>
          <div className="hero-models dark-frame">
            <span>Use your own model</span>
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
        <BackgroundShowcase />
        <WatchersShowcase />
        <OutreachShowcase />{' '}
        <section className="dark-section dark-frame models-section" id="models">
          <div className="section-heading-pair">
            <h2>
              Choose the model
              <br />
              <span>you want to work with.</span>
            </h2>
            <p>
              Connect your provider account or run a local model with Ollama. Choose a model you
              have access to, then test the connection.
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
        <section className="dark-section dark-frame download-section" id="download">
          <div>
            <PursuitMark size={48} />
            <h2>
              Try Pursuit
              <br />
              <span>on your computer.</span>
            </h2>
            <p>
              Build the desktop alpha from source.
              <br />
              Connect your model to start a conversation.
            </p>
          </div>
          <DownloadOptions />
        </section>
        <section className="dark-section dark-frame faq-section" id="faq">
          <div>
            <h2>
              Before
              <br />
              <span>you start.</span>
            </h2>
            <p>Setup, privacy and current availability.</p>
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
                A local-first career workspace.
                <br />
                Open source, with your own model.
              </p>
            </div>
            <nav aria-label="Footer product">
              <h3>Product</h3>
              <a href="#product">The harness</a>
              <a href="#features">Resume tailoring</a>
              <a href="#autopilot">Career autopilot</a>
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
          <FooterWordmark />
          <div className="footer-colophon">
            <span>© {new Date().getFullYear()} Pursuit</span>
            <span>
              <i /> Open source on GitHub.
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
