import { createHash } from 'node:crypto';
import { Job, type Source, type Poll, type Reader } from './contracts.js';
import { httpUrl, iso, plain } from './text.js';
export const PARSER_VERSION = 'discovery-1';
const text = (x: unknown) => (typeof x === 'string' ? x : '');
const date = (x: unknown) => (typeof x === 'number' ? new Date(x * 1000).toISOString() : iso(x));
const number = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const names = new Intl.DisplayNames(['en'], { type: 'region' });
const countries = new Map<string, string>();
for (let a = 65; a <= 90; a++)
  for (let b = 65; b <= 90; b++) {
    const code = String.fromCharCode(a, b);
    const name = names.of(code);
    if (name && name !== code) {
      countries.set(code.toLowerCase(), code);
      countries.set(name.toLowerCase(), code);
    }
  }
export function countryCode(raw: unknown): string | null {
  if (raw && typeof raw === 'object') {
    const x = raw as any;
    return countryCode(x.alpha2 ?? x.name ?? x.slug);
  }
  if (typeof raw !== 'string') return null;
  const aliases: Record<string, string> = {
    'united states of america': 'US',
    usa: 'US',
    uk: 'GB',
    'united kingdom': 'GB',
    'south korea': 'KR',
  };
  return aliases[raw.toLowerCase()] ?? countries.get(raw.replace(/-/g, ' ').toLowerCase()) ?? null;
}
const base = (s: Source, r: any, url: string, now: string) => ({
  provider: s.provider,
  sourceId: s.id,
  externalId: '',
  title: '',
  company: s.company,
  sourceUrl: url,
  applyUrl: null,
  description: '',
  location: null,
  workplace: 'unknown' as const,
  applicantCountries: [],
  countryEvidence: null,
  timezoneRestrictions: null,
  raw: r,
  publishedAt: null,
  updatedAt: null,
  validThrough: null,
  compensation: null,
  employmentType: null,
  evidence: { url, method: 'public_ats_api', parserVersion: PARSER_VERSION, observedAt: now },
  attribution: null,
});
async function json(read: Reader, url: string) {
  const res = await read(url);
  if (res.status !== 200) throw new Error(`source_http_${res.status}`);
  return JSON.parse(res.body);
}
export function normalize(s: Source, r: any, now: string): Job {
  if (!r || typeof r !== 'object') throw new Error('invalid_job_record');
  if (s.provider === 'greenhouse')
    return Job.parse({
      ...base(s, r, text(r.absolute_url), now),
      externalId: String(r.id ?? ''),
      title: r.title,
      company: typeof r.company_name === 'string' ? r.company_name : s.company,
      applyUrl: httpUrl(r.absolute_url),
      description: plain(text(r.content)),
      location: r.location?.name ?? null,
      updatedAt: iso(r.updated_at),
      publishedAt: iso(r.first_published),
      validThrough: iso(r.application_deadline),
    });
  if (s.provider === 'ashby')
    return Job.parse({
      ...base(s, r, text(r.jobUrl), now),
      externalId: r.id,
      title: r.title,
      applyUrl: httpUrl(r.applyUrl),
      description: plain(text(r.descriptionHtml) || text(r.descriptionPlain)),
      location: r.location ?? null,
      workplace:
        r.workplaceType === 'Remote'
          ? 'remote'
          : r.workplaceType === 'Hybrid'
            ? 'hybrid'
            : r.workplaceType === 'OnSite'
              ? 'onsite'
              : 'unknown',
      publishedAt: iso(r.publishedAt),
      employmentType: r.employmentType ?? null,
    });
  if (s.provider === 'lever') {
    const sal = r.salaryRange;
    return Job.parse({
      ...base(s, r, text(r.hostedUrl), now),
      externalId: r.id,
      title: r.text,
      applyUrl: httpUrl(r.applyUrl),
      description: plain(
        [
          text(r.description),
          ...(r.lists ?? []).map((i: any) => `${text(i.text)} ${text(i.content)}`),
          text(r.additional),
        ].join('\n'),
      ),
      location: r.categories?.location ?? null,
      workplace: ['remote', 'hybrid', 'onsite'].includes(r.workplaceType)
        ? r.workplaceType
        : 'unknown',
      employmentType: r.categories?.commitment ?? null,
      compensation:
        sal && sal.currency
          ? {
              min: number(sal.min),
              max: number(sal.max),
              currency: sal.currency,
              unit: sal.interval ?? 'unknown',
            }
          : null,
    });
  }
  if (s.provider === 'workable')
    return Job.parse({
      ...base(s, r, text(r.url), now),
      externalId: String(r.shortcode ?? r.code ?? r.id ?? ''),
      title: r.title,
      applyUrl: httpUrl(r.application_url ?? r.url),
      description: plain(text(r.description)),
      location: r.location?.location_str ?? r.location?.city ?? null,
      workplace: ['remote', 'hybrid', 'onsite'].includes(r.workplace_type)
        ? r.workplace_type
        : 'unknown',
      publishedAt: iso(r.published_on ?? r.published_at),
      employmentType: r.employment_type ?? null,
    });
  if (s.provider === 'himalayas') {
    const hasCountries = Array.isArray(r.locationRestrictions);
    const codes = hasCountries ? r.locationRestrictions.map(countryCode) : [];
    const countryEvidence =
      hasCountries && codes.every(Boolean)
        ? codes.length
          ? 'Explicit applicant countries from source'
          : 'Source explicitly lists no country restriction'
        : null;
    const sourceUrl = httpUrl(r.guid);
    const applicationLink = httpUrl(r.applicationLink) ? r.applicationLink : null;
    if (!sourceUrl) throw new Error('missing_himalayas_guid');
    return Job.parse({
      ...base(s, r, sourceUrl, now),
      externalId: r.guid,
      title: r.title,
      company: r.companyName,
      applyUrl: applicationLink,
      description: plain(text(r.description) || text(r.excerpt)),
      workplace: 'remote',
      location: hasCountries
        ? r.locationRestrictions
            .map((v: any) => (typeof v === 'string' ? v : text(v.name) || text(v.alpha2)))
            .join(', ') || 'Worldwide (source claim)'
        : null,
      applicantCountries: codes.filter(Boolean),
      countryEvidence,
      timezoneRestrictions: Array.isArray(r.timezoneRestrictions)
        ? r.timezoneRestrictions.map(String)
        : null,
      updatedAt: date(r.pubDate),
      validThrough: date(r.expiryDate),
      employmentType: r.employmentType ?? null,
      compensation: r.currency
        ? {
            min: number(r.minSalary),
            max: number(r.maxSalary),
            currency: r.currency,
            unit: r.salaryPeriod ?? 'unknown',
          }
        : null,
      evidence: {
        url: sourceUrl,
        method: 'documented_job_board_api',
        parserVersion: PARSER_VERSION,
        observedAt: now,
      },
      attribution: 'Himalayas — https://himalayas.app',
    });
  }
  throw new Error('unsupported_adapter');
}
export async function pollSource(
  s: Source,
  read: Reader,
  options: { maxPages?: number; now?: string } = {},
): Promise<Poll> {
  const now = options.now ?? new Date().toISOString();
  const maxPages = Math.max(1, Math.min(20, Math.floor(options.maxPages ?? 20)));
  const jobs: Job[] = [];
  const diagnostics: string[] = [];
  let complete = true;
  const seen = new Set<string>();
  const append = (records: unknown[]) => {
    for (const r of records) {
      try {
        const j = normalize(s, r, now);
        if (!seen.has(j.externalId)) {
          jobs.push(j);
          seen.add(j.externalId);
        }
      } catch {
        complete = false;
        diagnostics.push('invalid_record_quarantined');
      }
    }
  };
  if (s.provider === 'greenhouse') {
    const data = await json(
      read,
      `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(s.board!)}/jobs?content=true`,
    );
    if (!Array.isArray(data.jobs)) throw new Error('invalid_source_envelope');
    append(data.jobs);
  } else if (s.provider === 'ashby') {
    const data = await json(
      read,
      `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(s.board!)}?includeCompensation=true`,
    );
    if (!Array.isArray(data.jobs)) throw new Error('invalid_source_envelope');
    append(data.jobs.filter((r: any) => r.isListed === true));
  } else if (s.provider === 'workable') {
    const data = await json(
      read,
      `https://www.workable.com/api/accounts/${encodeURIComponent(s.board!)}?details=true`,
    );
    if (!Array.isArray(data.jobs)) throw new Error('invalid_source_envelope');
    append(data.jobs);
  } else if (s.provider === 'lever') {
    let ended = false;
    for (let page = 0; page < maxPages; page++) {
      const data = await json(
        read,
        `https://api${s.region === 'eu' ? '.eu' : ''}.lever.co/v0/postings/${encodeURIComponent(s.board!)}?mode=json&skip=${page * 100}&limit=100`,
      );
      if (!Array.isArray(data)) throw new Error('invalid_source_envelope');
      if (!data.length) {
        ended = true;
        break;
      }
      const before = seen.size;
      append(data);
      if (seen.size === before) {
        complete = false;
        diagnostics.push('pagination_repeated');
        break;
      }
      if (data.length < 100) {
        ended = true;
        break;
      }
    }
    if (!ended) {
      complete = false;
      diagnostics.push('page_budget_reached');
    }
  } else if (s.provider === 'himalayas') {
    let ended = false;
    for (let page = 1; page <= maxPages; page++) {
      const url = new URL('https://himalayas.app/jobs/api/search');
      url.searchParams.set('q', s.query ?? '');
      url.searchParams.set('page', String(page));
      if (s.country) url.searchParams.set('country', s.country);
      const data = await json(read, url.toString());
      if (!Array.isArray(data.jobs)) throw new Error('invalid_source_envelope');
      if (!data.jobs.length) {
        ended = true;
        break;
      }
      const before = seen.size;
      append(data.jobs);
      if (seen.size === before) {
        complete = false;
        diagnostics.push('pagination_repeated');
        break;
      }
    }
    // Search/index absence is not closure evidence, even after paging the query.
    complete = false;
    diagnostics.push(ended ? 'query_results_not_authoritative_closure' : 'page_budget_reached');
  } else throw new Error('page_sources_use_crawler');
  return { jobs, complete, diagnostics: [...new Set(diagnostics)], observedAt: now };
}
export function sourceFromUrl(raw: string): Source | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split('/').filter(Boolean);
  let provider: Source['provider'] | undefined;
  let board: string | undefined;
  let region: 'us' | 'eu' = 'us';
  if (['boards.greenhouse.io', 'job-boards.greenhouse.io'].includes(host)) {
    provider = 'greenhouse';
    board = parts[0];
  } else if (host === 'jobs.ashbyhq.com') {
    provider = 'ashby';
    board = parts[0];
  } else if (['jobs.lever.co', 'jobs.eu.lever.co'].includes(host)) {
    provider = 'lever';
    board = parts[0];
    region = host.includes('.eu.') ? 'eu' : 'us';
  } else if (host === 'apply.workable.com') {
    provider = 'workable';
    board = parts[0];
  }
  if (!provider || !board || !/^[a-zA-Z0-9_-]{1,150}$/.test(board)) return null;
  return {
    id: `${provider}:${region}:${board}`,
    provider,
    board,
    region,
    company: `Employer board: ${board}`,
    url: raw,
    intervalMinutes: 360,
    enabled: true,
  };
}
export const contentHash = (j: Job) =>
  createHash('sha256')
    .update(JSON.stringify({ ...j, evidence: { ...j.evidence, observedAt: '' }, raw: undefined }))
    .digest('hex');
