import { useEffect, useRef, useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
type RuntimeStatus = { running: boolean; provider: string; model: string; directory: string };
type Session = {
  id: string;
  title: string;
  provider: string;
  model: string;
  state: string;
  snapshot: string;
  updatedAt: string;
};
type Message = { role: string; text: string };
type View = { id: string; state: string; messages: Message[] };
type Connection = { id: string; name: string; credentialSaved: boolean; storeError: string | null };
export function AgentWorkspace() {
  const [runtime, setRuntime] = useState<RuntimeStatus>({
    running: false,
    provider: '',
    model: '',
    directory: '',
  });
  const [provider, setProvider] = useState('offline');
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState('');
  const [family, setFamily] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [history, setHistory] = useState<Session[]>([]);
  const [selected, setSelected] = useState('');
  const [view, setView] = useState<View>();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [includeIdentity, setIncludeIdentity] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshError, setRefreshError] = useState('');
  const refreshing = useRef(false);
  const selectedRef = useRef('');
  const drafts = useRef<Record<string, string>>({});
  async function load() {
    if (!isTauri()) return;
    setRuntime(await invoke<RuntimeStatus>('managed_status'));
    setHistory(await invoke<Session[]>('managed_history'));
  }
  useEffect(() => {
    if (!isTauri()) return;
    void load().catch((e) => setError(String(e)));
    void invoke<Connection[]>('provider_connections')
      .then(setConnections)
      .catch((e) => setError(String(e)));
  }, []);
  async function refresh(id = selected) {
    if (!id || refreshing.current || !isTauri()) return;
    refreshing.current = true;
    try {
      const result = await invoke<View>('managed_view', { id });
      if (selectedRef.current !== id) return;
      setView(result);
      setRefreshError('');
      await load();
    } catch (e) {
      if (selectedRef.current === id) setRefreshError(String(e));
    } finally {
      refreshing.current = false;
    }
  }
  useEffect(() => {
    if (!runtime.running || !selected) return;
    let mounted = true;
    let unlisten: (() => void) | undefined;
    void listen('runtime-update', () => {
      if (mounted) void refresh(selected);
    })
      .then((fn) => {
        if (mounted) unlisten = fn;
        else fn();
      })
      .catch(() => {});
    const timer = setInterval(() => void refresh(selected), 2000);
    void refresh(selected);
    return () => {
      mounted = false;
      clearInterval(timer);
      unlisten?.();
    };
  }, [runtime.running, selected]);
  async function choose(session: Session) {
    selectedRef.current = session.id;
    setSelected(session.id);
    setText(drafts.current[session.id] ?? '');
    setIncludeIdentity(false);
    setRefreshError('');
    try {
      setView({
        id: session.id,
        state: session.state,
        messages: JSON.parse(session.snapshot) as Message[],
      });
    } catch {
      setView({ id: session.id, state: 'unknown', messages: [] });
    }
    if (runtime.running) await refresh(session.id);
  }
  async function action(kind: 'models' | 'start' | 'stop' | 'create' | 'prompt' | 'interrupt') {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (kind === 'models') {
        setModels([]);
        setModel('');
        const found =
          provider === 'ollama'
            ? (await invoke<{ name: string }[]>('ollama_models')).map((m) => m.name)
            : (await invoke<{ models: string[] }>('provider_models', { providerId: provider }))
                .models;
        setModels(found);
        setModel(found[0] ?? '');
        if (!found.length) setNotice('No models returned. Check Models settings.');
      }
      if (kind === 'start') {
        setRuntime(await invoke<RuntimeStatus>('managed_start', { provider, model, family }));
        setNotice('Authenticated local runtime started. No prompt was sent.');
      }
      if (kind === 'stop') {
        await invoke('managed_stop');
        setNotice(
          'Runtime process stopped. Upstream inference already sent may continue at the provider. Refresh after restarting before retrying work.',
        );
      }
      if (kind === 'create') {
        const id = await invoke<string>('managed_create', { title });
        selectedRef.current = id;
        setSelected(id);
        setText('');
        setIncludeIdentity(false);
        setTitle('');
        setView({ id, state: 'idle', messages: [] });
        setNotice('Session created. No model request has run.');
      }
      if (kind === 'prompt') {
        await invoke('managed_prompt', {
          id: selected,
          text,
          execute: runtime.provider !== 'offline',
          includeIdentity,
        });
        setText('');
        drafts.current[selected] = '';
        setNotice(
          runtime.provider === 'offline'
            ? 'Prompt queued in OpenCode without execution. Offline sessions cannot generate.'
            : 'Prompt admitted by OpenCode. The runtime now owns execution; inspect the actual session state below.',
        );
        await refresh();
      }
      if (kind === 'interrupt') {
        const interrupted = await invoke<boolean>('managed_interrupt', { id: selected });
        setNotice(
          interrupted
            ? 'OpenCode confirmed active execution was interrupted.'
            : 'OpenCode reported no active execution to interrupt. Queued work is not deleted.',
        );
        await refresh();
      }
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  const record = history.find((s) => s.id === selected);
  const matching =
    !!record && record.provider === runtime.provider && record.model === runtime.model;
  return (
    <div className="agent-page">
      <div className="page-heading">
        <div>
          <h1>A workspace for career drafts.</h1>
          <p>
            Run an isolated OpenCode session with all tools denied. Every response stays a draft.
          </p>
        </div>
        <span className="tag">{runtime.running ? 'Runtime running' : 'Runtime stopped'}</span>
      </div>
      {!isTauri() && (
        <div className="notice">Open the desktop app to manage native runtime sessions.</div>
      )}
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <p className="save-message" role="status">
          {notice}
        </p>
      )}
      <section className="composer">
        <h2>Runtime connection</h2>
        <p className="source-intro">
          Requires the tested OpenCode v2.1.2 CLI on your app’s PATH. Starts a private authenticated
          loopback server; your existing OpenCode credentials and coding workspace are not imported.
          Built-in tools, web access, shell and application actions are denied.
        </p>
        {runtime.running ? (
          <>
            <dl className="runtime-details">
              <dt>Connection</dt>
              <dd>{runtime.provider === 'offline' ? 'Offline queue only' : runtime.provider}</dd>
              <dt>Model</dt>
              <dd>{runtime.model || 'None'}</dd>
              <dt>Local data</dt>
              <dd className="path">{runtime.directory}</dd>
            </dl>
            <button className="secondary" disabled={busy} onClick={() => void action('stop')}>
              Stop runtime
            </button>
          </>
        ) : (
          <>
            <label htmlFor="runtime-provider">Connection to use</label>
            <select
              id="runtime-provider"
              disabled={busy || !isTauri()}
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setModel('');
                setModels([]);
                setFamily('');
              }}
            >
              <option value="offline">Offline queue only · no model calls</option>
              <option value="ollama">Ollama on this device</option>
              {connections
                .filter((c) => c.credentialSaved && !c.storeError)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · saved key
                  </option>
                ))}
            </select>
            {provider !== 'offline' && (
              <div className="runtime-model">
                <button className="secondary" disabled={busy} onClick={() => void action('models')}>
                  Load available models
                </button>
                {!!models.length && (
                  <>
                    <label htmlFor="runtime-model">Model</label>
                    <select
                      id="runtime-model"
                      disabled={busy}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    >
                      {models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                {provider === 'opencode' && (
                  <>
                    <label htmlFor="runtime-family">OpenCode model API family</label>
                    <select
                      id="runtime-family"
                      value={family}
                      disabled={busy}
                      onChange={(e) => setFamily(e.target.value)}
                    >
                      <option value="">Select the model’s documented API family</option>
                      <option value="chat">OpenAI Chat Completions</option>
                      <option value="responses">OpenAI Responses</option>
                      <option value="messages">Anthropic Messages</option>
                      <option value="gemini">Gemini generateContent</option>
                    </select>
                  </>
                )}
                <p className="source-intro">
                  Missing a connection? Add its key in Models first. Starting reads model metadata;
                  generation happens only when you explicitly send a request.
                </p>
              </div>
            )}
            <button
              disabled={
                busy ||
                !isTauri() ||
                (provider !== 'offline' && !model) ||
                (provider === 'opencode' && !family)
              }
              onClick={() => void action('start')}
            >
              {busy ? 'Working…' : 'Start isolated runtime'}
            </button>
          </>
        )}
      </section>
      <section className="identity-section">
        <div className="section-heading">
          <h2>Sessions</h2>
          <span>Latest {history.length}</span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action('create');
          }}
          className="session-create"
        >
          <label htmlFor="session-title">New session title</label>
          <div className="key-entry">
            <input
              id="session-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={busy || !runtime.running}
              placeholder="Prepare for a role"
            />
            <button disabled={busy || !runtime.running || !title.trim()}>Create session</button>
          </div>
        </form>
        {!history.length ? (
          <p className="source-intro">
            No sessions saved yet. Start the runtime and create your first session.
          </p>
        ) : (
          <ul className="task-list">
            {history.map((s) => (
              <li key={s.id}>
                <button
                  className={selected === s.id ? 'task selected' : 'task'}
                  aria-pressed={selected === s.id}
                  disabled={busy}
                  onClick={() => void choose(s)}
                >
                  <span>
                    <strong>{s.title}</strong>
                    <small>
                      {s.provider} {s.model && `· ${s.model}`}
                    </small>
                  </span>
                  <span className="tag">{s.state}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {selected && (
        <section className="identity-section">
          <div className="section-heading">
            <h2>{record?.title ?? 'Session'}</h2>
            <span className="tag">{view?.state ?? 'unknown'}</span>
          </div>
          <p className="source-intro">
            {runtime.running
              ? 'Latest 100 runtime messages, with live text from events. Live output may be partial after a reconnect; completed history is authoritative.'
              : 'Last saved local snapshot. Start the same connection to reconcile with OpenCode.'}
          </p>
          {refreshError && (
            <div className="notice" role="alert">
              {refreshError}
              <button disabled={!runtime.running} onClick={() => void refresh()}>
                Refresh session
              </button>
            </div>
          )}
          <div className="transcript" aria-label="Session transcript">
            {view?.messages.length ? (
              view.messages.map((m, index) => (
                <article className="transcript-message" key={index}>
                  <h3>
                    {m.role === 'assistant_live'
                      ? 'Pursuit draft · streaming'
                      : m.role === 'assistant'
                        ? 'Pursuit draft'
                        : m.role === 'queued'
                          ? 'Queued · not executed'
                          : 'You'}
                  </h3>
                  <p>{m.text}</p>
                </article>
              ))
            ) : (
              <p>No delivered messages yet. Queued messages appear after a session refresh.</p>
            )}
          </div>
          {view?.state === 'failed' && (
            <p className="notice">
              OpenCode marked this session failed. Check provider access and model compatibility.
              Work is not retried automatically by Pursuit.
            </p>
          )}
          <form
            className="session-prompt"
            onSubmit={(e) => {
              e.preventDefault();
              void action('prompt');
            }}
          >
            <label htmlFor="session-prompt">Your request</label>
            <textarea
              id="session-prompt"
              maxLength={8000}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                drafts.current[selectedRef.current] = e.target.value;
              }}
              disabled={busy || !runtime.running || !matching || view?.state === 'running'}
              placeholder="Paste the relevant job text and explain the draft you need. URLs are not fetched in this tool-disabled session."
            />
            <label className="replace-choice">
              <input
                type="checkbox"
                checked={includeIdentity}
                disabled={busy || !runtime.running}
                onChange={(e) => setIncludeIdentity(e.target.checked)}
              />
              Include current confirmed Career Identity answers. Source text, unconfirmed
              suggestions and rejected values are excluded.
            </label>
            <p className="source-intro">
              {runtime.provider === 'offline'
                ? 'Offline mode stores this prompt in the local OpenCode queue without inference. It cannot later run under a different provider binding.'
                : 'Sending shares this request and any selected confirmed facts with the connected model, and may incur charges. Output is capped in the generated provider configuration and restricted to one agent step; this is not an account-level spending limit.'}
            </p>
            <div className="review-actions">
              <button
                disabled={
                  busy || !runtime.running || !matching || !text.trim() || view?.state === 'running'
                }
              >
                {runtime.provider === 'offline' ? 'Queue without running' : 'Send request to model'}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={busy || !runtime.running}
                onClick={() => void action('interrupt')}
              >
                Interrupt execution
              </button>
            </div>
            {!matching && runtime.running && (
              <p className="source-intro">
                This saved session uses another connection. Stop and restart with its provider/model
                to continue.
              </p>
            )}
          </form>
        </section>
      )}
    </div>
  );
}
