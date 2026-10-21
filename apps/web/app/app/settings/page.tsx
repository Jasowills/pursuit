'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, useResource, clearToken } from '@/lib/api-client';
import type { CareerProfile } from '@pursuit/shared';
import { PageHeader, Loading, ErrorBox, Card, Field, inputClass } from '../_components/ui';

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
        title="Settings"
        subtitle="Your career profile drives eligibility scoring — keep it factual. The agent never invents qualifications."
      />

      <Card>
        <h2 className="text-sm font-semibold">Account</h2>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--muted-foreground)]">Name</dt>
            <dd>{user.display_name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--muted-foreground)]">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--muted-foreground)]">Tenant</dt>
            <dd>
              <code className="font-mono text-xs">{tenant_id}</code>
            </dd>
          </div>
        </dl>
        <button
          onClick={() => {
            clearToken();
            router.push('/');
          }}
          className="mt-3 h-9 min-h-[44px] rounded-[10px] border border-[var(--border)] px-3 text-sm transition-colors duration-150 hover:bg-[var(--hover)]"
        >
          Sign out
        </button>
      </Card>

      <Card className="mt-4">
        <h2 className="text-sm font-semibold">Career profile</h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {p.experiences.length} experiences · {p.skills.length} skills · {p.education.length}{' '}
          education entries
          {p.work_authorization.some((a) => a.verified)
            ? ' · verified work authorization'
            : ' · work authorization not verified'}
        </p>
        <form onSubmit={save} className="mt-3 grid gap-3 md:grid-cols-2">
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
          <div className="flex items-center gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="h-10 min-h-[44px] rounded-[10px] bg-[var(--primary)] px-5 text-sm font-medium text-[color:var(--primary-foreground)] transition-colors duration-150 hover:bg-[#333] disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Save profile'}
            </button>
            {saved && <span className="text-sm text-[#18794e]">Saved.</span>}
            {error && (
              <span role="alert" className="text-sm text-[#a50e0e]">
                {error}
              </span>
            )}
          </div>
        </form>
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Experiences / skills / education editing and profile verification are planned phases —
          current values come from the API seed.
        </p>
      </Card>

      <Card className="mt-4 text-xs text-[var(--muted)]">
        Platform: this is the M1 web dashboard. Not-yet-implemented capabilities are visible as
        honest notices in their sections — see{' '}
        <Link href="/app" className="underline">
          overview
        </Link>
        .
      </Card>
    </>
  );
}
