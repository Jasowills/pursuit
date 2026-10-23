'use client';

import { useState } from 'react';
import { apiFetch, useResource } from '@/lib/api-client';
import { Card, ErrorBox, Field, Loading, inputClass } from '../_components/ui';

interface Connection {
  id: string;
  provider: string;
  models: string[];
  model: string | null;
  testedAt: string | null;
}
interface Response {
  configured: boolean;
  providers: { id: string; name: string; key_label: string }[];
  connections: Connection[];
}

export function ModelConnections() {
  const resource = useResource<Response>('/connections/models');
  const [provider, setProvider] = useState('openai');
  const [key, setKey] = useState('');
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState('');

  async function action(id: string, run: () => Promise<unknown>, success: string) {
    setBusy(id);
    setError(null);
    setMessage('');
    try {
      await run();
      setMessage(success);
      resource.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="mt-8 p-6">
      <h2 className="panel-heading">Bring your own model.</h2>
      <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-[color:var(--muted-foreground)]">
        Connect your own API account, choose a model from its catalog, then test it. Model use is
        billed by your provider. Keys are encrypted on the server and never returned to the browser.
        Hermes uses your OpenRouter key.
      </p>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorBox error={resource.error} retry={resource.reload} />
      ) : (
        <>
          {!resource.data?.configured && (
            <p role="status" className="notice notice-warning mt-4">
              Connections require the operator to configure credential encryption on the API server.
            </p>
          )}
          <form
            className="mt-5 grid items-end gap-4 md:grid-cols-[1fr_2fr_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              const submitted = key;
              setKey('');
              void action(
                'connect',
                () =>
                  apiFetch('/connections/models', {
                    method: 'POST',
                    json: { provider, api_key: provider === 'ollama' ? '' : submitted },
                  }),
                'Connected. Select and test a model below.',
              );
            }}
          >
            <Field label="Provider">
              <select
                className={inputClass}
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                {resource.data?.providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={
                resource.data?.providers.find((p) => p.id === provider)?.key_label ?? 'API key'
              }
            >
              <input
                type="password"
                required={provider !== 'ollama'}
                disabled={provider === 'ollama'}
                minLength={provider === 'ollama' ? 0 : 10}
                maxLength={4096}
                autoComplete="off"
                spellCheck={false}
                className={inputClass}
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </Field>
            <button
              className="btn btn-primary"
              disabled={busy !== null || !resource.data?.configured}
            >
              {busy === 'connect' ? 'Connecting…' : 'Connect provider'}
            </button>
          </form>
          <div className="mt-6 divide-y divide-[var(--border)]">
            {resource.data?.connections.map((c) => (
              <div key={c.id} className="flex flex-wrap items-end gap-4 py-5">
                <div className="min-w-0 flex-1">
                  <p className="mb-2 font-medium">
                    {resource.data?.providers.find((p) => p.id === c.provider)?.name}
                  </p>
                  <Field label="Available model">
                    <select
                      className={inputClass}
                      value={selection[c.id] ?? c.model ?? c.models[0] ?? ''}
                      onChange={(e) => setSelection({ ...selection, [c.id]: e.target.value })}
                    >
                      {c.models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <p className="mt-2 text-xs">
                    {c.testedAt
                      ? `Tested: ${c.model}`
                      : 'Catalog loaded. Inference has not been verified.'}
                  </p>
                </div>
                <button
                  className="btn btn-outline"
                  disabled={busy !== null}
                  onClick={() =>
                    void action(
                      c.id,
                      () =>
                        apiFetch(`/connections/models/${c.id}/test`, {
                          method: 'POST',
                          json: { model: selection[c.id] ?? c.model ?? c.models[0] },
                        }),
                      'Model verified and selected.',
                    )
                  }
                >
                  {busy === c.id ? 'Testing…' : 'Test & select'}
                </button>
                <button
                  className="btn btn-outline"
                  disabled={busy !== null}
                  onClick={() =>
                    void action(
                      `revoke-${c.id}`,
                      () => apiFetch(`/connections/models/${c.id}`, { method: 'DELETE' }),
                      'Connection removed. Revoke the API key with your provider if needed.',
                    )
                  }
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      {error != null && <ErrorBox error={error} />}
      {message && (
        <p role="status" className="mt-4 text-sm">
          {message}
        </p>
      )}
    </Card>
  );
}
