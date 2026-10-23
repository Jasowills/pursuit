import React, { useEffect, useState } from 'react';
import type { EngineClient, ExecutionPlan, Form } from '@pursuit/career-engine/contracts';
import type { Packet } from '@pursuit/tailoring';
import type { Opportunity } from './career-data';
import type { TailoringState } from './TailoringStudio';
import { StatusBadge } from './status';
export function ApplicationReview({
  job,
  tailoring,
  call,
  onSetup,
  onPrepare,
  onConfirmed,
}: {
  job: Opportunity;
  tailoring?: TailoringState;
  call: EngineClient;
  onSetup: () => void;
  onPrepare: () => void;
  onConfirmed: (receipt: string) => Promise<boolean>;
}) {
  const [form, setForm] = useState<Form>(),
    [formDigest, setFormDigest] = useState(''),
    [packetHash, setPacketHash] = useState('');
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({}),
    [plan, setPlan] = useState<ExecutionPlan>(),
    [reviewPacket, setReviewPacket] = useState<Packet>();
  const [policy, setPolicy] = useState({ enabled: false, dailyLimit: 100 }),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const [eligibility, setEligibility] = useState(false),
    [documents, setDocuments] = useState(false),
    [finalReview, setFinalReview] = useState(false);
  const prepared = tailoring?.packet?.role.id === job.id && !!tailoring.artifactHash;
  const ashby = (() => {
    try {
      return new URL(job.discovery?.url ?? '').hostname === 'jobs.ashbyhq.com';
    } catch {
      return false;
    }
  })();
  async function work(task: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try {
      await task();
    } catch (e) {
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!job.discovery) return;
    let active = true;
    void call({ action: 'application.lookup', jobId: job.id })
      .then((r) => {
        if (!active) return;
        setPolicy(r.policy);
        if (r.plan) {
          setPlan(r.plan);
          setReviewPacket(r.packet);
          setForm(r.form);
          setAnswers(r.plan.payload.answers);
        }
      })
      .catch((e) => {
        if (active) setMessage(String(e));
      });
    return () => {
      active = false;
    };
  }, [call, job.id]);
  async function inspect() {
    await work(async () => {
      if (!prepared) throw Error('Prepare and save a PDF for this role first.');
      const registered = await call({ action: 'packet.register', jobId: job.id });
      const r = await call({ action: 'application.inspect', packetHash: registered.packetHash });
      setPacketHash(r.packetHash);
      setForm(r.form);
      setFormDigest(r.formHash);
      setAnswers({});
      setPlan(undefined);
      setReviewPacket(undefined);
      setEligibility(false);
      setDocuments(false);
      setFinalReview(false);
      setMessage('Form inspected. Nothing has been submitted. Complete the required answers.');
    });
  }
  return (
    <section className="cw-engine cw-application-review" aria-label="Application review">
      <header>
        <div>
          <h2>Review and apply</h2>
          <p>
            {job.role} · {job.company}
          </p>
        </div>
        <button onClick={onSetup} disabled={busy}>
          Execution setup
        </button>
      </header>
      {!job.discovery ? (
        <p>
          Add this role from the sourcing results to retain its source and freshness checks.
          Manually pasted postings are not eligible for browser execution.
        </p>
      ) : !ashby ? (
        <p>
          This role uses a different application path. The first executor supports Ashby hosted
          forms. Review and apply on the employer’s site; no submission is attempted here.
        </p>
      ) : (
        <>
          <ol className="cw-engine-steps">
            <li>Save the sourced role</li>
            <li>Review resume and build its PDF</li>
            <li>Inspect the form and answer questions</li>
            <li>Approve the exact application, then submit</li>
          </ol>
          <div className="cw-engine-toolbar">
            <button onClick={onPrepare} disabled={busy}>
              {prepared ? 'Review tailored documents' : 'Prepare resume and PDF'}
            </button>
            <button
              disabled={
                busy ||
                !prepared ||
                (!!plan &&
                  ['CONFIRMED', 'UNCERTAIN', 'PREPARING', 'SUBMITTING'].includes(plan.state))
              }
              onClick={() => void inspect()}
            >
              Inspect Ashby form
            </button>
          </div>
          {policy.enabled && (
            <button
              disabled={busy}
              onClick={() =>
                void work(async () => {
                  const s = await call({
                    action: 'application.policy',
                    enabled: false,
                    dailyLimit: policy.dailyLimit,
                  });
                  setPolicy(s.policy);
                  if (plan) {
                    const r = await call({ action: 'application.review', id: plan.id });
                    setPlan(r.plan);
                  }
                  setFinalReview(false);
                  setMessage('Execution paused. Pending approvals were revoked.');
                })
              }
            >
              Pause application execution
            </button>
          )}
          {job.discovery.assessment.eligibility !== 'confirmed_eligible' && (
            <p className="cw-engine-warning">
              Eligibility: {job.discovery.assessment.eligibility.replace(/_/g, ' ')}.{' '}
              {job.discovery.assessment.unknowns.join(' ')} Review location, work authorization,
              sponsorship and other requirements before approval.
            </p>
          )}
          {form && !plan && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void work(async () => {
                  const p = await call({
                    action: 'application.stage',
                    packetHash,
                    formHash: formDigest,
                    answers,
                    eligibilityConfirmed: eligibility,
                  });
                  const review = await call({ action: 'application.review', id: p.id });
                  setPlan(review.plan);
                  setReviewPacket(review.packet);
                  setForm(review.form);
                  setFinalReview(false);
                });
              }}
            >
              <h3>Application answers</h3>
              <p>
                These answers are sent only after you approve and submit. Nothing is guessed from
                your resume.
              </p>
              {form.fields.map((f) => (
                <label key={f.id} className={f.type === 'checkbox' ? 'cw-engine-check' : undefined}>
                  {f.type === 'checkbox' && (
                    <input
                      type="checkbox"
                      checked={answers[f.id] === true}
                      required={f.required}
                      onChange={(e) => setAnswers({ ...answers, [f.id]: e.target.checked })}
                      disabled={busy}
                    />
                  )}
                  <span>
                    {f.label}
                    {f.required ? ' *' : ''}
                  </span>
                  {f.type === 'file' ? (
                    <small>
                      {/resume|cv/i.test(f.label)
                        ? 'Your exact saved resume PDF will be uploaded.'
                        : f.required
                          ? 'Additional document required. This form needs manual completion.'
                          : 'Optional attachment not provided.'}
                    </small>
                  ) : f.type === 'select' ? (
                    <select
                      value={String(answers[f.id] ?? '')}
                      required={f.required}
                      onChange={(e) => setAnswers({ ...answers, [f.id]: e.target.value })}
                      disabled={busy}
                    >
                      <option value="">Choose an answer</option>
                      {f.options.filter(Boolean).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea
                      required={f.required}
                      value={String(answers[f.id] ?? '')}
                      onChange={(e) => setAnswers({ ...answers, [f.id]: e.target.value })}
                      maxLength={10000}
                      disabled={busy}
                    />
                  ) : f.type !== 'checkbox' ? (
                    <input
                      type={f.type}
                      required={f.required}
                      value={String(answers[f.id] ?? '')}
                      onChange={(e) => setAnswers({ ...answers, [f.id]: e.target.value })}
                      maxLength={10000}
                      disabled={busy}
                    />
                  ) : null}
                </label>
              ))}
              <label className="cw-engine-check">
                <input
                  required
                  type="checkbox"
                  checked={eligibility}
                  onChange={(e) => setEligibility(e.target.checked)}
                  disabled={busy}
                />
                I reviewed the eligibility requirements and confirmed my answers.
              </label>
              <label className="cw-engine-check">
                <input
                  required
                  type="checkbox"
                  checked={documents}
                  onChange={(e) => setDocuments(e.target.checked)}
                  disabled={busy}
                />
                I reviewed the tailored resume and its claims.
              </label>
              <button
                type="submit"
                disabled={
                  busy ||
                  !eligibility ||
                  !documents ||
                  form.fields.some(
                    (f) => f.required && f.type === 'file' && !/resume|cv/i.test(f.label),
                  )
                }
              >
                Review exact application
              </button>
            </form>
          )}
          {plan && (
            <div className="cw-exact-review">
              <header>
                <h3>Saved application</h3>
                <StatusBadge
                  tone={
                    plan.state === 'CONFIRMED'
                      ? 'positive'
                      : plan.state === 'UNCERTAIN' || plan.state === 'NEEDS_USER'
                        ? 'attention'
                        : 'neutral'
                  }
                >
                  {plan.state}
                </StatusBadge>
              </header>
              <p>
                Destination:{' '}
                <a href={plan.payload.jobUrl} target="_blank" rel="noreferrer">
                  {job.company} on Ashby ↗
                </a>
              </p>
              <small>PDF SHA-256: {plan.payload.pdfHash}</small>
              <small>Application SHA-256: {plan.payload_hash}</small>
              {reviewPacket && (
                <>
                  <details>
                    <summary>Exact resume text</summary>
                    <pre>{reviewPacket.blocks.map((b) => b.text).join('\n')}</pre>
                  </details>
                  <details>
                    <summary>Cover letter · not attached by this executor</summary>
                    <pre>{reviewPacket.coverLetter}</pre>
                  </details>
                </>
              )}
              <dl>
                {form?.fields
                  .filter((f) => f.type !== 'file' && plan.payload.answers[f.id] !== undefined)
                  .map((f) => (
                    <div key={f.id}>
                      <dt>{f.label}</dt>
                      <dd>{String(plan.payload.answers[f.id])}</dd>
                    </div>
                  ))}
              </dl>
              {plan.last_error && (
                <p className="cw-engine-warning">
                  {plan.last_error}. Changed or incomplete applications need review.
                </p>
              )}
              {['DRAFT', 'AUTHORIZED'].includes(plan.state) && (
                <>
                  <label>
                    Daily application attempt limit
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={policy.dailyLimit}
                      onChange={(e) => setPolicy({ ...policy, dailyLimit: Number(e.target.value) })}
                      disabled={busy || policy.enabled}
                    />
                  </label>
                  <label className="cw-engine-check">
                    <input
                      type="checkbox"
                      checked={policy.enabled}
                      disabled={busy}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        const previous = policy;
                        setPolicy({ ...policy, enabled });
                        void work(async () => {
                          try {
                            const s = await call({
                              action: 'application.policy',
                              enabled,
                              dailyLimit: policy.dailyLimit,
                            });
                            setPolicy(s.policy);
                            const r = await call({ action: 'application.review', id: plan.id });
                            setPlan(r.plan);
                            setFinalReview(false);
                          } catch (error) {
                            setPolicy(previous);
                            throw error;
                          }
                        });
                      }}
                    />
                    Enable execution of individually approved applications
                  </label>
                  <label className="cw-engine-check">
                    <input
                      type="checkbox"
                      checked={finalReview}
                      onChange={(e) => setFinalReview(e.target.checked)}
                      disabled={busy}
                    />
                    I reviewed this exact PDF, destination and answer set. I authorize this
                    application.
                  </label>
                  {plan.state === 'DRAFT' ? (
                    <button
                      disabled={busy || !policy.enabled || !finalReview}
                      onClick={() =>
                        void work(async () => {
                          setPlan(
                            await call({
                              action: 'application.authorize',
                              id: plan.id,
                              expectedHash: plan.payload_hash,
                            }),
                          );
                          setFinalReview(false);
                          setMessage(
                            'Approved for 30 minutes. Use Submit approved application to proceed.',
                          );
                        })
                      }
                    >
                      Approve exact application
                    </button>
                  ) : (
                    <>
                      <p>
                        Approval expires{' '}
                        {plan.approval_until ? new Date(plan.approval_until).toLocaleString() : ''}.
                      </p>
                      <button
                        disabled={busy || !policy.enabled || !finalReview}
                        onClick={() =>
                          void work(async () => {
                            setFinalReview(false);
                            const p = await call({ action: 'application.run', id: plan.id });
                            setPlan(p);
                            if (p.state === 'CONFIRMED' && p.receipt) {
                              if (
                                !(await onConfirmed(
                                  `${p.receipt.text} · ${p.receipt.observedAt} · ${p.receipt.url}`,
                                ))
                              )
                                throw Error(
                                  'Submission confirmed in the queue; local shortlist update failed. Refresh before trying anything else.',
                                );
                            }
                            setMessage(
                              p.state === 'CONFIRMED'
                                ? 'Hosted confirmation recorded. This is not proof that a recruiter read the application.'
                                : 'No confirmed completion. Review the saved state before taking another action.',
                            );
                          })
                        }
                      >
                        Submit approved application
                      </button>
                    </>
                  )}
                </>
              )}
              {['DRAFT', 'NEEDS_USER'].includes(plan.state) && (
                <button disabled={busy} onClick={() => void inspect()}>
                  Re-inspect and edit answers
                </button>
              )}
              {plan.state === 'UNCERTAIN' && (
                <p className="cw-engine-warning">
                  Submission outcome is uncertain. Check with the employer before doing anything
                  else. Pursuit will not retry this application automatically.
                </p>
              )}
              {plan.state === 'CONFIRMED' && plan.receipt && job.status !== 'Applied' && (
                <button
                  disabled={busy}
                  onClick={() =>
                    void work(async () => {
                      if (
                        !(await onConfirmed(
                          `${plan.receipt!.text} · ${plan.receipt!.observedAt} · ${plan.receipt!.url}`,
                        ))
                      )
                        throw Error(
                          'Could not update the shortlist. The queue confirmation is retained.',
                        );
                      setMessage('Shortlist updated from the saved hosted confirmation.');
                    })
                  }
                >
                  Update shortlist from confirmation
                </button>
              )}
              {plan.receipt && (
                <p className="cw-engine-receipt">
                  {plan.receipt.text}
                  <br />
                  {new Date(plan.receipt.observedAt).toLocaleString()} · accepted HTTP{' '}
                  {plan.receipt.acceptedPostStatus}
                </p>
              )}
            </div>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
      {busy && <p role="status">Checking the saved role and application. Keep Pursuit open…</p>}
    </section>
  );
}
