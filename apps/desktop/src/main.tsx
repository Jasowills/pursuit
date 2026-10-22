import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
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
  const [settings, setSettings] = useState<'identity' | 'models' | 'agent' | null>(null);
  const [error, setError] = useState('');
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
        setError(String(e));
        setReady(true);
      });
  }, []);
  async function save(next: CareerBook) {
    await invoke('save_career_book', { body: JSON.stringify(next) });
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
        {!tour && <button onClick={() => setTour(true)}>Explore sample workspace</button>}
        {error && <span role="alert">{error}</span>}
      </div>
      <CareerWorkspace
        key={tour ? 'tour' : 'personal'}
        initialData={tour ? sample.current : book}
        sample={tour}
        connected={isTauri()}
        onSave={save}
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
              settings === 'identity'
                ? 'Career Identity'
                : settings === 'models'
                  ? 'Models & connections'
                  : 'Agent workspace'
            }
          >
            <header>
              <strong>
                {settings === 'identity'
                  ? 'Career Identity'
                  : settings === 'models'
                    ? 'Models & connections'
                    : 'Agent workspace'}
              </strong>
              <button aria-label="Close settings" onClick={() => settingsDialog.current?.close()}>
                <DeskIcon name="close" />
              </button>
            </header>
            {tour ? (
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
                {settings === 'identity' ? (
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
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
