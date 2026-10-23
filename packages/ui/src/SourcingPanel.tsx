import React, { useEffect, useState } from 'react';
import type {
  EngineClient,
  EngineProgress,
  EngineSnapshot,
  SearchProfile,
  SearchMatch,
  SourcedOpportunity,
} from '@pursuit/career-engine/contracts';
import { StatusBadge } from './status';
const empty: SearchProfile = {
  roles: [],
  skills: [],
  residenceCountry: null,
  residenceVerified: false,
  workAuthorization: [],
  remoteOnly: false,
  exclusions: [],
  salaryFloor: null,
};
export function Eligibility({ match }: { match: { assessment: SearchMatch['assessment'] } }) {
  const e = match.assessment.eligibility;
  return (
    <StatusBadge
      tone={e === 'ineligible' ? 'negative' : e === 'confirmed_eligible' ? 'positive' : 'attention'}
    >
      {e.replace(/_/g, ' ')}
    </StatusBadge>
  );
}
export function SourcingPanel({
  call,
  progress,
  onSetup,
  onSave,
  savedIds,
}: {
  call: EngineClient;
  progress?: EngineProgress;
  onSetup: () => void;
  onSave: (job: SourcedOpportunity) => Promise<boolean>;
  savedIds: string[];
}) {
  const [snapshot, setSnapshot] = useState<EngineSnapshot>();
  const [profile, setProfile] = useState<SearchProfile>(empty);
  const [roles, setRoles] = useState(''),
    [skills, setSkills] = useState(''),
    [exclusions, setExclusions] = useState(''),
    [countries, setCountries] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [visible, setVisible] = useState(20);
  function accept(value: EngineSnapshot, loadProfile = false) {
    setSnapshot(value);
    if (loadProfile) {
      setProfile(value.profile);
      setRoles(value.profile.roles.join(', '));
      setSkills(value.profile.skills.map((s) => `${s.name} | ${s.evidence}`).join('\n'));
      setExclusions(value.profile.exclusions.join(', '));
      setCountries(
        value.profile.workAuthorization
          .filter((a) => a.status === 'authorized' && a.verified)
          .map((a) => a.country)
          .join(', '),
      );
    }
  }
  useEffect(() => {
    let active = true;
    call({ action: 'snapshot' })
      .then((v) => {
        if (active) accept(v, true);
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
  }, [call]);
  async function action(work: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await work();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function search() {
    await action(async () => {
      const evidence = skills
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => {
          const index = l.indexOf('|');
          if (index < 1 || !l.slice(index + 1).trim())
            throw Error('For each skill, add its source evidence after |.');
          return { name: l.slice(0, index).trim(), evidence: l.slice(index + 1).trim() };
        });
      const next = {
        ...profile,
        roles: roles
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        skills: evidence,
        exclusions: exclusions
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        workAuthorization: countries
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
          .map((country) => ({ country, status: 'authorized' as const, verified: true })),
      };
      accept(await call({ action: 'search', profile: next }));
    });
  }
  return (
    <section className="cw-engine" aria-label="Job sourcing">
      <header>
        <div>
          <h2>Find roles across public sources</h2>
          <p>
            Search public boards and employer pages. Matching runs on this device without a model.
          </p>
        </div>
        <button type="button" onClick={onSetup} disabled={busy}>
          Engine setup
        </button>
      </header>
      {error && (
        <p role="alert" className="cw-engine-error">
          {error}. Check Engine setup or adjust your search.
        </p>
      )}
      <details open={!snapshot?.profile.roles.length}>
        <summary>Search preferences</summary>
        <div className="cw-engine-fields">
          <label>
            Target roles, separated by commas
            <input
              value={roles}
              onChange={(e) => setRoles(e.target.value)}
              maxLength={1000}
              placeholder="QA analyst, software engineer"
              disabled={busy}
            />
          </label>
          <label>
            Skills and source evidence, one per line
            <textarea
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              maxLength={12000}
              placeholder="SQL | Used SQL to verify payment reports in my last role"
              disabled={busy}
            />
          </label>
          <label>
            Residence country code
            <input
              value={profile.residenceCountry ?? ''}
              maxLength={2}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  residenceCountry: e.target.value.toUpperCase() || null,
                  residenceVerified: false,
                })
              }
              placeholder="NG"
              disabled={busy}
            />
          </label>
          <label className="cw-engine-check">
            <input
              type="checkbox"
              checked={profile.residenceVerified}
              onChange={(e) => setProfile({ ...profile, residenceVerified: e.target.checked })}
              disabled={busy || !profile.residenceCountry}
            />
            I confirm my residence country
          </label>
          <label>
            Countries where you have confirmed work authorization
            <input
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
              maxLength={300}
              placeholder="Country codes, e.g. NG, GB. Leave unknown countries out."
              disabled={busy}
            />
          </label>
          <label>
            Minimum compensation (optional)
            <input
              type="number"
              min={0}
              value={profile.salaryFloor?.amount ?? ''}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  salaryFloor: e.target.value
                    ? {
                        amount: Number(e.target.value),
                        currency: profile.salaryFloor?.currency ?? 'USD',
                        unit: profile.salaryFloor?.unit ?? 'year',
                      }
                    : null,
                })
              }
              disabled={busy}
            />
          </label>
          {profile.salaryFloor && (
            <>
              <label>
                Compensation currency
                <input
                  maxLength={3}
                  value={profile.salaryFloor.currency}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      salaryFloor: {
                        ...profile.salaryFloor!,
                        currency: e.target.value.toUpperCase(),
                      },
                    })
                  }
                  disabled={busy}
                />
              </label>
              <label>
                Compensation period
                <select
                  value={profile.salaryFloor.unit}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      salaryFloor: { ...profile.salaryFloor!, unit: e.target.value },
                    })
                  }
                  disabled={busy}
                >
                  <option value="year">Per year</option>
                  <option value="month">Per month</option>
                  <option value="hour">Per hour</option>
                </select>
              </label>
            </>
          )}
          <label>
            Exclude companies or terms
            <input
              value={exclusions}
              onChange={(e) => setExclusions(e.target.value)}
              maxLength={1000}
              disabled={busy}
            />
          </label>
          <label className="cw-engine-check">
            <input
              type="checkbox"
              checked={profile.remoteOnly}
              onChange={(e) => setProfile({ ...profile, remoteOnly: e.target.checked })}
              disabled={busy}
            />
            Remote roles only
          </label>
          <p>
            Worldwide remote does not establish work authorization. Unknown geography and
            eligibility stay marked for review.
          </p>
        </div>
      </details>
      <form
        className="cw-engine-source"
        onSubmit={(e) => {
          e.preventDefault();
          void action(async () => {
            accept(
              await call({
                action: 'source.add',
                url,
                ...(company.trim() ? { company: company.trim() } : {}),
              }),
            );
            setUrl('');
            setCompany('');
          });
        }}
      >
        <label>
          Company name (optional)
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            maxLength={300}
            placeholder="The employer you are watching"
            disabled={busy}
          />
        </label>
        <label>
          Employer board or structured job-page URL
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://jobs.ashbyhq.com/company"
            disabled={busy}
          />
        </label>
        <button type="submit" disabled={busy}>
          Add source
        </button>
      </form>
      <div className="cw-engine-toolbar">
        <button onClick={() => void search()} disabled={busy || !roles.trim()}>
          {busy ? 'Sourcing…' : 'Search for roles'}
        </button>
        <span>No AI tokens · up to 6 due sources per run · results capped at 300</span>
      </div>
      <div role="status" aria-live="polite" className="cw-engine-progress">
        {busy
          ? (progress?.message ?? 'Opening the local engine…')
          : snapshot
            ? `${snapshot.matches.length} matching roles in your discovery pool. Save the ones you want to review.`
            : 'Configure the local engine to begin.'}
      </div>
      {!!snapshot?.sources.length && (
        <details>
          <summary>{snapshot.sources.length} configured sources</summary>
          {snapshot.sources.map((s) => (
            <div className="cw-engine-source-row" key={s.id}>
              <span>
                {s.company}
                <small>
                  {s.provider} ·{' '}
                  {s.lastError ??
                    (s.lastSuccess
                      ? `Last checked ${new Date(s.lastSuccess).toLocaleString()}`
                      : 'Not checked yet')}
                </small>
              </span>
              <button
                disabled={busy}
                onClick={() =>
                  void action(async () =>
                    accept(await call({ action: 'source.toggle', id: s.id, enabled: !s.enabled })),
                  )
                }
              >
                {s.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
        </details>
      )}
      <div className="cw-engine-matches">
        {snapshot?.matches.slice(0, visible).map((m) => (
          <article key={m.id}>
            <header>
              <div>
                <h3>{m.title}</h3>
                <p>
                  {m.company} · {m.location}
                </p>
              </div>
              <Eligibility match={m} />
            </header>
            <p>{m.assessment.reasons.join(' ')}</p>
            {!!m.assessment.unknowns.length && (
              <p className="cw-engine-warning">Review: {m.assessment.unknowns.join(' ')}</p>
            )}
            <details>
              <summary>Match evidence · {m.assessment.fitScore}/100 experimental fit</summary>
              {m.assessment.fitEvidence.map((e, i) => (
                <p key={i}>
                  <strong>{e.requirement}</strong>: {e.candidateEvidence}
                  <br />
                  <small>Posting: {e.jobEvidence}</small>
                </p>
              ))}
              <p>
                Missing requirements:{' '}
                {m.assessment.missingSkills.join(', ') ||
                  'None identified by keyword matching. Review the full posting.'}
              </p>
            </details>
            <footer>
              <a href={m.url} target="_blank" rel="noreferrer">
                View source ↗
              </a>
              <small>Observed {new Date(m.observedAt).toLocaleDateString()}</small>
              <button
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    const job = await call({ action: 'opportunity', id: m.id });
                    if (!(await onSave(job))) throw Error('Could not save opportunity');
                  })
                }
              >
                {savedIds.includes(m.id) ? 'Refresh saved posting' : 'Save opportunity'}
              </button>
            </footer>
          </article>
        ))}
      </div>
      {snapshot && visible < snapshot.matches.length && (
        <button onClick={() => setVisible(visible + 20)}>Show more roles</button>
      )}
      {snapshot?.runs.some((r) => r.status === 'failed' || r.status === 'partial') && (
        <p className="cw-engine-warning">
          Some source runs were incomplete. Open Background work for diagnostics. Partial coverage
          is not a complete web search.
        </p>
      )}
    </section>
  );
}
export function EngineHistory({
  call,
  progress,
}: {
  call: EngineClient;
  progress?: EngineProgress;
}) {
  const [snapshot, setSnapshot] = useState<EngineSnapshot>(),
    [error, setError] = useState('');
  const refresh = () => {
    call({ action: 'snapshot' })
      .then(setSnapshot)
      .catch((e) => setError(String(e)));
  };
  useEffect(refresh, [call]);
  return (
    <section className="cw-engine" aria-label="Local engine history">
      <header>
        <h2>Local runs and applications</h2>
        <button onClick={refresh}>Refresh status</button>
      </header>
      {snapshot?.policy.enabled && (
        <button
          onClick={() =>
            void call({
              action: 'application.policy',
              enabled: false,
              dailyLimit: snapshot.policy.dailyLimit,
            })
              .then(setSnapshot)
              .catch((e) => setError(String(e)))
          }
        >
          Pause applications and revoke pending approvals
        </button>
      )}
      <p>
        This worker runs while a requested action is active. It does not run when Pursuit is closed.
      </p>
      {progress && <p role="status">{progress.message}</p>}
      {error && <p role="alert">{error}</p>}
      {snapshot?.plans.map((p) => (
        <article className="cw-engine-history" key={p.id}>
          <strong>{p.state}</strong>
          <span>{p.jobUrl}</span>
          {p.last_error && <p>{p.last_error}</p>}
          {p.receipt && (
            <p>
              Hosted confirmation: {p.receipt.text} ·{' '}
              {new Date(p.receipt.observedAt).toLocaleString()}
            </p>
          )}
        </article>
      ))}
      {snapshot?.runs.map((r, i) => (
        <article className="cw-engine-history" key={i}>
          <strong>
            {r.status} · {r.count} roles
          </strong>
          <span>
            {r.source_id} · {new Date(r.started_at).toLocaleString()}
          </span>
          <p>{r.diagnostics.join(' ')}</p>
        </article>
      ))}
    </section>
  );
}
