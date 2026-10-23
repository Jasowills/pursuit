import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CrashBoundary,
  DiagnosticsPanel,
  installErrorCapture,
  recordDiagnostic,
} from './diagnostics';
import { EngineSetup } from './engine-setup';
import { listen } from '@tauri-apps/api/event';
import type { EngineClient, EngineProgress } from '@pursuit/career-engine/contracts';
import { invoke, isTauri } from '@tauri-apps/api/core';
import {
  CareerWorkspace,
  CareerBook,
  EMPTY_BOOK,
  sampleBook,
  DeskIcon,
} from '@pursuit/ui/career-workspace';
import '@pursuit/ui/career-workspace.css';
import './style.css';
import { CareerIdentity } from './identity';
import { Models } from './models';
import { AgentWorkspace } from './agent';
function App() {
  const [book, setBook] = useState<CareerBook>(EMPTY_BOOK);
  const [tour, setTour] = useState(new URLSearchParams(location.search).get('tour') === '1');
  const [settings, setSettings] = useState<
    'identity' | 'models' | 'agent' | 'engine' | 'diagnostics' | null
  >(null);
  const [error, setError] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  const [engineWorking, setEngineWorking] = useState(false);
  const [engineProgress, setEngineProgress] = useState<EngineProgress>();
  const engineQueue = useRef<Promise<unknown>>(Promise.resolve());
  const engineRequests = useRef(0);
  const engineCall: EngineClient = useCallback((request, onProgress) => {
    engineRequests.current++;
    setEngineWorking(true);
    const task = engineQueue.current
      .catch(() => {})
      .then(async () => {
        if (!isTauri()) throw Error('Open the native desktop app to use the local engine.');
        const requestId = crypto.randomUUID();
        setEngineProgress(undefined);
        const unlisten = await listen<{ requestId: string; event: EngineProgress }>(
          'career-engine-progress',
          (event) => {
            if (event.payload.requestId === requestId) {
              setEngineProgress(event.payload.event);
              onProgress?.(event.payload.event);
            }
          },
        );
        try {
          return await invoke('career_engine_call', { requestId, request });
        } catch (error) {
          recordDiagnostic('engine.failed');
          throw new Error(String(error).replace(/_/g, ' '));
        } finally {
          await Promise.resolve(unlisten()).catch(() => {});
        }
      })
      .finally(() => {
        engineRequests.current--;
        setEngineWorking(engineRequests.current > 0);
      });
    engineQueue.current = task;
    return task;
  }, []);
  useEffect(() => {
    if (!isTauri()) return;
    const open = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest?.(
        '.career-workspace a[target="_blank"]',
      ) as HTMLAnchorElement | null;
      if (link) {
        event.preventDefault();
        void invoke('open_career_source', { url: link.href }).catch((e) => setError(String(e)));
      }
    };
    document.addEventListener('click', open, true);
    return () => document.removeEventListener('click', open, true);
  }, []);
  const [ready, setReady] = useState(false);
  const settingsDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (settings) settingsDialog.current?.showModal();
  }, [settings]);
  const session = useRef('');
  const cancelled = useRef(false);
  const sample = useRef(sampleBook());
  useEffect(() => {
    if (!isTauri()) {
      setReady(true);
      return;
    }
    invoke<string | null>('career_book')
      .then(async (raw) => {
        if (raw) setBook(JSON.parse(raw));
        else {
          const legacy = await invoke<{ tasks?: { title: string }[] } | null>('workspace');
          if (legacy?.tasks?.length)
            setBook({ ...EMPTY_BOOK, notes: legacy.tasks.map((task) => task.title) });
        }
        setReady(true);
      })
      .catch((e) => {
        recordDiagnostic('storage.failed');
        setLoadFailed(true);
        setError(String(e));
        setReady(true);
      });
  }, []);
  async function save(next: CareerBook) {
    if (loadFailed) throw new Error('Reopen the saved workspace before making changes.');
    try {
      await invoke('save_career_book', { body: JSON.stringify(next) });
    } catch (e) {
      recordDiagnostic('storage.failed');
      throw e;
    }
    setBook(next);
  }
  async function ask(text: string, includeFacts: boolean, partial: (v: string) => void) {
    if (!isTauri())
      throw new Error('Open the desktop app and connect a model, or explore the sample workspace.');
    const runtime = await invoke<{ running: boolean; provider: string }>('managed_status');
    if (!runtime.running || runtime.provider === 'offline')
      throw new Error(
        'Connect your model in Models & connections, then start it in Agent workspace. No request was sent.',
      );
    session.current = await invoke<string>('managed_create', { title: text.slice(0, 80) });
    cancelled.current = false;
    await invoke('managed_prompt', {
      id: session.current,
      text,
      execute: true,
      includeIdentity: includeFacts,
    });
    let latest = '';
    for (let i = 0; i < 60; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const view = await invoke<{ state: string; messages: { role: string; text: string }[] }>(
        'managed_view',
        { id: session.current },
      );
      const message = [...view.messages]
        .reverse()
        .find((m) => m.role === 'assistant' || m.role === 'assistant_live');
      if (message) {
        latest = message.text;
        partial(latest);
      }
      if (['completed', 'idle'].includes(view.state) && latest) return latest;
      if (['failed', 'interrupted'].includes(view.state) || cancelled.current)
        throw new Error(
          `The session ${cancelled.current ? 'was interrupted' : view.state}. Inspect it in Agent workspace; it will not be resent automatically.`,
        );
    }
    throw new Error(
      'The session is still unresolved. Inspect it in Agent workspace before sending another request.',
    );
  }
  if (loadFailed)
    return (
      <main className="desktop-recovery">
        <h1>Your saved workspace could not be opened.</h1>
        <p>
          Editing is paused to protect your existing records. Restart Pursuit to try loading them
          again.
        </p>
        <button onClick={() => window.location.reload()}>Retry opening workspace</button>
        <DiagnosticsPanel />
      </main>
    );
  if (!ready) return <div className="desktop-loading">Opening your local career workspace…</div>;
  return (
    <>
      <div className="desktop-utility">
        <span>
          {tour
            ? 'You’re exploring a sample career. No external actions.'
            : isTauri()
              ? 'Your workspace is saved on this device.'
              : 'Desktop interface preview'}
        </span>
        {!tour && (
          <>
            <button disabled={engineWorking} onClick={() => setTour(true)}>
              Explore sample workspace
            </button>
            {isTauri() && (
              <button
                onClick={() =>
                  void invoke('career_engine_pause')
                    .then(() =>
                      setError(
                        'Pending applications paused and approvals revoked. A submission already sent may still complete; check Background work.',
                      ),
                    )
                    .catch((e) => setError(String(e)))
                }
              >
                Pause pending applications
              </button>
            )}
          </>
        )}
        <button onClick={() => setSettings('diagnostics')}>Help & report an issue</button>
        {error && <span role="alert">{error}</span>}
      </div>
      <CareerWorkspace
        key={tour ? 'tour' : 'personal'}
        initialData={tour ? sample.current : book}
        sample={tour}
        connected={isTauri()}
        onSave={save}
        onEngine={isTauri() && !tour ? engineCall : undefined}
        engineProgress={engineProgress}
        onEngineSetup={() => setSettings('engine')}
        onSavePdf={
          isTauri()
            ? (hash, bytes) => invoke('save_resume_pdf', { hash, bytes: Array.from(bytes) })
            : undefined
        }
        onExportPdf={
          isTauri() ? (hash) => invoke<string>('export_resume_pdf', { hash }) : undefined
        }
        onAsk={ask}
        onCancel={() => {
          cancelled.current = true;
          if (session.current) void invoke('managed_interrupt', { id: session.current });
        }}
        onSettings={setSettings}
        onExitSample={() => setTour(false)}
      />
      {settings && (
        <dialog
          ref={settingsDialog}
          className="desktop-settings-dialog"
          aria-label="Career settings"
          onClose={() => setSettings(null)}
        >
          <section
            className="desktop-settings"
            role="dialog"
            aria-modal="true"
            aria-label={
              settings === 'diagnostics'
                ? 'Help & diagnostics'
                : settings === 'identity'
                  ? 'Career Identity'
                  : settings === 'models'
                    ? 'Models & connections'
                    : settings === 'engine'
                      ? 'Sourcing & execution setup'
                      : 'Agent workspace'
            }
          >
            <header>
              <strong>
                {settings === 'diagnostics'
                  ? 'Help & diagnostics'
                  : settings === 'identity'
                    ? 'Career Identity'
                    : settings === 'models'
                      ? 'Models & connections'
                      : settings === 'engine'
                        ? 'Sourcing & execution setup'
                        : 'Agent workspace'}
              </strong>
              <button aria-label="Close settings" onClick={() => settingsDialog.current?.close()}>
                <DeskIcon name="close" />
              </button>
            </header>
            {settings === 'diagnostics' ? (
              <DiagnosticsPanel />
            ) : tour ? (
              <div className="desktop-settings-preview">
                <h2>Your context. Your choice.</h2>
                <p>
                  This is a sample workspace. Exit the tour to manage your real career information,
                  model keys and sessions.
                </p>
                <button
                  onClick={() => {
                    setTour(false);
                    setSettings(null);
                  }}
                >
                  Return to your workspace
                </button>
              </div>
            ) : (
              <div className="desktop-settings-content">
                {settings === 'engine' ? (
                  <EngineSetup />
                ) : settings === 'identity' ? (
                  <CareerIdentity />
                ) : settings === 'models' ? (
                  <Models />
                ) : (
                  <AgentWorkspace />
                )}
              </div>
            )}
          </section>
        </dialog>
      )}
    </>
  );
}
installErrorCapture();
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CrashBoundary>
      <App />
    </CrashBoundary>
  </React.StrictMode>,
);
