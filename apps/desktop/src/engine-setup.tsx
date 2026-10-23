import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
type Settings = { nodeExecutable: string; browserExecutable: string; executionEnabled: boolean };
export function EngineSetup() {
  const [value, setValue] = useState<Settings>({
      nodeExecutable: '',
      browserExecutable: '',
      executionEnabled: false,
    }),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    invoke<Settings>('career_engine_settings')
      .then(setValue)
      .catch((e) => setMessage(String(e)));
  }, []);
  return (
    <form
      className="desktop-engine-setup"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage('');
        try {
          setValue(await invoke<Settings>('save_career_engine_settings', { settings: value }));
          setMessage('Setup saved. Return to Opportunities and start a search.');
        } catch (e) {
          setMessage(String(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Local sourcing and applications</h2>
      <p>
        The engine runs on your computer using Node 22.13 or later. Sourcing does not need a model
        or a Pursuit account. Only choose executables you trust.
      </p>
      <label>
        Node executable path
        <input
          value={value.nodeExecutable}
          onChange={(e) => setValue({ ...value, nodeExecutable: e.target.value })}
          required
          disabled={busy}
          placeholder="/opt/homebrew/bin/node"
        />
      </label>
      <label>
        Chromium / Chrome executable path
        <input
          value={value.browserExecutable}
          onChange={(e) => setValue({ ...value, browserExecutable: e.target.value })}
          disabled={busy}
        />
      </label>
      <p>
        A browser is needed to inspect and submit Ashby forms. No browser profile, existing login or
        mailbox is shared.
      </p>
      <label>
        <input
          type="checkbox"
          checked={value.executionEnabled}
          onChange={(e) => setValue({ ...value, executionEnabled: e.target.checked })}
          disabled={busy}
        />
        Enable Ashby execution on this device
      </label>
      <p>
        Every application still requires its own document, eligibility and answer review. Execution
        is off by default. The adapter is fixture-tested; live employer forms are not yet qualified.
        Unsupported forms stop for your attention.
      </p>
      <button disabled={busy} type="submit">
        Save engine setup
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
