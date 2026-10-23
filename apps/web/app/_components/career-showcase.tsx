'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';
import { usePlatform, PlatformLogo, type Platform } from './platform-download';

export function HarnessShowcase() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <figure className="harness-stage">
      <div className="harness-stage-heading">
        <span>
          <i /> Your career. One workspace.
        </span>
        <span>Desktop alpha</span>
      </div>
      <button
        ref={trigger}
        className="harness-capture"
        onClick={() => dialog.current?.showModal()}
        aria-label="Enlarge the actual desktop harness preview"
      >
        <img
          src="/product/harness-dark.png"
          width={1440}
          height={960}
          alt="Pursuit’s actual dark desktop renderer: workspace navigation, local task composer, and task inspector. Browser preview; native storage is disconnected."
          fetchPriority="high"
        />
        <span className="capture-expand">
          <Icon name="plus" size={16} /> Inspect the harness
        </span>
      </button>
      <figcaption>
        Actual desktop interface · browser preview · no simulated applications
      </figcaption>
      <dialog
        ref={dialog}
        className="harness-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
        onClose={() => trigger.current?.focus()}
        aria-label="Desktop harness preview"
      >
        <div>
          <span>Pursuit desktop · interface preview</span>
          <button onClick={() => dialog.current?.close()} aria-label="Close harness preview">
            <Icon name="close" size={20} />
          </button>
        </div>
        <img
          src="/product/harness-dark.png"
          width={1440}
          height={960}
          alt="Enlarged actual Pursuit desktop browser preview. Native storage is disconnected."
        />
      </dialog>
    </figure>
  );
}

const BULLETS = {
  platform:
    'Built internal developer tools with TypeScript and PostgreSQL, supporting a 12-person engineering team.',
  product:
    'Partnered with a 12-person engineering team to ship internal tools that simplified day-to-day workflows.',
};
export function ResumeStudy() {
  const [target, setTarget] = useState<'platform' | 'product'>('platform');
  return (
    <div className="resume-study">
      <div className="study-toolbar">
        <span>
          <Icon name="file" size={16} /> Application material
        </span>
        <span className="small-status">Illustrative example</span>
      </div>
      <div className="resume-target">
        <span id="target-label">Tailor for a role</span>
        <div role="group" aria-labelledby="target-label">
          <button aria-pressed={target === 'platform'} onClick={() => setTarget('platform')}>
            Platform engineer
          </button>
          <button aria-pressed={target === 'product'} onClick={() => setTarget('product')}>
            Product engineer
          </button>
        </div>
      </div>
      <div className="resume-paper">
        <div className="paper-title">
          <div>
            <strong>Alex Morgan</strong>
            <span>Software engineer</span>
          </div>
          <Icon name="file" size={25} />
        </div>
        <div className="resume-line">
          <span>Original experience</span>
          <p>Built internal tools using TypeScript and PostgreSQL. Worked with 12 engineers.</p>
        </div>
        <div className="resume-line tailored">
          <span>
            <Icon name="sparkles" size={13} /> Tailored emphasis
          </span>
          <p key={target} aria-live="polite">
            {BULLETS[target]}
          </p>
        </div>
        <div className="paper-foot">
          <Icon name="check" size={14} /> Same experience. A clearer case for the role.
        </div>
      </div>
      <p className="study-disclosure">
        Interactive writing example, not live AI generation. No extra skills or results have been
        invented.
      </p>
    </div>
  );
}

