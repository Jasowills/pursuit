import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { invoke, isTauri } from '@tauri-apps/api/core';
import './style.css';
import { CareerIdentity } from './identity';
import { Models } from './models';
import { AgentWorkspace } from './agent';

type Task = { id: string; title: string; status: string; createdAt: string };
type Workspace = { databasePath: string; schemaVersion: number; tasks: Task[] };
function App() {
  const [screen, setScreen] = useState<'workspace' | 'identity' | 'models' | 'agent'>('workspace');
  const [workspace, setWorkspace] = useState<Workspace>();
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string>();
  async function load() {
    setError('');
    if (!isTauri()) {
      setError(
        'Open the desktop app to access your local workspace. This browser preview cannot save tasks.',
      );
      return;
    }
    try {
      setWorkspace(await invoke<Workspace>('workspace'));
    } catch (e) {
      setError(String(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const task = await invoke<Task>('save_task', { title });
      setTitle('');
      setSelected(task.id);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  const task = workspace?.tasks.find((t) => t.id === selected);
  return (
    <div className="desktop">
      <aside className="sidebar">
        <a className="brand" href="#workspace">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="9" fill="#5445db" />
            <path d="M9 23 23 9M11 9h12v12" fill="none" stroke="white" strokeWidth="2.5" />
          </svg>
          pursuit<span>.</span>
        </a>
        <div className="workspace-label">Personal workspace</div>
        <nav aria-label="Workspace">
          <a
            href="#workspace"
            onClick={() => setScreen('workspace')}
            aria-current={screen === 'workspace' ? 'page' : undefined}
          >
            Workspace
          </a>
          <a
            href="#identity"
            onClick={() => setScreen('identity')}
            aria-current={screen === 'identity' ? 'page' : undefined}
          >
            Career Identity
          </a>
          <a
            href="#models"
            onClick={() => setScreen('models')}
            aria-current={screen === 'models' ? 'page' : undefined}
          >
            Models
          </a>
          <a
            href="#agent"
            onClick={() => setScreen('agent')}
            aria-current={screen === 'agent' ? 'page' : undefined}
          >
            Agent workspace
          </a>
          <a href="#local-data">Local data</a>
        </nav>
        <div className="sidebar-bottom">
          <span className="status-dot" /> Local desktop alpha
          <p>Your workspace stays on this device.</p>
        </div>
      </aside>
      <main id="workspace">
        <header className="topbar">
          <span>
            {screen === 'identity'
              ? 'Career Identity'
              : screen === 'models'
                ? 'Models'
                : screen === 'agent'
                  ? 'Agent workspace'
                  : 'Workspace'}
          </span>
          <span className="local-state">
            {workspace ? 'Local storage connected' : 'Desktop connection required'}
          </span>
        </header>
        <div className="content">
          {screen === 'identity' ? (
            <CareerIdentity />
          ) : screen === 'models' ? (
            <Models />
          ) : screen === 'agent' ? (
            <AgentWorkspace />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <h1>Your next move starts here.</h1>
                  <p>Keep your career work in one place, on your own device.</p>
                </div>
                <span className="version">Alpha · foundation</span>
              </div>
              {error && (
                <div className="notice" role="alert">
                  {error}
                  {isTauri() && <button onClick={() => void load()}>Retry connection</button>}
                </div>
              )}
              <section className="composer" aria-labelledby="composer-title">
                <h2 id="composer-title">What would you like to work on?</h2>
                <form onSubmit={save}>
                  <label htmlFor="task">Task or opportunity</label>
                  <textarea
                    id="task"
                    disabled={busy}
                    value={title}
                    maxLength={2000}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Research a role, prepare an application, or plan your next move…"
                  />
                  <div className="composer-footer">
                    <span>Saved locally. Open Agent workspace for model sessions.</span>
                    <button disabled={!workspace || busy || !title.trim()} type="submit">
                      {busy ? 'Saving…' : 'Save task'}
                    </button>
                  </div>
                </form>
              </section>
              <section className="task-section" aria-labelledby="tasks-title">
                <div className="section-heading">
                  <h2 id="tasks-title">Your tasks</h2>
                  <span>{workspace?.tasks.length ?? 0} saved</span>
                </div>
                {!workspace?.tasks.length ? (
                  <div className="empty">
                    <h3>A clear space for your next opportunity.</h3>
                    <p>Save your first task above. It will be here when you reopen Pursuit.</p>
                  </div>
                ) : (
                  <ul className="task-list">
                    {workspace.tasks.map((t) => (
                      <li key={t.id}>
                        <button
                          className={selected === t.id ? 'task selected' : 'task'}
                          aria-pressed={selected === t.id}
                          onClick={() => setSelected(t.id)}
                        >
                          <span>
                            <strong>{t.title}</strong>
                            <small>{new Date(t.createdAt).toLocaleString()}</small>
                          </span>
                          <span className="tag">Saved</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <aside className="inspector" aria-label="Task details">
        <h2>
          {screen === 'identity'
            ? 'Identity review'
            : screen === 'models'
              ? 'Model connections'
              : task
                ? 'Task details'
                : screen === 'agent'
                  ? 'Session controls'
                  : 'Your workspace'}
        </h2>
        {screen === 'workspace' && task ? (
          <>
            <h3>{task.title}</h3>
            <dl>
              <dt>Status</dt>
              <dd>Saved locally</dd>
              <dt>Created</dt>
              <dd>{new Date(task.createdAt).toLocaleString()}</dd>
            </dl>
            <p>This task is saved. No research, model generation, or external action has run.</p>
          </>
        ) : (
          <p>
            {screen === 'identity'
              ? 'Review the source excerpt before confirming an answer. Conflicting confirmed values require an explicit replacement.'
              : screen === 'models'
                ? 'Ollama is checked through the native Core. Text generation tests do not verify agent tools or authorize application actions.'
                : screen === 'agent'
                  ? 'Session output remains a draft. Tools are denied. Interrupt reports whether OpenCode stopped active execution; it does not delete queued work.'
                  : 'Select a saved task to inspect its details.'}
          </p>
        )}
        <section id="local-data">
          <h3>Local data</h3>
          <p>SQLite storage is owned by the native Core. Your browser cannot access it.</p>
          <dl>
            <dt>Database</dt>
            <dd className="path">{workspace?.databasePath ?? 'Available in the desktop app'}</dd>
            <dt>Schema version</dt>
            <dd>{workspace?.schemaVersion ?? '—'}</dd>
          </dl>
        </section>
        <section>
          <h3>What’s available</h3>
          <p>Task history, Career Identity review, provider settings and managed draft sessions.</p>
          <h3>Coming next</h3>
          <p>
            Grounded application packets, document export and browser execution. Automatic
            applications are not enabled.
          </p>
        </section>
      </aside>
    </div>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
