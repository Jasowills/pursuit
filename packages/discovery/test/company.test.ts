import { it, expect } from 'vitest';
import { researchCompany } from '../src/company.js';
it('retains published people and source quotes without inventing addresses or scraping profiles', async () => {
  const seen: string[] = [];
  const result = await researchCompany('https://example.com', 'Example', async (url) => {
    seen.push(url);
    return {
      status: 200,
      url,
      headers: { 'content-type': url.endsWith('robots.txt') ? 'text/plain' : 'text/html' },
      body: url.endsWith('robots.txt')
        ? 'User-agent: *\nAllow: /'
        : `<meta name="description" content="We build reporting software."><script type="application/ld+json">{"@type":"Person","name":"Priya Shah","jobTitle":"Recruiter","sameAs":["https://linkedin.com/in/priya","https://evillinkedin.com/in/spoof"]}</script>`,
    };
  });
  expect(result.people[0]?.name).toBe('Priya Shah');
  expect(result.people[0]?.channels).toEqual([
    { kind: 'linkedin', value: 'https://linkedin.com/in/priya' },
  ]);
  expect(result.people[0]?.status).toBe('published_unverified');
  expect(seen.every((u) => new URL(u).hostname === 'example.com')).toBe(true);
  expect(result.summary?.quote).toBe('We build reporting software.');
});
it('does not fabricate contacts when a company page publishes none', async () => {
  const result = await researchCompany('https://example.com', 'Example', async (url) => ({
    status: 200,
    url,
    headers: { 'content-type': url.endsWith('robots.txt') ? 'text/plain' : 'text/html' },
    body: url.endsWith('robots.txt') ? 'User-agent: *\nAllow: /' : '<h1>We are hiring</h1>',
  }));
  expect(result.people).toEqual([]);
});
