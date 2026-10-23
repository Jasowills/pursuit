'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiFetch, useResource } from '@/lib/api-client';
import { Card, ErrorBox, Field, Loading, PageHeader, inputClass } from '../_components/ui';
import { GmailConnections } from '../settings/gmail';

interface Content {
  resume: string;
  cover_letter: string;
  match_explanation: string;
  gaps: string[];
  recipient: string;
  outreach: { subject: string; body: string };
}
interface Draft {
  id: string;
  jobId: string;
  model: string;
  content: Content;
  status: string;
  receipt: string | null;
  createdAt: string;
}
interface Job {
  job: { id: string; title: string; company_name: string };
  match: { eligibility: string } | null;
}
interface Models {
  connections: { id: string; provider: string; model: string | null; testedAt: string | null }[];
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function WorkflowPage() {
  const jobs = useResource<{ items: Job[] }>('/jobs');
  const models = useResource<Models>('/connections/models');
  const drafts = useResource<{ items: Draft[] }>('/workflow');
  const [board, setBoard] = useState('');
  const [job, setJob] = useState('');
  const [connection, setConnection] = useState('');
  const [resume, setResume] = useState('');
  const [active, setActive] = useState<Draft | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState('');
  const available = models.data?.connections.filter((c) => c.model && c.testedAt) ?? [];
  const locked = Boolean(
    active && ['SENT', 'SENDING', 'NEEDS_VERIFICATION'].includes(active.status),
  );

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice('');
    try {
      await action();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function open(id: string) {
    const data = await apiFetch<{ draft: Draft; payload_hash: string | null }>(`/workflow/${id}`);
    setActive(data.draft);
    setContent(data.draft.content);
    setHash(data.payload_hash);
    setDirty(false);
  }
  function edit(next: Content) {
    setContent(next);
    setDirty(true);
    setHash(null);
  }

  return (
    <>
      <PageHeader
        title="Your next move, from source to send."
        subtitle="Discover a role, prepare materials with your model, review outreach, and keep the record. Every generated claim needs your review."
      />
      <nav
        aria-label="Workflow steps"
        className="mb-8 flex flex-wrap gap-5 border-b border-[var(--border)] pb-4 text-sm"
      >
        {['Discover', 'Prepare', 'Connect', 'Manage'].map((s, i) => (
          <a className="link-underline" key={s} href={`#${s.toLowerCase()}`}>
            {i + 1}. {s}
          </a>
        ))}
      </nav>
      {error != null && <ErrorBox error={error} />}
      {notice && (
        <p role="status" className="notice mt-4">
          {notice}
        </p>
      )}
      <div className="grid items-start gap-8 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-8">
          <Card className="p-6">
            <section id="discover">
              <h2 className="panel-heading">Discover</h2>
              <p className="mt-3 text-sm leading-relaxed">
                Import roles from a public Greenhouse board. Eligibility uses your career profile;
                uncertain details stay unknown.
              </p>
              <form
                className="mt-4 flex flex-wrap items-end gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    const result = await apiFetch<{ imported: number }>('/workflow/discover', {
                      method: 'POST',
                      json: { board },
                    });
                    jobs.reload();
                    setNotice(`${result.imported} roles processed. Choose a role below.`);
                  });
                }}
              >
                <Field
                  label="Greenhouse board identifier"
                  hint="The company identifier in its public board URL."
                >
                  <input
                    required
                    pattern="[a-zA-Z0-9_-]+"
                    maxLength={100}
                    className={inputClass}
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                  />
                </Field>
                <button disabled={busy} className="btn btn-outline">
                  Import roles
                </button>
              </form>
              <Link href="/app/jobs" className="link-underline mt-4 inline-block text-sm">
                Or add a job manually
              </Link>
            </section>
          </Card>
          <Card className="p-6">
            <section id="prepare">
              <h2 className="panel-heading">Prepare</h2>
              <p className="mt-3 text-sm">
                Your selected provider receives the resume, career profile, and job description.
                Materials are saved as drafts for review.
              </p>
              {jobs.error ? (
                <ErrorBox error={jobs.error} retry={jobs.reload} />
              ) : models.error ? (
                <ErrorBox error={models.error} retry={models.reload} />
              ) : jobs.loading || models.loading ? (
                <Loading />
              ) : (
                <form
                  className="mt-5 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(async () => {
                      const draft = await apiFetch<Draft>('/workflow', {
                        method: 'POST',
                        json: { job_id: job, connection_id: connection, resume },
                      });
                      await open(draft.id);
                      drafts.reload();
                      setNotice('Materials prepared. Review the facts and edit before approval.');
                    });
                  }}
                >
                  <Field label="Opportunity">
                    <select
                      required
                      className={inputClass}
                      value={job}
                      onChange={(e) => setJob(e.target.value)}
                    >
                      <option value="">Choose a role</option>
                      {jobs.data?.items.map(({ job: j, match }) => (
                        <option value={j.id} key={j.id}>
                          {j.title} · {j.company_name} · {match?.eligibility ?? 'UNKNOWN'}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Your verified model">
                    <select
                      required
                      className={inputClass}
                      value={connection}
                      onChange={(e) => setConnection(e.target.value)}
                    >
                      <option value="">Choose a connection</option>
                      {available.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.provider} / {c.model}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {!available.length && (
                    <p className="text-sm">
                      <Link className="link-underline" href="/app/settings">
                        Connect and test your model in Settings
                      </Link>{' '}
                      before preparing materials.
                    </p>
                  )}
                  <Field
                    label="Master resume"
                    hint="Paste factual resume text, or load a .txt/.md file. PDF and Word parsing are not available yet."
                  >
                    <textarea
                      required
                      minLength={50}
                      maxLength={30000}
                      rows={9}
                      className={inputClass}
                      value={resume}
                      onChange={(e) => setResume(e.target.value)}
                    />
                  </Field>
                  <Field label="Load resume text">
                    <input
                      type="file"
                      accept=".txt,.md,text/plain,text/markdown"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 120000) {
                          setError(new Error('Resume file is too large. Maximum 120 KB.'));
                          return;
                        }
                        void file.text().then((text) => {
                          if (text.length > 30000)
                            setError(new Error('Resume must be at most 30,000 characters.'));
                          else setResume(text);
                        });
                      }}
                    />
                  </Field>
                  <button disabled={busy || !available.length} className="btn btn-primary">
                    {busy ? 'Working…' : 'Prepare materials'}
                  </button>
                </form>
              )}
            </section>
          </Card>
          <Card className="p-6">
            <div id="connect">
              <GmailConnections />
            </div>
          </Card>
        </div>
        <div className="space-y-8">
          <Card className="p-6">
            <section id="manage">
              <h2 className="panel-heading">Your prepared records</h2>
              {drafts.error ? (
                <ErrorBox error={drafts.error} retry={drafts.reload} />
              ) : drafts.loading ? (
                <Loading />
              ) : (
                <ul className="mt-4 divide-y divide-[var(--border)]">
                  {!drafts.data?.items.length && (
                    <li className="py-4 text-sm">
                      No prepared records yet. Choose a role and prepare your first draft.
                    </li>
                  )}
                  {drafts.data?.items.map((d) => (
                    <li key={d.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
                      <button
                        disabled={busy}
                        className="link-underline text-left"
                        onClick={() => void run(() => open(d.id))}
                      >
                        {d.content.outreach.subject}
                      </button>
                      <span>{d.status.replaceAll('_', ' ')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </Card>
          {active && content && (
            <Card className="p-6">
              <h2 className="panel-heading">Review the exact materials</h2>
              <p className="mt-3 break-words text-xs">
                {active.model} · {active.status.replaceAll('_', ' ')}
              </p>
              <p className="notice notice-warning mt-4 text-sm">
                AI-generated draft. Check every claim against your source resume. Contact discovery
                and email verification are not yet available; enter a recipient you have verified.
              </p>
              <p className="mt-4 whitespace-pre-wrap text-sm">{content.match_explanation}</p>
              {content.gaps.length > 0 && (
                <ul className="my-4 list-disc space-y-2 pl-5 text-sm">
                  {content.gaps.map((gap, i) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              )}
              <div className="mt-5 space-y-4">
                <Field label="Tailored resume">
                  <textarea
                    disabled={locked}
                    className={inputClass}
                    rows={12}
                    value={content.resume}
                    onChange={(e) => edit({ ...content, resume: e.target.value })}
                  />
                </Field>
                <Field label="Cover letter">
                  <textarea
                    disabled={locked}
                    className={inputClass}
                    rows={6}
                    value={content.cover_letter}
                    onChange={(e) => edit({ ...content, cover_letter: e.target.value })}
                  />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="btn btn-outline"
                    onClick={() => download('pursuit-resume.txt', content.resume)}
                  >
                    Download resume text
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => download('pursuit-cover-letter.txt', content.cover_letter)}
                  >
                    Download cover letter
                  </button>
                </div>
                <Field label="Verified recipient email">
                  <input
                    type="email"
                    disabled={locked}
                    className={inputClass}
                    value={content.recipient}
                    onChange={(e) => edit({ ...content, recipient: e.target.value })}
                  />
                </Field>
                <Field label="Email subject">
                  <input
                    disabled={locked}
                    className={inputClass}
                    value={content.outreach.subject}
                    onChange={(e) =>
                      edit({
                        ...content,
                        outreach: { ...content.outreach, subject: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Email body">
                  <textarea
                    disabled={locked}
                    className={inputClass}
                    rows={8}
                    value={content.outreach.body}
                    onChange={(e) =>
                      edit({ ...content, outreach: { ...content.outreach, body: e.target.value } })
                    }
                  />
                </Field>
                <p className="text-xs">
                  Plain-text email. Resume and cover letter downloads are not attached to this
                  message. Any edit invalidates approval. Approval expires after 30 minutes.
                </p>
                {hash && <p className="break-all font-mono text-xs">Payload: {hash}</p>}
                <div className="flex flex-wrap gap-3">
                  <button
                    disabled={busy || locked || !dirty}
                    className="btn btn-outline"
                    onClick={() =>
                      void run(async () => {
                        await apiFetch(`/workflow/${active.id}`, {
                          method: 'PATCH',
                          json: content,
                        });
                        await open(active.id);
                        drafts.reload();
                      })
                    }
                  >
                    Save changes
                  </button>
                  <button
                    disabled={
                      busy ||
                      locked ||
                      dirty ||
                      !hash ||
                      !content.recipient ||
                      active.status !== 'DRAFT'
                    }
                    className="btn btn-outline"
                    onClick={() =>
                      void run(async () => {
                        await apiFetch(`/workflow/${active.id}/approve`, {
                          method: 'POST',
                          json: { payload_hash: hash },
                        });
                        await open(active.id);
                        drafts.reload();
                      })
                    }
                  >
                    Approve exact message
                  </button>
                  <button
                    disabled={busy || locked || dirty || active.status !== 'APPROVED'}
                    className="btn btn-primary"
                    onClick={() =>
                      void run(async () => {
                        try {
                          await apiFetch(`/workflow/${active.id}/send`, { method: 'POST' });
                        } finally {
                          await open(active.id);
                          drafts.reload();
                        }
                      })
                    }
                  >
                    Send approved email
                  </button>
                </div>
                {active.status === 'NEEDS_VERIFICATION' && (
                  <p role="alert" className="notice notice-warning">
                    Delivery is uncertain. Check Gmail Sent and Composio logs. Sending again is
                    blocked to avoid duplicates.
                  </p>
                )}
                {active.receipt && (
                  <p role="status" className="break-all text-sm">
                    Gmail confirmed message ID: {active.receipt}
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
