import { describe, it, expect } from 'vitest';
import { pollSource, normalize, sourceFromUrl } from '../src/adapters.js';
import { source, reader } from './fixtures.js';
const gh = (id: number) => ({
  id,
  title: 'Designer',
  absolute_url: `https://example.com/jobs/${id}`,
  location: { name: 'London' },
  content: '<p>Design products.</p>',
});
describe('source contracts', () => {
  it('imports the complete Greenhouse response rather than the first 25', async () => {
    const result = await pollSource(
      source(),
      reader(() => ({ jobs: Array.from({ length: 60 }, (_, i) => gh(i)) })),
    );
    expect(result.jobs).toHaveLength(60);
    expect(result.complete).toBe(true);
  });
  it('quarantines malformed records and forbids closure from that poll', async () => {
    const result = await pollSource(
      source(),
      reader(() => ({ jobs: [gh(1), { title: 'Missing identity' }] })),
    );
    expect(result.jobs).toHaveLength(1);
    expect(result.complete).toBe(false);
  });
  it('keeps unlisted Ashby postings out of discovery', async () => {
    const r = {
      id: 'x',
      title: 'Designer',
      jobUrl: 'https://example.com/jobs/1',
      applyUrl: 'https://example.com/apply',
      descriptionPlain: 'Design',
      isListed: true,
    };
    const result = await pollSource(
      source('ashby'),
      reader(() => ({ jobs: [r, { ...r, id: 'hidden', isListed: false }] })),
    );
    expect(result.jobs.map((j) => j.externalId)).toEqual(['x']);
  });
  it('pages Lever with its region and retains legitimate same-title jobs', async () => {
    const result = await pollSource(
      { ...source('lever'), region: 'eu' },
      reader((url) => {
        expect(url).toContain('api.eu.lever.co');
        return url.includes('skip=0')
          ? Array.from({ length: 100 }, (_, i) => ({
              id: String(i),
              text: 'Engineer',
              hostedUrl: `https://example.com/jobs/${i}`,
            }))
          : [{ id: '101', text: 'Engineer', hostedUrl: 'https://example.com/jobs/101' }];
      }),
    );
    expect(result.jobs).toHaveLength(101);
    expect(result.complete).toBe(true);
  });
  it('marks capped/repeating pagination partial rather than authoritative empty', async () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      text: 'Engineer',
      hostedUrl: `https://example.com/${i}`,
    }));
    const result = await pollSource(
      source('lever'),
      reader(() => rows),
      { maxPages: 2 },
    );
    expect(result.complete).toBe(false);
    expect(result.diagnostics).toContain('pagination_repeated');
  });
  it('preserves Himalayas expiry, attribution and exact application URL without inventing posted date', () => {
    const row = {
      guid: 'https://himalayas.app/companies/fixture/jobs/engineer',
      title: 'Engineer',
      companyName: 'Fixture',
      applicationLink: 'https://example.com/apply?utm_source=himalayas',
      locationRestrictions: [{ alpha2: 'NG', name: 'Nigeria' }],
      timezoneRestrictions: ['UTC+1'],
      pubDate: 1700000000,
      expiryDate: 1900000000,
    };
    const j = normalize(source('himalayas'), row, new Date().toISOString());
    expect(j.applicantCountries).toEqual(['NG']);
    expect(j.publishedAt).toBeNull();
    expect(j.updatedAt).not.toBeNull();
    expect(j.applyUrl).toBe(row.applicationLink);
    expect(j.attribution).toContain('Himalayas');
  });
  it('keeps missing or unrecognized geographic restrictions unknown', () => {
    const row = { guid: 'https://himalayas.app/x', title: 'Engineer', companyName: 'Fixture' };
    expect(
      normalize(source('himalayas'), row, new Date().toISOString()).countryEvidence,
    ).toBeNull();
    expect(
      normalize(
        source('himalayas'),
        { ...row, locationRestrictions: ['Europe'] },
        new Date().toISOString(),
      ).countryEvidence,
    ).toBeNull();
  });
  it('does not infer closure from a finished search query', async () => {
    let call = 0;
    const result = await pollSource(
      source('himalayas'),
      reader(() => ({
        jobs: call++
          ? []
          : [{ guid: 'https://himalayas.app/x', title: 'Designer', companyName: 'Fixture' }],
      })),
    );
    expect(result.jobs).toHaveLength(1);
    expect(result.complete).toBe(false);
  });
  it('recognizes only supported public board hosts', () => {
    expect(sourceFromUrl('https://jobs.ashbyhq.com/acme/uuid')?.board).toBe('acme');
    expect(sourceFromUrl('https://jobs.ashbyhq.com.attacker.test/acme')).toBeNull();
    expect(sourceFromUrl('https://jobs.eu.lever.co/acme/x')?.region).toBe('eu');
  });
});
