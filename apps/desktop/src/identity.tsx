import React, { useEffect, useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';

type Source = { id: string; name: string; text: string; contentHash: string };
type Fact = {
  id: string;
  sourceId: string;
  field: string;
  value: string;
  excerpt: string;
  lineNumber: number;
  status: string;
  confirmedValue: string | null;
};
type Identity = { sources: Source[]; facts: Fact[] };
const labels: Record<string, string> = {
  full_name: 'Full name',
  location: 'Location',
  work_authorization: 'Work authorization',
  sponsorship: 'Sponsorship',
  relocation: 'Relocation',
  target_role: 'Target role',
  salary_expectation: 'Salary expectation',
  education: 'Education',
};
function Review({
  fact,
  source,
  current,
  locked,
  onDecision,
}: {
  fact: Fact;
  source: Source | undefined;
  current: Fact | undefined;
  locked: boolean;
  onDecision: (
    fact: Fact,
    decision: string,
    value: string,
    current: Fact | undefined,
  ) => Promise<void>;
}) {
  const [value, setValue] = useState(fact.value);
  const [replace, setReplace] = useState(false);
  useEffect(() => {
    setReplace(false);
  }, [current?.id]);
  return (
    <article className="fact-review">
      <div className="section-heading">
        <h3>{labels[fact.field] ?? fact.field}</h3>
        <span className="tag">Needs confirmation</span>
      </div>
      <blockquote>{fact.excerpt}</blockquote>
      <p className="evidence">
        {source?.name} · line {fact.lineNumber} · SHA-256 {source?.contentHash.slice(0, 12)}
      </p>
      <label htmlFor={fact.id}>Your confirmed answer</label>
      <textarea
        id={fact.id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={locked}
        maxLength={2000}
      />
      {current && (
        <label className="replace-choice">
          <input
            type="checkbox"
            checked={replace}
            disabled={locked}
            onChange={(e) => setReplace(e.target.checked)}
          />
          Replace the current confirmed value: “{current.confirmedValue}”. The old value stays in
          review history.
        </label>
      )}
      <div className="review-actions">
        <button
          disabled={locked || !value.trim() || (!!current && !replace)}
          onClick={() => void onDecision(fact, 'confirm', value, current)}
        >
          Confirm{current ? ' replacement' : ' fact'}
        </button>
        <button
          className="secondary"
          disabled={locked}
          onClick={() => void onDecision(fact, 'reject', '', undefined)}
        >
          Reject suggestion
        </button>
      </div>
    </article>
  );
}
export function CareerIdentity() {
  const [deleting, setDeleting] = useState<string>();
  const [data, setData] = useState<Identity>();
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function load() {
    if (!isTauri()) return;
    try {
      setData(await invoke<Identity>('identity'));
      setError('');
    } catch (e) {
      setError(String(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function importSource(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await invoke<Identity>('import_identity', { name, text });
      setData(result);
      setText('');
      setName('');
      setMessage(
        'Source saved locally. Review any suggested facts below; nothing was confirmed automatically.',
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function decide(fact: Fact, decision: string, value: string, current: Fact | undefined) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      setData(
        await invoke<Identity>('decide_fact', {
          id: fact.id,
          decision,
          value,
          expectedConfirmedId: current?.id ?? null,
        }),
      );
      setMessage(
        decision === 'confirm' ? 'Fact confirmed and saved.' : 'Suggestion rejected and recorded.',
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function removeSource(source: Source) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      setData(
        await invoke<Identity>('delete_identity_source', {
          id: source.id,
          expectedHash: source.contentHash,
        }),
      );
      setDeleting(undefined);
      setMessage(
        'Source text and its facts and review history were removed from the workspace. Existing backups are not erased.',
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  const confirmed = data?.facts.filter((f) => f.status === 'confirmed') ?? [];
  const pending = data?.facts.filter((f) => f.status === 'suggested') ?? [];
  const history =
    data?.facts.filter((f) => f.status === 'rejected' || f.status === 'superseded') ?? [];
  return (
    <div className="identity-page">
      <div className="page-heading">
        <div>
          <h1>Your career, on the record.</h1>
          <p>Keep source material separate from the facts you have confirmed.</p>
        </div>
      </div>
      {!isTauri() && (
        <div className="notice">
          Open the desktop app to import and review your local Career Identity.
        </div>
      )}
      {error && (
        <div className="notice" role="alert">
          {error}
          <button disabled={busy} onClick={() => void load()}>
            Reload saved identity
          </button>
        </div>
      )}
      {message && (
        <p className="save-message" role="status">
          {message}
        </p>
      )}
      <section className="composer">
        <h2>Add a source</h2>
        <p className="source-intro">
          Paste profile notes or resume text. This first importer recognizes one labeled field per
          line. It does not infer missing facts or follow instructions in source text.
        </p>
        <details className="import-help">
          <summary>Supported fields and format</summary>
          <p>Use any of these labels, followed by a colon and your value:</p>
          <pre>
            Full name: Your name{'\n'}Location: Your current location{'\n'}Work authorization: Your
            status and jurisdiction{'\n'}Sponsorship: Required, not required, or unknown{'\n'}
            Relocation: Your preference{'\n'}Target role: Your preferred role{'\n'}Salary
            expectation: Your expectation and currency{'\n'}Education: Your qualification
          </pre>
          <p>
            Residence, work authorization, and sponsorship are independent answers. Leave an answer
            out when unknown. PDF and DOCX imports are not available yet.
          </p>
        </details>
        <form onSubmit={importSource}>
          <fieldset disabled={busy || !data}>
            <label htmlFor="source-name">Source name</label>
            <input
              id="source-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              placeholder="Career notes · October 2026"
            />
            <label htmlFor="source-text">Source text</label>
            <textarea
              id="source-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={200000}
              placeholder="Paste your labeled profile notes or resume text here."
            />
            <div className="composer-footer">
              <span>Stored on this device. No model receives this text.</span>
              <button disabled={!name.trim() || !text.trim()}>
                {busy ? 'Saving…' : 'Save source and review'}
              </button>
            </div>
          </fieldset>
        </form>
      </section>
      <section className="identity-section">
        <div className="section-heading">
          <h2>Confirmed facts</h2>
          <span>{confirmed.length} confirmed</span>
        </div>
        {confirmed.length ? (
          <dl className="confirmed-facts">
            {confirmed.map((f) => (
              <div key={f.id}>
                <dt>{labels[f.field]}</dt>
                <dd>
                  {f.confirmedValue}
                  <small>
                    {data?.sources.find((s) => s.id === f.sourceId)?.name} · line {f.lineNumber}
                  </small>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>No facts confirmed yet. Unreviewed suggestions cannot be used as confirmed answers.</p>
        )}
      </section>
      <section className="identity-section">
        <div className="section-heading">
          <h2>Review suggestions</h2>
          <span>{pending.length} pending</span>
        </div>
        {pending.length ? (
          pending.map((f) => (
            <Review
              key={f.id}
              fact={f}
              source={data?.sources.find((s) => s.id === f.sourceId)}
              current={confirmed.find((c) => c.field === f.field)}
              locked={busy}
              onDecision={decide}
            />
          ))
        ) : (
          <p>
            No pending suggestions. Sources without supported labels are saved as evidence without
            extracting facts.
          </p>
        )}
      </section>
      <section className="identity-section">
        <h2>Saved sources</h2>
        {data?.sources.length ? (
          data.sources.map((s) => (
            <details key={s.id} className="source-record">
              <summary>{s.name}</summary>
              <p className="path evidence">SHA-256 {s.contentHash}</p>
              <pre>{s.text}</pre>
              {deleting === s.id ? (
                <div className="delete-source">
                  <p>
                    Delete “{s.name}”, its suggested and confirmed facts, and its review history?
                    This cannot be undone. Local backups may still contain copies.
                  </p>
                  <div className="review-actions">
                    <button disabled={busy} onClick={() => void removeSource(s)}>
                      Delete source and facts
                    </button>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => setDeleting(undefined)}
                    >
                      Keep source
                    </button>
                  </div>
                </div>
              ) : (
                <button className="secondary" disabled={busy} onClick={() => setDeleting(s.id)}>
                  Delete this source
                </button>
              )}
            </details>
          ))
        ) : (
          <p className="source-intro">No source material saved yet.</p>
        )}
      </section>
      {!!history.length && (
        <section className="identity-section">
          <h2>Review history</h2>
          {history.map((f) => (
            <p key={f.id} className="history-record">
              <strong>{labels[f.field]}</strong>: {f.confirmedValue ?? f.value} · {f.status}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
