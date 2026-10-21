'use client';

import { useResource } from '@/lib/api-client';
import type { ResumeVersion } from '@pursuit/shared';
import {
  PageHeader,
  Loading,
  ErrorBox,
  Empty,
  Card,
  StatusPill,
  Unavailable,
} from '../_components/ui';

interface VersionsResponse {
  items: ResumeVersion[];
}

export default function VaultPage() {
  const versions = useResource<VersionsResponse>('/resumes/versions');

  return (
    <>
      <PageHeader
        title="Resume Vault"
        subtitle="Versioned, tailored resumes — one per application, with review status."
      />

      {versions.error ? (
        <ErrorBox error={versions.error} retry={versions.reload} />
      ) : versions.loading ? (
        <Loading />
      ) : (versions.data?.items.length ?? 0) === 0 ? (
        <Empty>No resume versions recorded yet.</Empty>
      ) : (
        <ul className="space-y-2">
          {versions.data?.items.map((v) => (
            <li key={v.id}>
              <Card className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{v.label}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    template {v.template_version} · created{' '}
                    {new Date(v.created_at).toLocaleString()}
                    {v.job_id ? ' · targeted to a job' : ' · master'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {v.is_submitted && <StatusPill status="submitted" kind="neutral" />}
                  <StatusPill status={v.status} kind="neutral" />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-6 space-y-2">
        <Unavailable
          feature="Resume upload"
          detail="File upload and storage are not wired in this milestone — the vault lists versions recorded through the API only."
        />
        <Unavailable
          feature="AI tailoring"
          detail="Tailoring drafts must be reviewed by you before use; the generation engine lands in a later phase."
        />
      </section>
    </>
  );
}
