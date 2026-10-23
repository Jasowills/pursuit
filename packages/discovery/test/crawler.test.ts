import { describe, it, expect } from 'vitest';
import { robotsAllows, extractJobPosting, discoverLinks, permittedPage } from '../src/crawler.js';
import { source, reader } from './fixtures.js';
import { publicAddress, resolvePublic } from '../src/transport.js';
describe('bounded public extraction', () => {
  it('honors longest robots rule and specific user-agent', () => {
    const body =
      'User-agent: *\nDisallow: /private\nAllow: /private/jobs\nUser-agent: PursuitDiscovery\nDisallow: /blocked';
    expect(robotsAllows(body, '/blocked')).toBe(false);
    expect(
      robotsAllows('User-agent: *\nDisallow: /private\nAllow: /private/jobs', '/private/jobs/1'),
    ).toBe(true);
  });
  it('does not execute scripts and parses graph-wrapped job evidence', () => {
    const raw = {
      '@graph': [
        {
          '@type': 'JobPosting',
          title: 'Nurse',
          description: '<b>Clinical care</b>',
          url: 'https://example.com/jobs/1',
          hiringOrganization: { name: 'Hospital' },
          applicantLocationRequirements: [{ '@type': 'Country', name: 'Nigeria' }],
        },
      ],
    };
    const html = `<script>throw new Error('must not execute')</script><script type="application/ld+json">${JSON.stringify(raw)}</script>`;
    const result = extractJobPosting(
      html,
      'https://example.com/jobs/1',
      source('page'),
      new Date().toISOString(),
    );
    expect(result.jobs[0]?.description).toBe('Clinical care');
    expect(result.jobs[0]?.applicantCountries).toEqual(['NG']);
    expect(result.complete).toBe(false);
  });
  it('ignores non-job marketing pages and malformed markup without inventing vacancies', () => {
    const result = extractJobPosting(
      '<h1>We are growing</h1>',
      'https://example.com',
      source('page'),
      new Date().toISOString(),
    );
    expect(result.jobs).toHaveLength(0);
    expect(result.complete).toBe(false);
  });
  it('discovers same-site career links and exact supported board hosts only', () => {
    const links = discoverLinks(
      '<a href="/careers">Careers</a><a href="https://jobs.lever.co/acme">Jobs</a><a href="https://other.test/blog">No</a>',
      'https://example.com',
    );
    expect(links).toHaveLength(2);
    expect(links[1]?.source?.board ?? links[0]?.source?.board).toBe('acme');
  });
  it.each([
    '127.0.0.1',
    '10.1.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '::1',
    'fc00::1',
    '::ffff:127.0.0.1',
    '224.0.0.1',
  ])('rejects non-public network target %s', (ip) => expect(publicAddress(ip)).toBe(false));
  it('allows public unicast only and blocks unsafe URL schemes/credentials before DNS', async () => {
    expect(publicAddress('8.8.8.8')).toBe(true);
    await expect(resolvePublic('file:///etc/passwd')).rejects.toThrow();
    await expect(resolvePublic('https://user:secret@example.com')).rejects.toThrow();
    await expect(resolvePublic('http://localhost/x')).rejects.toThrow();
  });
});

it('does not let JSON-LD impersonate a job on another employer domain', () => {
  const html =
    '<script type="application/ld+json">{"@type":"JobPosting","title":"Impersonated","url":"https://employer.test/job/real","description":"Untrusted"}</script>';
  const result = extractJobPosting(
    html,
    'https://attacker.test/page',
    source('page'),
    new Date().toISOString(),
  );
  expect(result.jobs[0]?.sourceUrl).toBe('https://attacker.test/page');
  expect(result.jobs[0]?.applyUrl).toBeNull();
});

it('keeps distinct employer detail URLs from a structured list page', () => {
  const records = ['one', 'two'].map((id) => ({
    '@type': 'JobPosting',
    identifier: id,
    title: 'Software Engineer',
    url: `https://example.com/jobs/${id}`,
    description: 'Build services.',
  }));
  const result = extractJobPosting(
    `<script type="application/ld+json">${JSON.stringify(records)}</script>`,
    'https://example.com/careers',
    source('page'),
    new Date().toISOString(),
  );
  expect(result.jobs.map((j) => j.sourceUrl)).toEqual([
    'https://example.com/jobs/one',
    'https://example.com/jobs/two',
  ]);
  expect(result.jobs.every((j) => j.evidence.url === 'https://example.com/careers')).toBe(true);
});
