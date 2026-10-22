import { useEffect, useRef, useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
type Connection = { id: string; name: string; credentialSaved: boolean; storeError: string | null };
type Catalog = { models: string[]; truncated: boolean };
function Provider({
  connection,
  onChanged,
}: {
  connection: Connection;
  onChanged: () => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [catalog, setCatalog] = useState<Catalog>();
  const [model, setModel] = useState('');
  const [family, setFamily] = useState('');
  const [reply, setReply] = useState('');
  const [removing, setRemoving] = useState(false);
  async function action(kind: 'save' | 'remove' | 'catalog' | 'test') {
    setBusy(true);
    setError('');
    setNotice('');
    setReply('');
    try {
      if (kind === 'save') {
        const key = input.current?.value ?? '';
        if (input.current) input.current.value = '';
        await invoke('save_provider_key', { providerId: connection.id, key });
        setCatalog(undefined);
        setModel('');
        setFamily('');
        setNotice(
          'Key saved in the operating-system credential store. Connection has not been verified.',
        );
        await onChanged();
      }
      if (kind === 'remove') {
        await invoke('remove_provider_key', { providerId: connection.id });
        setRemoving(false);
        setCatalog(undefined);
        setModel('');
        setNotice(
          'Key removed from Pursuit’s credential-store entry. This does not revoke the key at the provider.',
        );
        await onChanged();
      }
      if (kind === 'catalog') {
        setCatalog(undefined);
        setModel('');
        const result = await invoke<Catalog>('provider_models', { providerId: connection.id });
        setCatalog(result);
        setModel(result.models[0] ?? '');
        setNotice('Catalog retrieved. Model generation has not been verified.');
      }
      if (kind === 'test') {
        setReply(
          await invoke<string>('test_provider', { providerId: connection.id, model, family }),
        );
        setNotice('Text returned. Agent tools and application readiness are not verified.');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="provider-connection">
      <div className="section-heading">
        <h2>{connection.name}</h2>
        <span className="tag">
          {connection.storeError
            ? 'Store unavailable'
            : connection.credentialSaved
              ? 'Key saved'
              : 'No key saved'}
        </span>
      </div>
      {connection.storeError && (
        <p className="notice" role="alert">
          {connection.storeError}
          <button disabled={busy} onClick={() => void onChanged()}>
            Recheck credential store
          </button>
        </p>
      )}
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void action('save');
        }}
      >
        <label htmlFor={`key-${connection.id}`}>
          {connection.credentialSaved ? 'Replace API key' : 'API key'}
        </label>
        <div className="key-entry">
          <input
            ref={input}
            id={`key-${connection.id}`}
            type="password"
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
            disabled={busy}
            maxLength={8192}
            required
            placeholder="Stored in your operating-system credential store"
          />
          <button disabled={busy}>{busy ? 'Working…' : 'Save key'}</button>
        </div>
      </form>
      {connection.id === 'opencode' && (
        <p className="source-intro">
          Use an OpenCode Console inference key. Go subscription compatibility with career workflows
          has not been established; this connector does not use Go endpoints. Hosted inference is
          separate from the OpenCode runtime.
        </p>
      )}
      {connection.id === 'openrouter' && (
        <p className="source-intro">
          Use an OpenRouter key for its model catalog, including available Nous Research / Hermes
          models. Availability depends on your account.
        </p>
      )}
      {connection.credentialSaved && (
        <div className="review-actions">
          <button className="secondary" disabled={busy} onClick={() => void action('catalog')}>
            Load model catalog
          </button>
          <button className="secondary" disabled={busy} onClick={() => setRemoving(true)}>
            Remove saved key
          </button>
        </div>
      )}
      {removing && (
        <div className="remove-key">
          <p>Remove the saved {connection.name} key from this app? You can reconnect later.</p>
          <div className="review-actions">
            <button disabled={busy} onClick={() => void action('remove')}>
              Remove key from app
            </button>
            <button className="secondary" disabled={busy} onClick={() => setRemoving(false)}>
              Keep key
            </button>
          </div>
        </div>
      )}
      {catalog && (
        <div className="model-test">
          {!catalog.models.length ? (
            <p>No models were returned.</p>
          ) : (
            <>
              <label htmlFor={`model-${connection.id}`}>Model from current catalog</label>
              <select
                id={`model-${connection.id}`}
                disabled={busy}
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setReply('');
                  setNotice('');
                }}
              >
                {catalog.models.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
              {connection.id === 'opencode' && (
                <>
                  <label htmlFor="opencode-family">Model API family</label>
                  <select
                    id="opencode-family"
                    value={family}
                    disabled={busy}
                    onChange={(e) => {
                      setFamily(e.target.value);
                      setReply('');
                      setNotice('');
                    }}
                  >
                    <option value="">Choose the family listed in OpenCode Console</option>
                    <option value="chat">OpenAI Chat Completions</option>
                    <option value="responses">OpenAI Responses</option>
                    <option value="messages">Anthropic Messages</option>
                    <option value="gemini">Gemini generateContent</option>
                  </select>
                </>
              )}
              <p>
                Testing sends only “Reply with the word ready.” to this provider and may incur usage
                charges. It does not send career information or authorize agent actions.
              </p>
              <button
                disabled={busy || !model || (connection.id === 'opencode' && !family)}
                onClick={() => void action('test')}
              >
                Run provider generation test
              </button>
            </>
          )}
          {catalog.truncated && (
            <p className="source-intro">
              The provider indicates more pages are available. This view currently shows the first
              page.
            </p>
          )}
        </div>
      )}
      {notice && (
        <p className="save-message" role="status">
          {notice}
        </p>
      )}
      {reply && <blockquote className="provider-reply">{reply}</blockquote>}
    </section>
  );
}
export function Providers() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [error, setError] = useState('');
  async function load() {
    if (!isTauri()) return;
    try {
      setConnections(await invoke<Connection[]>('provider_connections'));
      setError('');
    } catch (e) {
      setError(String(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <section className="identity-section">
      <h2>Provider connections</h2>
      <p className="source-intro">
        Bring your own provider account. Keys are saved in macOS Keychain, Windows Credential
        Manager, or Linux Secret Service. A locked or missing store blocks saving; there is no
        plaintext fallback. Existing keys are never returned to this screen. New keys pass through
        the input and native IPC once; the input is then cleared.
      </p>
      {error && (
        <div className="notice" role="alert">
          {error}
          <button onClick={() => void load()}>Reload connections</button>
        </div>
      )}
      {!isTauri() ? (
        <p>Open the desktop app to manage credentials.</p>
      ) : (
        connections.map((c) => <Provider key={c.id} connection={c} onChanged={load} />)
      )}
    </section>
  );
}

export function OpenCodeRuntime() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ version: string; isolatedDirectory: string }>();
  async function probe() {
    setBusy(true);
    setError('');
    setResult(undefined);
    try {
      setResult(await invoke('probe_opencode'));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="identity-section">
      <h2>OpenCode runtime</h2>
      <p className="source-intro">
        Check an existing OpenCode installation without importing its credentials, plugins, hooks or
        coding workspace. This runs only a version probe with a clean environment and a
        Pursuit-owned data directory.
      </p>
      <button disabled={busy || !isTauri()} onClick={() => void probe()}>
        {busy ? 'Checking runtime…' : 'Check installed OpenCode'}
      </button>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="source-intro" role="status">
          <p>Detected version: {result.version}</p>
          <p className="path">Probe directory: {result.isolatedDirectory}</p>
          <p>
            This confirms CLI detection only. Managed sessions, streaming, interruption, selective
            provider import, and runtime packaging are still in development.
          </p>
        </div>
      )}
    </section>
  );
}
