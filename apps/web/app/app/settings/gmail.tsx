'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch, useResource } from '@/lib/api-client';
import { ErrorBox } from '../_components/ui';

export function GmailConnections() {
  const resource = useResource<{
    configured: boolean;
    status: string;
    paths: { composio: boolean; direct: boolean };
  }>('/connections/gmail');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const handled = useRef(false);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const code = query.get('code');
    const state = query.get('state');
    const sessionUri = query.get('session_uri');
    if (!handled.current && sessionUri) {
      handled.current = true;
      window.history.replaceState({}, '', window.location.pathname);
      setBusy(true);
      void apiFetch('/connections/gmail/composio-callback', {
        method: 'POST',
        json: { session_uri: sessionUri },
      })
        .then(() => resource.reload())
        .catch(setError)
        .finally(() => setBusy(false));
      return;
    }
    if (!handled.current && query.get('error')) {
      handled.current = true;
      window.history.replaceState({}, '', window.location.pathname);
      setError(new Error('Gmail authorization was not completed. You can try connecting again.'));
      return;
    }
    if (handled.current || !code || !state) return;
    handled.current = true;
    // Remove authorization codes before subsequent navigation or third-party requests.
    window.history.replaceState({}, '', window.location.pathname);
    setBusy(true);
    void apiFetch('/connections/gmail/callback', { method: 'POST', json: { code, state } })
      .then(() => resource.reload())
      .catch(setError)
      .finally(() => setBusy(false));
  }, [resource.reload]);

  async function connect(path: 'composio' | 'direct') {
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<{ redirect_url: string }>('/connections/gmail', {
        method: 'POST',
        json: { path },
      });
      window.location.assign(result.redirect_url);
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }
  const connected =
    resource.data && !['NOT_CONFIGURED', 'DISCONNECTED'].includes(resource.data.status);
  return (
    <section>
      <h2 className="panel-heading">Connect Gmail, your way.</h2>
      <p className="mt-3 max-w-[65ch] text-sm leading-relaxed">
        Choose Composio-managed authorization or direct Google OAuth. Both use the same
        exact-message approval flow. Connecting never sends mail. This release sends plain-text
        outreach; inbox and reply synchronization are still planned.
      </p>
      <p role="status" className="mt-3 text-sm">
        {busy ? 'Working…' : (resource.data?.status.replaceAll('_', ' ') ?? 'Checking connection…')}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="btn btn-outline"
          disabled={busy || Boolean(connected) || !resource.data?.paths.composio}
          onClick={() => void connect('composio')}
        >
          Connect through Composio
        </button>
        <button
          className="btn btn-outline"
          disabled={busy || Boolean(connected) || !resource.data?.paths.direct}
          onClick={() => void connect('direct')}
        >
          Connect directly with Google
        </button>
        <button className="btn btn-outline" disabled={busy} onClick={resource.reload}>
          Refresh status
        </button>
        {connected && (
          <button
            className="btn btn-outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await apiFetch('/connections/gmail', { method: 'DELETE' });
                resource.reload();
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            Revoke Gmail access
          </button>
        )}
      </div>
      {!resource.data?.paths.composio && (
        <p className="mt-3 text-xs">
          Composio requires an operator project key and Gmail auth configuration.
        </p>
      )}
      {!resource.data?.paths.direct && (
        <p className="mt-2 text-xs">
          Direct Google authorization requires an operator OAuth client and redirect URI.
        </p>
      )}
      {(error != null || resource.error) && (
        <ErrorBox error={error ?? resource.error} retry={resource.reload} />
      )}
    </section>
  );
}
