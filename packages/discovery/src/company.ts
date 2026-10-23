import { parse } from 'parse5';
import type { Reader } from './contracts.js';
import { permittedPage } from './crawler.js';
import { plain, httpUrl } from './text.js';
export type PersonLead = {
  name: string;
  role: string;
  sourceUrl: string;
  observedAt: string;
  status: 'published_unverified';
  channels: { kind: 'linkedin' | 'x' | 'email' | 'profile'; value: string }[];
};
export async function researchCompany(raw: string, expectedName: string, read: Reader) {
  const base = new URL(raw);
  if (base.protocol !== 'https:' || base.username || base.password)
    throw new Error('unsafe_company_url');
  const pending = [base.toString()];
  const seen = new Set<string>();
  const people: PersonLead[] = [];
  let summary = '';
  let summarySource = base.toString();
  const observedAt = new Date().toISOString();
  while (pending.length && seen.size < 3) {
    const url = pending.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    let html: string;
    try {
      html = await permittedPage(read, url);
    } catch {
      continue;
    }
    const queue: any[] = [parse(html)];
    let visited = 0;
    while (queue.length) {
      if (++visited > 100000) throw new Error('company_page_node_budget');
      const node = queue.pop();
      const attr = (name: string) => node.attrs?.find((a: any) => a.name === name)?.value;
      if (
        node.nodeName === 'meta' &&
        ['description', 'og:description'].includes(attr('name') ?? attr('property')) &&
        !summary
      ) {
        summary = plain(attr('content') ?? '').slice(0, 1000);
        summarySource = url;
      }
      if (node.nodeName === 'a') {
        try {
          const link = new URL(attr('href'), url);
          if (
            link.origin === base.origin &&
            /\/(?:about|team|company|careers)(?:\/|$)/.test(link.pathname) &&
            !seen.has(link.toString()) &&
            pending.length < 6
          )
            pending.push(link.toString());
        } catch {}
      }
      if (node.nodeName === 'script' && attr('type') === 'application/ld+json') {
        try {
          const values: any[] = [
            JSON.parse((node.childNodes ?? []).map((n: any) => n.value ?? '').join('')),
          ];
          let records = 0;
          while (values.length) {
            if (++records > 1000) break;
            const item = values.pop();
            if (Array.isArray(item)) {
              values.push(...item);
              continue;
            }
            if (!item || typeof item !== 'object') continue;
            if (item['@graph']) values.push(item['@graph']);
            if (item.employee) values.push(item.employee);
            if (
              item['@type'] !== 'Person' ||
              typeof item.name !== 'string' ||
              typeof item.jobTitle !== 'string'
            )
              continue;
            const channels: PersonLead['channels'] = [];
            for (const value of [
              item.url,
              ...(Array.isArray(item.sameAs) ? item.sameAs : [item.sameAs]),
            ]) {
              const u = httpUrl(value);
              if (!u) continue;
              const link = new URL(u);
              if (
                (link.hostname === 'linkedin.com' || link.hostname.endsWith('.linkedin.com')) &&
                /^\/in\//.test(link.pathname)
              )
                channels.push({ kind: 'linkedin', value: u });
              else if (
                ['x.com', 'twitter.com'].includes(link.hostname) &&
                /^\/[A-Za-z0-9_]{1,15}\/?$/.test(link.pathname)
              )
                channels.push({ kind: 'x', value: u });
              else if (link.origin === base.origin) channels.push({ kind: 'profile', value: u });
            }
            if (
              typeof item.email === 'string' &&
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email.replace(/^mailto:/, ''))
            )
              channels.push({ kind: 'email', value: item.email.replace(/^mailto:/, '') });
            if (
              channels.length &&
              !people.some((p) => p.name === item.name && p.role === item.jobTitle)
            )
              people.push({
                name: item.name.slice(0, 200),
                role: item.jobTitle.slice(0, 300),
                sourceUrl: url,
                observedAt,
                status: 'published_unverified',
                channels,
              });
          }
        } catch {}
      }
      for (const child of node.childNodes ?? []) queue.push(child);
    }
  }
  return {
    company: expectedName,
    siteUrl: base.toString(),
    summary: summary ? { quote: summary, sourceUrl: summarySource, observedAt } : null,
    people: people.slice(0, 20),
    checkedUrls: [...seen],
    notice:
      'Company association, current employment and channel ownership require review. Publicly listed does not mean verified contact or deliverable email. No profile was scraped and no address was guessed.',
  };
}
