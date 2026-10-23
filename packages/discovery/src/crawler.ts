import { createHash } from 'node:crypto';
import { parse } from 'parse5';
import { Job, type Poll, type Reader, type Source } from './contracts.js';
import { countryCode, PARSER_VERSION, sourceFromUrl } from './adapters.js';
import { plain, httpUrl, iso, canonicalUrl } from './text.js';
const arr = (x: any) => (x == null ? [] : Array.isArray(x) ? x : [x]);
function walk(node: any, visit: (node: any) => void) {
  const queue = [node];
  let count = 0;
  while (queue.length) {
    if (++count > 100000) throw new Error('html_node_budget');
    const n = queue.pop();
    visit(n);
    for (const child of n.childNodes ?? []) queue.push(child);
  }
}
function attribute(node: any, name: string): string | undefined {
  return node.attrs?.find((a: any) => a.name === name)?.value;
}
export function robotsAllows(body: string, path: string): boolean {
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let group: (typeof groups)[number] | null = null;
  let hasRules = false;
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const i = line.indexOf(':');
    if (i < 0) continue;
    const key = line.slice(0, i).trim().toLowerCase();
    const value = line.slice(i + 1).trim();
    if (key === 'user-agent') {
      if (!group || hasRules) {
        group = { agents: [], rules: [] };
        groups.push(group);
        hasRules = false;
      }
      group.agents.push(value.toLowerCase());
    } else if (group && ['allow', 'disallow'].includes(key)) {
      hasRules = true;
      if (value) group.rules.push({ allow: key === 'allow', path: value });
    }
  }
  const specific = groups.filter((g) =>
    g.agents.some((a) => a !== '*' && 'pursuitdiscovery'.includes(a)),
  );
  const selected = specific.length ? specific : groups.filter((g) => g.agents.includes('*'));
  let best = -1;
  let allowed = true;
  for (const g of selected)
    for (const r of g.rules) {
      const pattern = r.path.replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      if (new RegExp('^' + pattern).test(path)) {
        const length = r.path.replace(/\*/g, '').length;
        if (length > best || (length === best && r.allow)) {
          best = length;
          allowed = r.allow;
        }
      }
    }
  return allowed;
}
export async function permittedPage(
  read: Reader,
  raw: string,
  options: { accept?: string; types?: RegExp } = {},
): Promise<string> {
  const url = new URL(canonicalUrl(raw));
  const robots = await read(new URL('/robots.txt', url).toString(), {
    accept: 'text/plain',
    sameOriginOnly: true,
  });
  if (
    robots.status !== 404 &&
    (!(robots.status >= 200 && robots.status < 300) ||
      !robotsAllows(robots.body, url.pathname + url.search))
  )
    throw new Error('robots_unavailable_or_disallowed');
  const result = await read(url.toString(), {
    accept: options.accept ?? 'text/html,application/xhtml+xml',
    sameOriginOnly: true,
  });
  if (result.status !== 200) throw new Error(`page_http_${result.status}`);
  const type = result.headers['content-type'] ?? '';
  if (type && !(options.types ?? /html|json/i).test(type))
    throw new Error('unsupported_page_content_type');
  return result.body;
}
export function extractJobPosting(html: string, url: string, source: Source, now: string): Poll {
  const root = parse(html);
  const records: any[] = [];
  const diagnostics: string[] = [];
  function collect(value: any) {
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (arr(value['@type']).some((t) => typeof t === 'string' && /(^|[/#])JobPosting$/.test(t)))
      records.push(value);
    if (value['@graph']) collect(value['@graph']);
    if (value.itemListElement)
      for (const item of arr(value.itemListElement)) collect(item.item ?? item);
  }
  walk(root, (n) => {
    if (
      n.nodeName === 'script' &&
      (attribute(n, 'type') ?? '').toLowerCase() === 'application/ld+json'
    ) {
      try {
        collect(JSON.parse((n.childNodes ?? []).map((v: any) => v.value ?? '').join('')));
      } catch {
        diagnostics.push('invalid_jsonld_quarantined');
      }
    }
  });
  const jobs: Job[] = [];
  for (const r of records) {
    try {
      const rawCountries = arr(r.applicantLocationRequirements);
      const countryObjects = rawCountries.filter(
        (c: any) => typeof c === 'string' || c['@type'] === 'Country',
      );
      const codes = countryObjects.map((c: any) =>
        countryCode(typeof c === 'string' ? c : (c.name ?? c.identifier)),
      );
      const proposedApply = httpUrl(r.url ?? url);
      const applyUrl =
        proposedApply && new URL(proposedApply).origin === new URL(url).origin
          ? proposedApply
          : null;
      // Employer-owned detail links retain requisition identity on list pages. A
      // third-party URL cannot impersonate another employer's primary source.
      const sourceUrl = canonicalUrl(applyUrl ?? url);
      if (records.length > 1 && (!applyUrl || sourceUrl === canonicalUrl(url))) {
        diagnostics.push('job_list_missing_distinct_detail_url');
        continue;
      }
      const remote = r.jobLocationType === 'TELECOMMUTE';
      const location =
        arr(r.jobLocation)
          .map((l: any) =>
            [l.address?.addressLocality, l.address?.addressRegion, l.address?.addressCountry]
              .map((v: any) => (typeof v === 'string' ? v : v?.name))
              .filter(Boolean)
              .join(', '),
          )
          .filter(Boolean)
          .join(' / ') || null;
      const salary = r.baseSalary?.value;
      const employer =
        typeof r.hiringOrganization?.name === 'string' ? r.hiringOrganization.name : source.company;
      const identifier = typeof r.identifier === 'string' ? r.identifier : r.identifier?.value;
      jobs.push(
        Job.parse({
          provider: 'page',
          sourceId: source.id,
          externalId: String(
            identifier ??
              createHash('sha256')
                .update(sourceUrl + '\0' + r.title + '\0' + (location ?? ''))
                .digest('hex'),
          ),
          title: r.title,
          company: employer,
          sourceUrl,
          applyUrl,
          description: plain(r.description ?? ''),
          location,
          workplace: remote ? 'remote' : 'unknown',
          applicantCountries: codes.filter(Boolean),
          countryEvidence:
            rawCountries.length && codes.length === rawCountries.length && codes.every(Boolean)
              ? 'Explicit applicantLocationRequirements in employer JobPosting'
              : null,
          timezoneRestrictions: null,
          raw: r,
          publishedAt: iso(r.datePosted),
          updatedAt: iso(r.dateModified),
          validThrough: iso(r.validThrough),
          compensation:
            salary && r.baseSalary?.currency
              ? {
                  min:
                    typeof salary.minValue === 'number'
                      ? salary.minValue
                      : typeof salary.value === 'number'
                        ? salary.value
                        : null,
                  max: typeof salary.maxValue === 'number' ? salary.maxValue : null,
                  currency: r.baseSalary.currency,
                  unit: salary.unitText ?? 'unknown',
                }
              : null,
          employmentType: arr(r.employmentType).join(', ') || null,
          kind: 'vacancy',
          evidence: {
            url,
            method: 'employer_jobposting_jsonld',
            parserVersion: PARSER_VERSION,
            observedAt: now,
          },
          attribution: null,
        }),
      );
    } catch {
      diagnostics.push('invalid_jobposting_quarantined');
    }
  }
  if (!jobs.length) diagnostics.push('no_supported_jobposting_markup');
  return { jobs, complete: false, diagnostics, observedAt: now };
}
export function discoverLinks(
  html: string,
  base: string,
): { url: string; source: Source | null }[] {
  const results = new Map<string, { url: string; source: Source | null }>();
  const root = parse(html);
  const origin = new URL(base).origin;
  walk(root, (n) => {
    if (n.nodeName !== 'a') return;
    const href = attribute(n, 'href');
    if (!href) return;
    try {
      const url = canonicalUrl(new URL(href, base).toString());
      const source = sourceFromUrl(url);
      if (
        source ||
        (new URL(url).origin === origin &&
          /careers?|jobs?|positions?|vacanc|openings?/i.test(new URL(url).pathname))
      )
        results.set(url, { url, source });
    } catch {}
  });
  return [...results.values()].slice(0, 100);
}
