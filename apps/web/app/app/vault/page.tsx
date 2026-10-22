'use client';

import Link from 'next/link';
import { useResource } from '@/lib/api-client';
import type { ResumeVersion } from '@pursuit/shared';
import { PageHeader, Loading, ErrorBox, Empty, StatusPill, Unavailable } from '../_components/ui';

interface VersionsResponse {
  items: ResumeVersion[];
}

export default function VaultPage() {
  const versions = useResource<VersionsResponse>('/resumes/versions');

  return (
    <>
      <PageHeader
        eyebrow="Section 07 / Resume Vault"
        title="Resume Vault"
        subtitle="Versioned, tailored resumes — one per application, with review status."
      />

      <section>
        <div className="flex items-end justify-between gap-4 border-b border-[var(--ink)] pb-2">
          <h2 className="panel-title">Version records</h2>
          <span className="mono-meta">{versions.data?.items.length ?? 0} files</span>
        </div>

        {versions.error ? (
          <div className="mt-4">
            <ErrorBox error={versions.error} retry={versions.reload} />
          </div>
        ) : versions.loading ? (
          <Loading />
        ) : (versions.data?.items.length ?? 0) === 0 ? (
          <Empty>No resume versions recorded yet.</Empty>
        ) : (
          <ul>
            {versions.data?.items.map((v, index) => (
              <li key={v.id} className="case-row">
                <span className="flex min-w-0 items-start gap-4">
                  <span className="index-num pt-1">{String(index + 1).padStart(2, '0')}</span>
                  <span className="min-w-0">
                    <span className="case-row-title">{v.label}</span>
                    <span className="case-row-meta">
                      template {v.template_version} · created{' '}
                      {new Date(v.created_at).toLocaleString()}
                      {v.job_id ? ' · targeted to a job' : ' · master'}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {v.is_submitted && <StatusPill status="submitted" kind="neutral" />}
                  <StatusPill status={v.status} kind="neutral" />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 space-y-3">
        <p className="text-sm leading-relaxed">
          For editable, model-assisted resume drafts and text downloads, open the{' '}
          <Link className="link-underline" href="/app/workflow#prepare">
            search workflow
          </Link>
          . Those prepared materials are saved with their workflow records.
        </p>
        <Unavailable
          feature="PDF and Word resume files"
          detail="PDF/DOCX parsing and export are not yet implemented. The search workflow accepts plain-text/Markdown resumes."
        />
        <Unavailable
          feature="Vault integration"
          detail="This vault lists the original resume-version records. Prepared workflow materials are not yet synchronized into this view."
        />
      </section>
    </>
  );
}
