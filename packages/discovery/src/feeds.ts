import { XMLParser } from 'fast-xml-parser';
import { createHash } from 'node:crypto';
import { Job, type Poll, type Reader, type Source } from './contracts.js';
import { permittedPage } from './crawler.js';
import { plain, httpUrl, iso } from './text.js';
import { PARSER_VERSION } from './adapters.js';
const list = (v: any) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const text = (v: any): string =>
  typeof v === 'string'
    ? v
    : typeof v?.['#text'] === 'string'
      ? v['#text']
      : typeof v?.['#cdata'] === 'string'
        ? v['#cdata']
        : '';
export function extractFeed(xml: string, source: Source, now: string): Poll {
  if (xml.length > 1_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error('unsafe_or_oversized_xml');
  const parsed = new XMLParser({
    ignoreAttributes: false,
    processEntities: false,
    cdataPropName: '#cdata',
    parseTagValue: false,
  }).parse(xml);
  const records = list(parsed.rss?.channel?.item ?? parsed.feed?.entry);
  const jobs: Job[] = [];
  const diagnostics: string[] = [];
  for (const r of records.slice(0, 200)) {
    try {
      const atomLink = list(r.link).find(
        (v: any) => v?.['@_href'] && (!v['@_rel'] || v['@_rel'] === 'alternate'),
      );
      const url = httpUrl(atomLink?.['@_href'] ?? text(r.link));
      if (!url) {
        diagnostics.push('feed_item_without_public_url');
        continue;
      }
      const title = plain(text(r.title));
      const description = plain(
        text(r['content:encoded']) || text(r.content) || text(r.description) || text(r.summary),
      );
      const id = text(r.guid) || text(r.id) || url;
      jobs.push(
        Job.parse({
          provider: 'feed',
          sourceId: source.id,
          externalId: id,
          title,
          company: 'Employer not verified',
          sourceUrl: url,
          applyUrl: null,
          description,
          location: null,
          workplace: 'unknown',
          applicantCountries: [],
          countryEvidence: null,
          timezoneRestrictions: null,
          raw: r,
          publishedAt: iso(text(r.pubDate) || text(r.published)),
          updatedAt: iso(text(r.updated)),
          validThrough: null,
          compensation: null,
          employmentType: null,
          kind: 'hiring_lead',
          evidence: {
            url: source.url!,
            method: 'published_rss_or_atom',
            parserVersion: PARSER_VERSION,
            observedAt: now,
          },
          attribution: `${source.company} — ${source.url}`,
        }),
      );
    } catch {
      diagnostics.push('invalid_feed_item_quarantined');
    }
  }
  return {
    jobs,
    complete: false,
    diagnostics: [...new Set([...diagnostics, 'feed_window_not_authoritative_closure'])],
    observedAt: now,
  };
}
export async function pollFeed(source: Source, read: Reader): Promise<Poll> {
  const body = await permittedPage(read, source.url!, {
    accept: 'application/rss+xml,application/atom+xml,application/xml,text/xml',
    types: /xml|rss|atom|text\/plain/i,
  });
  return extractFeed(body, source, new Date().toISOString());
}
export async function pollHackerNews(
  source: Source,
  read: Reader,
  maxComments = 20,
): Promise<Poll> {
  const get = async (path: string) => {
    const r = await read(`https://hacker-news.firebaseio.com/v0/${path}.json`);
    if (r.status !== 200) throw new Error(`hn_http_${r.status}`);
    return JSON.parse(r.body);
  };
  let thread: any;
  if (source.board && /^\d+$/.test(source.board)) thread = await get(`item/${source.board}`);
  else {
    const user = await get('user/whoishiring');
    for (const id of (user.submitted ?? []).slice(0, 12)) {
      const item = await get(`item/${id}`);
      if (item?.by === 'whoishiring' && /^Ask HN: Who is hiring\?/i.test(item.title ?? '')) {
        thread = item;
        break;
      }
    }
  }
  if (
    !thread ||
    thread.type !== 'story' ||
    thread.by !== 'whoishiring' ||
    !/^Ask HN: Who is hiring\?/i.test(thread.title ?? '') ||
    !Array.isArray(thread.kids)
  )
    throw new Error('hiring_thread_not_found');
  const now = new Date().toISOString();
  const jobs: Job[] = [];
  for (const id of thread.kids.slice(0, maxComments)) {
    const item = await get(`item/${id}`);
    if (!item || item.deleted || item.dead || typeof item.text !== 'string') continue;
    const body = plain(item.text);
    if (!body) continue;
    const url = `https://news.ycombinator.com/item?id=${item.id}`;
    jobs.push(
      Job.parse({
        provider: 'hackernews',
        sourceId: source.id,
        externalId: String(item.id),
        title: body.slice(0, 160),
        company: 'Employer not verified',
        sourceUrl: url,
        applyUrl: null,
        description: body,
        location: null,
        workplace: 'unknown',
        applicantCountries: [],
        countryEvidence: null,
        timezoneRestrictions: null,
        raw: item,
        publishedAt:
          typeof item.time === 'number' ? new Date(item.time * 1000).toISOString() : null,
        updatedAt: null,
        validThrough: null,
        compensation: null,
        employmentType: null,
        kind: 'hiring_lead',
        evidence: {
          url,
          method: 'public_hn_hiring_thread',
          parserVersion: PARSER_VERSION,
          observedAt: now,
        },
        attribution: `Hacker News comment by ${item.by ?? 'unknown'} — ${url}`,
      }),
    );
  }
  return {
    jobs,
    complete: false,
    diagnostics: [
      'unstructured_hiring_leads_require_employer_verification',
      ...(thread.kids.length > maxComments ? ['comment_budget_reached'] : []),
    ],
    observedAt: now,
  };
}
