import React, { useEffect, useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
type Code = 'ui.crash' | 'ui.unhandled' | 'engine.failed' | 'storage.failed' | 'model.failed';
export function recordDiagnostic(code: Code) {
  if (isTauri()) void invoke('record_diagnostic', { code }).catch(() => {});
}
export function installErrorCapture() {
  const crash = () => recordDiagnostic('ui.crash');
  const rejection = () => recordDiagnostic('ui.unhandled');
  window.addEventListener('error', crash);
  window.addEventListener('unhandledrejection', rejection);
  return () => {
    window.removeEventListener('error', crash);
    window.removeEventListener('unhandledrejection', rejection);
  };
}
export function DiagnosticsPanel() {
  const [includeEvents, setIncludeEvents] = useState(false);
  const [report, setReport] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    setReport('');
    if (!isTauri()) {
      setNotice('Open the desktop application to inspect local diagnostics.');
      return;
    }
    void invoke('diagnostic_report', { includeEvents })
      .then((value) => {
        if (active) setReport(JSON.stringify(value, null, 2));
      })
      .catch(() => {
        if (active)
          setNotice('Diagnostics could not be loaded. You can still report an issue without them.');
      });
    return () => {
      active = false;
    };
  }, [includeEvents]);
  async function clear() {
    setBusy(true);
    try {
      await invoke('clear_diagnostics');
      setReport(JSON.stringify(await invoke('diagnostic_report', { includeEvents }), null, 2));
      setNotice('Local diagnostic events cleared.');
    } catch {
      setNotice('Could not clear events. Try again after restarting Pursuit.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="desktop-diagnostics" aria-label="Help and diagnostics">
      <h2>Report a problem</h2>
      <p>
        Tell us what you were doing, what you expected and what happened. Remove personal details
        before posting a public issue.
      </p>
      <p>
        Pursuit keeps up to 100 local event codes. It does not record error messages, resume text,
        conversations, credentials or URLs. No diagnostics are uploaded automatically.
      </p>
      <label>
        <input
          type="checkbox"
          checked={includeEvents}
          onChange={(e) => setIncludeEvents(e.target.checked)}
        />{' '}
        Include local event codes and timestamps
      </label>
      <label>
        Preview diagnostic report
        <textarea aria-label="Diagnostic report preview" readOnly value={report} rows={12} />
      </label>
      <div className="diagnostics-actions">
        <button
          disabled={!report || busy}
          onClick={() =>
            void navigator.clipboard
              .writeText(report)
              .then(() =>
                setNotice('Report copied. Review it before pasting it into a public issue.'),
              )
              .catch(() =>
                setNotice('Clipboard unavailable. Select and copy the preview manually.'),
              )
          }
        >
          Copy diagnostics
        </button>
        <button
          onClick={() =>
            void invoke('open_career_source', {
              url: 'https://github.com/Jasowills/pursuit/issues/new?template=bug_report.yml',
            })
              .then(() => setNotice('Issue form opened. Nothing has been submitted.'))
              .catch(() =>
                setNotice('Open github.com/Jasowills/pursuit/issues to report the issue manually.'),
              )
          }
        >
          Open issue form
        </button>
        <button disabled={!isTauri() || busy} onClick={() => void clear()}>
          Clear local events
        </button>
      </div>
      <p>
        Native panic events are available after restart. Force-quit, OS termination and failures
        before diagnostics start may leave no event. This is not a full operating-system crash dump.
      </p>
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
export class CrashBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean; help: boolean }
> {
  override state = { failed: false, help: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    recordDiagnostic('ui.crash');
  }
  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="desktop-recovery" aria-label="Workspace recovery">
        <h1>Pursuit could not display your workspace.</h1>
        <p>
          Your saved data has not been cleared. Restart to reopen it. Check Background work before
          retrying an application or message that was in progress.
        </p>
        <button onClick={() => window.location.reload()}>Restart Pursuit</button>
        <button onClick={() => this.setState({ help: !this.state.help })}>
          Report this problem
        </button>
        {this.state.help && <DiagnosticsPanel />}
      </main>
    );
  }
}
