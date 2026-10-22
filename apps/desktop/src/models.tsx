import { useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { Providers, OpenCodeRuntime } from './providers';
type Model = { name: string };
export function Models() {
  const [models, setModels] = useState<Model[]>([]);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [checked, setChecked] = useState(false);
  async function discover() {
    setBusy(true);
    setError('');
    setReply('');
    setChecked(false);
    setSelected('');
    setModels([]);
    try {
      const found = await invoke<Model[]>('ollama_models');
      setModels(found);
      setSelected(found[0]?.name ?? '');
      setChecked(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function test() {
    setBusy(true);
    setError('');
    setReply('');
    try {
      setReply(await invoke<string>('test_ollama', { model: selected }));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="models-page">
      <div className="page-heading">
        <div>
          <h1>Connect your own model.</h1>
          <p>Start with a model running through Ollama on this device.</p>
        </div>
      </div>
      {!isTauri() && (
        <div className="notice">Open the desktop app to check your local Ollama connection.</div>
      )}
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      <section className="composer">
        <h2>Ollama</h2>
        <p className="source-intro">
          Pursuit checks <code>127.0.0.1:11434</code> for your installed models. Start Ollama and
          install a text model first. This check does not download models or send career
          information.
        </p>
        <button disabled={busy || !isTauri()} onClick={() => void discover()}>
          {busy ? 'Checking…' : 'Find local models'}
        </button>
        {checked && !models.length && (
          <p className="source-intro" role="status">
            Ollama is reachable, but no models are installed.
          </p>
        )}
        {!!models.length && (
          <div className="model-test">
            <label htmlFor="ollama-model">Installed model</label>
            <select
              id="ollama-model"
              disabled={busy}
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setReply('');
                setError('');
              }}
            >
              {models.map((m, index) => (
                <option key={`${m.name}-${index}`} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
            <p>
              This test asks the selected model to reply with “ready”. It may load the model and use
              local compute. A successful reply verifies basic text generation, not agent tools or
              application readiness.
            </p>
            <button disabled={busy || !selected} onClick={() => void test()}>
              {busy ? 'Testing…' : 'Test text generation'}
            </button>
          </div>
        )}
        {reply && (
          <div className="model-reply" role="status">
            <h3>Text generation completed</h3>
            <blockquote>{reply}</blockquote>
            <p>
              No career data was included. This test does not select a model for application
              preparation.
            </p>
          </div>
        )}
      </section>
      <OpenCodeRuntime />
      <Providers />
    </div>
  );
}