const STEPS = [
  'Check your search boundaries',
  'Discover matching opportunities',
  'Prepare grounded materials',
  'Apply within your policy',
  'Record evidence & notify you',
];
export function AutopilotStudy() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [limit, setLimit] = useState('5');
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () =>
        setStep((s) => {
          if (s >= 4) {
            setRunning(false);
            return s;
          }
          return s + 1;
        }),
      850,
    );
    return () => clearInterval(timer);
  }, [running]);
  return (
    <div className="autopilot-study">
      <div className="study-toolbar">
        <span>
          <Icon name="command" size={16} /> Career autopilot
        </span>
        <span className="small-status">Workflow preview</span>
      </div>
      <div className="policy-settings">
        <div>
          <span>Your boundaries</span>
          <strong>Software engineering · Remote</strong>
        </div>
        <label>
          Daily application cap
          <select value={limit} disabled={running} onChange={(e) => setLimit(e.target.value)}>
            <option value="5">5 applications</option>
            <option value="10">10 applications</option>
            <option value="15">15 applications</option>
          </select>
        </label>
        <p>
          <Icon name="lock" size={14} /> Outreach always needs your approval
        </p>
      </div>
      <ol className="autopilot-steps" aria-label="Illustrated autopilot workflow">
        {STEPS.map((s, i) => (
          <li
            key={s}
            data-state={
              i < step || (step === 4 && !running) ? 'done' : i === step ? 'active' : 'waiting'
            }
          >
            <span>
              {i < step || (step === 4 && !running) ? <Icon name="check" size={13} /> : <i />}
            </span>
            <div>
              {s}
              {i === 3 && <small>Executor in development</small>}
            </div>
          </li>
        ))}
      </ol>
      <div className="simulation-footer">
        <button
          className="dark-button"
          disabled={running}
          onClick={() => {
            setStep(0);
            setRunning(true);
          }}
        >
          <Icon name={running ? 'clock' : 'command'} size={15} />
          {running ? 'Walking through…' : step === 4 ? 'Replay workflow' : 'Preview the workflow'}
        </button>
        <span role="status">
          {step === 4 && !running
            ? `Preview complete · cap ${limit} · nothing submitted`
            : 'Illustration only. No jobs are fetched or submitted.'}
        </span>
      </div>
    </div>
  );
}

export function DownloadOptions() {
  const detected = usePlatform();
  const [choice, setChoice] = useState<Platform | null>(null);
  const platform = choice || detected || 'macOS';
  const [macChip, setMacChip] = useState<'apple-silicon' | 'intel'>('apple-silicon');
  return (
    <div className="download-options release-downloads">
      <div className="platform-picker" role="group" aria-label="Choose your operating system">
        {(['macOS', 'Windows', 'Linux'] as const).map((os) => (
          <button key={os} aria-pressed={platform === os} onClick={() => setChoice(os)}>
            <span className="download-os-mark">
              <PlatformLogo platform={os} size={20} />
            </span>
            <strong>{os}</strong>
          </button>
        ))}
      </div>
      <div className="release-download-detail">
        <header className="download-platform-heading">
          <PlatformLogo platform={platform} size={42} />
          <div>
            <h3>Pursuit for {platform}</h3>
            <p>
              {platform === 'macOS'
                ? `${macChip === 'apple-silicon' ? 'Apple Silicon · arm64' : 'Intel · x64'} · DMG`
                : platform === 'Windows'
                  ? '64-bit Windows · EXE'
                  : '64-bit Linux · DEB & AppImage'}
            </p>
          </div>
        </header>
        <div className="download-target-choice">
          {platform === 'macOS' && (
            <label>
              Mac processor
              <select
                aria-label="Mac processor"
                value={macChip}
                onChange={(e) => setMacChip(e.target.value as 'apple-silicon' | 'intel')}
              >
                <option value="apple-silicon">Apple Silicon (M1 and newer)</option>
                <option value="intel">Intel</option>
              </select>
            </label>
          )}
          <p>
            {platform === 'macOS'
              ? 'Choose the processor shown in About This Mac.'
              : `${platform} ARM builds are not yet qualified.`}
          </p>
        </div>
        <p className="download-availability">
          Developer alpha. Source code and unsigned test builds.
        </p>
        <div className="download-actions">
          <a
            className="dark-button primary"
            href="https://github.com/Jasowills/pursuit/archive/refs/heads/main.zip"
          >
            <Icon name="download" size={17} />
            Download source ZIP
          </a>
          <a
            className="download-build-link"
            href="https://github.com/Jasowills/pursuit/actions/workflows/desktop-alpha.yml"
            target="_blank"
            rel="noreferrer"
          >
            View unsigned builds
            <Icon name="arrowUpRight" size={15} />
          </a>
        </div>
        <details className="download-setup-details">
          <summary>
            Setup & build details <Icon name="chevronDown" size={15} />
          </summary>
          <div>
            <p>
              The ZIP contains source code. Unsigned installers are available in successful GitHub
              builds and require GitHub sign-in. Public signed releases are not available yet.
            </p>
            <p>
              Install Node 22.13+ and connect your own model. Applications also need a configured
              Chromium browser. On a Mac, choose Apple Silicon or Intel explicitly; a browser cannot
              reliably identify your processor.
            </p>
            <a
              href="https://github.com/Jasowills/pursuit/blob/main/docs/DESKTOP_BUILD_STATUS.md"
              target="_blank"
              rel="noreferrer"
            >
              Read the build guide <Icon name="arrowUpRight" size={14} />
            </a>
          </div>
        </details>
      </div>
    </div>
  );
}
