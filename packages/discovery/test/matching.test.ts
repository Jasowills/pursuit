import { describe, it, expect } from 'vitest';
import { assess, expandRoles } from '../src/matching.js';
import { SearchProfile } from '../src/contracts.js';
import { job, profile } from './fixtures.js';
import { tokens, canonicalUrl } from '../src/text.js';
describe('evidence and uncertainty', () => {
  it('blocks a US-only remote listing for a confirmed Nigerian resident', () => {
    const a = assess(job({ applicantCountries: ['US'], countryEvidence: 'US only' }), profile());
    expect(a.eligibility).toBe('ineligible');
  });
  it('does not turn worldwide remote into confirmed work authorization', () => {
    const a = assess(job({ countryEvidence: 'Worldwide' }), profile());
    expect(a.eligibility).not.toBe('confirmed_eligible');
    expect(a.unknowns.join(' ')).toContain('work-authorization');
  });
  it('keeps missing location evidence unknown even with strong fit', () => {
    const a = assess(job(), profile());
    expect(a.fitScore).toBeGreaterThan(50);
    expect(a.eligibility).toBe('unknown');
  });
  it('returns actual candidate and job evidence for every skill match', () => {
    const a = assess(job(), profile());
    expect(a.fitEvidence).toHaveLength(2);
    for (const match of a.fitEvidence) {
      expect(match.candidateEvidence).toContain('resume#');
      expect(match.jobEvidence).toContain(match.requirement);
    }
  });
  it('enforces exclusions and comparable salary floors independently of fit', () => {
    const a = assess(
      job({
        company: 'Excluded Org',
        compensation: { min: 20, max: 30, currency: 'USD', unit: 'hour' },
      }),
      profile({
        exclusions: ['Excluded Org'],
        salaryFloor: { amount: 100000, currency: 'USD', unit: 'year' },
      }),
    );
    expect(a.eligibility).toBe('ineligible');
    expect(a.unknowns.join(' ')).toContain('pay period');
  });
  it('supports multiple occupations and preserves non-Latin and specialty tokens', () => {
    expect(expandRoles(['qa engineer'])).toContain('sdet');
    expect(expandRoles(['registered nurse'])).toContain('clinical nurse');
    expect(tokens('C++ C# 软件工程师')).toEqual(['c++', 'c#', '软件工程师']);
  });
  it('canonicalizes encoded query values idempotently', () => {
    const url = canonicalUrl('https://example.com/job?x=a%26b&utm_source=x');
    expect(canonicalUrl(url)).toBe(url);
    expect(new URL(url).searchParams.get('x')).toBe('a&b');
  });
});

it('does not inflate fit by counting duplicate candidate skill names twice', () => {
  const assessment = assess(
    job(),
    profile({
      skills: [
        { name: 'React', evidence: 'one' },
        { name: 'react', evidence: 'two' },
        { name: 'TypeScript', evidence: 'three' },
      ],
    }),
  );
  expect(assessment.fitEvidence).toHaveLength(2);
  expect(assessment.fitScore).toBeLessThanOrEqual(100);
});

describe('profile input bounds', () => {
  it('rejects unbounded skill evidence and oversized skill names', () => {
    const valid = profile();
    expect(() =>
      SearchProfile.parse({
        ...valid,
        skills: [{ name: 'React', evidence: 'e'.repeat(2001) }],
      }),
    ).toThrow();
    expect(() =>
      SearchProfile.parse({
        ...valid,
        skills: [{ name: 's'.repeat(151), evidence: 'resume#project-1' }],
      }),
    ).toThrow();
  });

  it('caps exclusion count and length before matching scans role text', () => {
    const valid = profile();
    expect(() => SearchProfile.parse({ ...valid, exclusions: ['x'.repeat(201)] })).toThrow();
    expect(() =>
      SearchProfile.parse({ ...valid, exclusions: Array(101).fill('company') }),
    ).toThrow();
  });

  it('caps work-authorization records while retaining the supported maximum', () => {
    const valid = profile();
    const record = { country: 'NG', status: 'authorized', verified: true };
    expect(() =>
      SearchProfile.parse({ ...valid, workAuthorization: Array(51).fill(record) }),
    ).toThrow();
    expect(
      SearchProfile.parse({ ...valid, workAuthorization: Array(50).fill(record) })
        .workAuthorization,
    ).toHaveLength(50);
  });
});
