'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, useResource, clearToken } from '@/lib/api-client';
import type { CareerProfile } from '@pursuit/shared';
import { PageHeader, Loading, ErrorBox, Card, Field, inputClass } from '../_components/ui';
import { ModelConnections } from './connections';
import { GmailConnections } from './gmail';

interface ProfileResponse {
  user: { id: string; email: string; display_name: string };
  tenant_id: string;
  profile: CareerProfile;
}

export default function SettingsPage() {
  const router = useRouter();
  const profile = useResource<ProfileResponse>('/profile');
  const [form, setForm] = useState({
    location: '',
    role_families: '',
    seniority: '',
    hard_exclusions: '',
    desired_min_amount: '',
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile.data) {
      const p = profile.data.profile;
      setForm({
        location: p.location ?? '',
        role_families: p.role_families.join(', '),
        seniority: p.seniority.join(', '),
        hard_exclusions: p.hard_exclusions.join(', '),
        desired_min_amount: p.desired_compensation ? String(p.desired_compensation.min_amount) : '',
      });
    }
  }, [profile.data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      await apiFetch('/profile', {
        method: 'PUT',
        json: {
          location: form.location || null,
          role_families: form.role_families
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          seniority: form.seniority
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          hard_exclusions: form.hard_exclusions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          desired_compensation: form.desired_min_amount
            ? { min_amount: Number(form.desired_min_amount), currency: 'USD' }
            : null,
        },
      });
      setSaved(true);
      profile.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (profile.error) return <ErrorBox error={profile.error} retry={profile.reload} />;
  if (profile.loading || !profile.data) return <Loading />;

  const { user, tenant_id, profile: p } = profile.data;

  return (
    <>
      <PageHeader
        eyebrow="Section 09 / Settings"
        title="Settings"
        subtitle="Your career profile drives eligibility scoring — keep it factual. The agent never invents qualifications."
      />

      <Card className="mb-8 p-6">
        <h2 className="panel-heading">Career autopilot</h2>
        <p className="mt-2 mb-4 text-sm">
          Set up scheduled job research and draft preparation, pause work, and review completed
          runs. Automatic application submission is still in development.
        </p>
        <Link href="/app/autopilot" className="btn btn-outline">
          Configure career autopilot
        </Link>
      </Card>
      <ModelConnections />
      <Card className="mt-8 p-6">
        <GmailConnections />
      </Card>
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="space-y-6">
          <Card>
            <div className="border-b border-[var(--border)] pb-3">
              <p className="eyebrow">Account / Identity</p>
              <h2 className="panel-heading mt-1">Who this file belongs to.</h2>
            </div>
            <dl className="mt-2">
              {[
                ['Name', user.display_name],
                ['Email', user.email],
                ['Tenant', tenant_id],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4 border-b border-[var(--border)] py-3 text-[12px] last:border-0"
                >
                  <dt className="text-[color:var(--muted)]">{label}</dt>
                  <dd className={`text-right ${label === 'Tenant' ? 'font-mono text-[10px]' : ''}`}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <button
              onClick={() => {
                clearToken();
                router.push('/');
              }}
              className="btn btn-outline btn-sm mt-4"
            >
              Sign out
            </button>
          </Card>

          <div className="border-t border-[var(--border)] pt-4">
            <p className="eyebrow">Platform note</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--muted-foreground)]">
              This is the M1 web dashboard. Not-yet-implemented capabilities are visible as honest
              notices in their sections — see the{' '}
              <Link href="/app" className="link-underline">
                overview
              </Link>
              .
            </p>
          </div>
        </div>

        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] pb-4">
            <div>
              <p className="eyebrow">Career profile / Scoring input</p>
              <h2 className="panel-heading mt-1">Keep the record factual.</h2>
            </div>
            <span className="stamp stamp-muted">
              {p.experiences.length} exp · {p.skills.length} skills · {p.education.length} edu
            </span>
          </div>

          <p className="mt-3 text-[12px] leading-relaxed text-[color:var(--muted-foreground)]">
            {p.work_authorization.some((a) => a.verified)
              ? 'Work authorization verified. '
              : 'Work authorization not verified. '}
            Eligibility verdicts use this profile; unknown inputs stay visibly unknown.
          </p>

          <form onSubmit={save} className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Location">
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className={inputClass}
                placeholder="Berlin, DE"
              />
            </Field>
            <Field label="Desired minimum salary (USD)">
              <input
                type="number"
                min={0}
                value={form.desired_min_amount}
                onChange={(e) => setForm({ ...form, desired_min_amount: e.target.value })}
                className={inputClass}
                placeholder="120000"
              />
            </Field>
            <Field label="Role families" hint="Comma separated, e.g. backend, platform, infra">
              <input
                value={form.role_families}
                onChange={(e) => setForm({ ...form, role_families: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Seniority" hint="Comma separated, e.g. senior, staff">
              <input
                value={form.seniority}
                onChange={(e) => setForm({ ...form, seniority: e.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="md:col-span-2">
              <Field
                label="Hard exclusions"
                hint="Comma separated — jobs matching these are marked ineligible with reasons."
              >
                <input
                  value={form.hard_exclusions}
                  onChange={(e) => setForm({ ...form, hard_exclusions: e.target.value })}
                  className={inputClass}
                  placeholder="on-site only, security clearance"
                />
              </Field>
            </div>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
              <button type="submit" disabled={busy} className="btn btn-primary btn-arrow">
                {busy ? 'Saving…' : 'Save profile'}
              </button>
              {saved && <span className="stamp stamp-success">Saved</span>}
              {error && (
                <span role="alert" className="text-[12px] text-[color:var(--danger)]">
                  {error}
                </span>
              )}
            </div>
          </form>

          <p className="mt-4 border-t border-[var(--border)] pt-3 text-[11px] leading-relaxed text-[color:var(--muted)]">
            Experiences, skills, and education editing are planned phases — current values come from
            the API seed.
          </p>
        </Card>
      </div>
    </>
  );
}
