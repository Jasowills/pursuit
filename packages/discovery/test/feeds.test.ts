import { it, expect } from 'vitest';
import { extractFeed, pollHackerNews } from '../src/feeds.js';
import { Source } from '../src/contracts.js';
import { reader } from './fixtures.js';
const source = Source.parse({
  id: 'feed:test',
  provider: 'feed',
  company: 'Public hiring feed',
  url: 'https://example.com/feed',
});
it('imports RSS records as unverified leads, retaining timestamps and provenance', () => {
  const xml =
    '<rss><channel><item><guid>x</guid><title>Hiring a designer</title><link>https://example.com/jobs/x</link><description><![CDATA[<p>We are hiring.</p>]]></description><pubDate>Thu, 22 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>';
  const result = extractFeed(xml, source, new Date().toISOString());
  expect(result.jobs[0]?.kind).toBe('hiring_lead');
  expect(result.jobs[0]?.description).toBe('We are hiring.');
  expect(result.jobs[0]?.applyUrl).toBeNull();
  expect(result.complete).toBe(false);
});
it('supports Atom alternate links without interpreting feed disappearance as closure', () => {
  const xml =
    '<feed><entry><id>tag:example,2026:1</id><title>New roles</title><link rel="alternate" href="https://example.com/jobs/1"/><summary>Hiring</summary><updated>2026-10-22T00:00:00Z</updated></entry></feed>';
  expect(extractFeed(xml, source, new Date().toISOString()).jobs).toHaveLength(1);
});
it('blocks XML entities/DTD and does not turn missing links into invented URLs', () => {
  expect(() =>
    extractFeed(
      '<!DOCTYPE x [<!ENTITY secret SYSTEM "file:///etc/passwd">]><rss/>',
      source,
      new Date().toISOString(),
    ),
  ).toThrow();
  expect(
    extractFeed(
      '<rss><channel><item><title>Missing link</title></item></channel></rss>',
      source,
      new Date().toISOString(),
    ).jobs,
  ).toHaveLength(0);
});
it('reads a bounded HN hiring thread, skips removed comments and never calls the result a verified vacancy', async () => {
  const hn = Source.parse({
    id: 'hn:test',
    provider: 'hackernews',
    board: '1',
    company: 'Hacker News',
  });
  let count = 0;
  const result = await pollHackerNews(
    hn,
    reader((url) => {
      count++;
      if (url.includes('/item/1.json'))
        return {
          id: 1,
          type: 'story',
          by: 'whoishiring',
          title: 'Ask HN: Who is hiring? (October 2026)',
          kids: [2, 3, 4],
        };
      if (url.includes('/item/2.json'))
        return {
          id: 2,
          text: 'Acme | Engineer | <a href="https://example.com/jobs">Jobs</a>',
          by: 'hiring',
          time: 1700000000,
        };
      return { deleted: true };
    }),
    2,
  );
  expect(result.jobs).toHaveLength(1);
  expect(result.jobs[0]?.kind).toBe('hiring_lead');
  expect(result.complete).toBe(false);
  expect(count).toBe(3);
  expect(result.diagnostics).toContain('comment_budget_reached');
});
