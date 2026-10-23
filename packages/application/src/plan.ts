import { z } from 'zod';
import {
  type Job,
  Source,
  sourceFromUrl,
  pollSource,
  permittedPage,
  extractJobPosting,
  type Reader,
  canonicalUrl,
} from '@pursuit/discovery';
import { digest } from '@pursuit/tailoring';
import { Form, Payload, type Field } from './contracts.js';
export async function formHash(form: unknown) {
  const parsed = Form.parse(form);
  return digest(JSON.stringify(parsed));
}
export async function payloadHash(payload: unknown) {
  return digest(JSON.stringify(Payload.parse(payload)));
}
export function missingAnswers(form: Form, payload: Payload): Field[] {
  return form.fields.filter((field) => {
    if (field.type === 'file') return field.required && !/resume|cv/i.test(field.label);
    const answer = payload.answers[field.id];
    if (answer === undefined || answer === '') return field.required;
    if (field.type === 'checkbox')
      return typeof answer !== 'boolean' || (field.required && !answer);
    if (typeof answer !== 'string' || (field.required && !answer.trim())) return true;
    if (field.type === 'email' && !z.email().safeParse(answer).success) return true;
    if (field.type === 'url' && !z.url().safeParse(answer).success) return true;
    if (field.type === 'select' && !field.options.includes(String(answer))) return true;
    return false;
  });
}
function routeFor(job: Job) {
  const match = job.description.match(
    /\b(?:to apply|apply by email|send (?:your )?(?:resume|cv|application))[\s\S]{0,200}?([a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,})/i,
  );
  if (match)
    return {
      route: 'email_review',
      recipientCandidate: match[1],
      routeEvidence: { quote: match[0], sourceUrl: job.evidence.url },
      notice:
        'Confirm the published instructions and recipient. Attachment sending is not implemented; no email was sent.',
    };
  return { route: job.provider === 'ashby' ? 'ashby_hosted' : 'manual_hosted' };
}
export type Resolution =
  | { status: 'needs_employer_link' | 'needs_review'; originalUrl: string; reason: string }
  | {
      status: 'resolved';
      job: Job;
      route: string;
      applyUrl: string | null;
      recipientCandidate?: string;
      routeEvidence?: { quote: string; sourceUrl: string };
      notice?: string;
    };
export async function resolveApplication(raw: string, read: Reader): Promise<Resolution> {
  const url = new URL(raw);
  if (url.username || url.password || url.protocol !== 'https:') throw new Error('unsafe_job_url');
  const host = url.hostname.replace(/^www\./, '');
  if (
    ['linkedin.com', 'x.com', 'twitter.com', 'indeed.com', 'glassdoor.com', 'wellfound.com'].some(
      (h) => host === h || host.endsWith('.' + h),
    )
  )
    return {
      status: 'needs_employer_link',
      originalUrl: raw,
      reason:
        'Provide the canonical employer posting or paste its details. No restricted-platform scraping or login was attempted.',
    };
  const source = sourceFromUrl(raw);
  if (source) {
    const poll = await pollSource(source, read, { maxPages: 5 });
    const wanted = canonicalUrl(raw);
    const job = poll.jobs.find(
      (j) =>
        canonicalUrl(j.sourceUrl) === wanted ||
        j.externalId === url.pathname.split('/').filter(Boolean).pop(),
    );
    if (!job)
      return {
        status: 'needs_review',
        originalUrl: raw,
        reason:
          'No matching public posting was returned; an expired or migrated link needs review.',
      };
    return { status: 'resolved', job, ...routeFor(job), applyUrl: job.applyUrl ?? job.sourceUrl };
  }
  const sourcePage = Source.parse({
    id: `page:${await digest(raw)}`,
    provider: 'page',
    url: raw,
    company: host,
  });
  const poll = extractJobPosting(
    await permittedPage(read, raw),
    raw,
    sourcePage,
    new Date().toISOString(),
  );
  if (poll.jobs.length !== 1)
    return {
      status: 'needs_review',
      originalUrl: raw,
      reason:
        'A unique supported JobPosting was not found. Paste details or supply its employer/ATS link.',
    };
  return {
    status: 'resolved',
    job: poll.jobs[0]!,
    ...routeFor(poll.jobs[0]!),
    applyUrl: poll.jobs[0]!.applyUrl,
  };
}
