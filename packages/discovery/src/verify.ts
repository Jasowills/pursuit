import { normalize, pollSource } from './adapters.js';
import { extractJobPosting, permittedPage } from './crawler.js';
import type { Job, Reader, Source } from './contracts.js';
import { canonicalUrl } from './text.js';
export type Verification = {
  status: 'observed_open' | 'closed' | 'unknown';
  url: string;
  observedAt: string;
  reason: string;
};
export async function verifyListing(
  source: Source,
  job: Job,
  read: Reader,
): Promise<{ verification: Verification; job?: Job }> {
  const observedAt = new Date().toISOString();
  const result = (status: Verification['status'], url: string, reason: string, updated?: Job) => ({
    verification: { status, url, reason, observedAt },
    job: updated,
  });
  if (job.kind === 'hiring_lead')
    return result(
      'unknown',
      job.sourceUrl,
      'A hiring signal requires a separate verified employer vacancy.',
    );
  try {
    if (['greenhouse', 'lever', 'himalayas'].includes(source.provider)) {
      let url: string;
      if (source.provider === 'greenhouse')
        url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(source.board!)}/jobs/${encodeURIComponent(job.externalId)}`;
      else if (source.provider === 'lever')
        url = `https://api${source.region === 'eu' ? '.eu' : ''}.lever.co/v0/postings/${encodeURIComponent(source.board!)}/${encodeURIComponent(job.externalId)}?mode=json`;
      else {
        const original = new URL(job.sourceUrl);
        if (original.hostname !== 'himalayas.app' || !original.pathname.startsWith('/companies/'))
          return result('unknown', job.sourceUrl, 'No supported canonical status route.');
        url = `https://himalayas.app/jobs/api${original.pathname}`;
      }
      const response = await read(url);
      if (response.status === 410 || (response.status === 404 && source.provider !== 'himalayas'))
        return result(
          'closed',
          url,
          `Source returned ${response.status} for the previously observed posting.`,
        );
      if (response.status !== 200)
        return result('unknown', url, `Source status could not be confirmed (${response.status}).`);
      const body = JSON.parse(response.body);
      const updated = normalize(
        source,
        source.provider === 'himalayas' ? body.job : body,
        observedAt,
      );
      if (
        updated.externalId !== job.externalId ||
        canonicalUrl(updated.sourceUrl) !== canonicalUrl(job.sourceUrl)
      )
        return result(
          'unknown',
          url,
          'Returned posting identity differs; review a possible migration.',
        );
      if (updated.validThrough && updated.validThrough < observedAt)
        return result('closed', url, 'The source expiry date has passed.');
      return result(
        'observed_open',
        url,
        'Posting is currently returned by the documented source. This does not prove the employer is interviewing.',
        updated,
      );
    }
    if (source.provider === 'page') {
      try {
        const page = extractJobPosting(
          await permittedPage(read, job.sourceUrl),
          job.sourceUrl,
          source,
          observedAt,
        );
        const updated = page.jobs.find((j) => j.externalId === job.externalId);
        if (!updated)
          return result(
            'unknown',
            job.sourceUrl,
            'Job evidence disappeared or changed; HTTP 200 alone is insufficient.',
          );
        if (updated.validThrough && updated.validThrough < observedAt)
          return result('closed', job.sourceUrl, 'The employer-published expiry has passed.');
        return result(
          'observed_open',
          job.sourceUrl,
          'JobPosting evidence is still present on the observed page.',
          updated,
        );
      } catch (e) {
        if (e instanceof Error && /^page_http_(404|410)$/.test(e.message))
          return result('closed', job.sourceUrl, e.message);
        throw e;
      }
    }
    const poll = await pollSource(source, read, { maxPages: 20 });
    const updated = poll.jobs.find((j) => j.externalId === job.externalId);
    if (updated?.validThrough && updated.validThrough < observedAt)
      return result('closed', updated.sourceUrl, 'The source expiry date has passed.');
    if (updated)
      return result(
        'observed_open',
        updated.sourceUrl,
        'Posting is present in the current public employer board.',
        updated,
      );
    return result(
      poll.complete ? 'closed' : 'unknown',
      job.sourceUrl,
      poll.complete
        ? 'Posting is absent from a complete employer-board snapshot.'
        : 'The source result was incomplete; closure cannot be inferred.',
    );
  } catch {
    return result(
      'unknown',
      job.sourceUrl,
      'Verification failed; existing source evidence was retained.',
    );
  }
}
