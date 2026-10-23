import { describe, expect, it } from 'vitest';
import { evaluateEligibility, baselineFitScore, EligibilityInput } from './eligibility';

const baseProfile: EligibilityInput['profile'] = {
  work_authorization: [],
  desired_compensation: null,
  role_families: ['Software Engineer'],
  seniority: [],
  hard_exclusions: [],
};

describe('evaluateEligibility', () => {
  it('blocks on hard exclusions', () => {
    const res = evaluateEligibility({
      job: {
        title: 'Firmware Engineer',
        location: null,
        remote_restrictions: null,
        description: 'Boeing defense systems',
        compensation: null,
      },
      profile: { ...baseProfile, hard_exclusions: ['boeing'] },
    });
    expect(res.eligibility).toBe('INELIGIBLE');
    expect(res.hard_failures.length).toBeGreaterThan(0);
  });

  it('never silently passes when sponsorship is restrictive and authorization unverified', () => {
    const res = evaluateEligibility({
      job: {
        title: 'Software Engineer',
        location: null,
        remote_restrictions: null,
        description: 'We cannot provide visa sponsorship at this time.',
        compensation: null,
      },
      profile: baseProfile,
    });
    expect(res.eligibility).toBe('UNKNOWN');
  });

  it('does not reject an authorized citizen merely because sponsorship is unavailable', () => {
    const res = evaluateEligibility({
      job: {
        title: 'Software Engineer',
        location: 'United States',
        remote_restrictions: null,
        description: 'No sponsorship provided.',
        compensation: null,
      },
      profile: {
        ...baseProfile,
        work_authorization: [{ jurisdiction: 'US', status: 'CITIZEN', verified: true }],
      },
    });
    expect(res.eligibility).toBe('VERIFIED_ELIGIBLE');
  });

  it('UNKNOWN when role family does not match', () => {
    const res = evaluateEligibility({
      job: {
        title: 'Nurse Practitioner',
        location: null,
        remote_restrictions: null,
        description: null,
        compensation: null,
      },
      profile: baseProfile,
    });
    expect(res.eligibility).toBe('UNKNOWN');
  });

  it('VERIFIED_ELIGIBLE only with verified facts', () => {
    const res = evaluateEligibility({
      job: {
        title: 'Software Engineer',
        location: 'United States',
        remote_restrictions: null,
        description: 'build software',
        compensation: null,
      },
      profile: {
        ...baseProfile,
        work_authorization: [{ jurisdiction: 'US', status: 'CITIZEN', verified: true }],
      },
    });
    expect(res.eligibility).toBe('VERIFIED_ELIGIBLE');
  });

  it('UNKNOWN when only role relevance is established', () => {
    const res = evaluateEligibility({
      job: {
        title: 'Software Engineer',
        location: null,
        remote_restrictions: null,
        description: 'build software',
        compensation: null,
      },
      profile: baseProfile,
    });
    expect(res.eligibility).toBe('UNKNOWN');
  });
});

describe('baselineFitScore', () => {
  const profile = {
    skills: [
      { name: 'React', level: 'EXPERT' },
      { name: 'Rust', level: 'PROFICIENT' },
    ],
    role_families: ['Software Engineer'],
  };

  it('scores matching skills and role with rationale', () => {
    const res = baselineFitScore(
      { title: 'Senior Software Engineer', description: 'React + TypeScript product team' },
      profile,
    );
    expect(res.score).toBeGreaterThanOrEqual(22);
    expect(res.rationale).toContain('React');
  });

  it('returns 0 with evidence note when nothing matches', () => {
    const res = baselineFitScore(
      { title: 'Gas Pipeline Inspector', description: 'field inspections' },
      profile,
    );
    expect(res.score).toBe(0);
    expect(res.rationale).toContain('no direct skill evidence');
  });
});

describe('geographic safety regressions', () => {
  it('does not qualify a US-only remote role with unrelated Nigerian authorization', () => {
    const result = evaluateEligibility({
      job: {
        title: 'Software Engineer',
        location: 'United States',
        remote_restrictions: 'US residents only',
        description: 'Build systems',
        compensation: null,
      },
      profile: {
        ...baseProfile,
        work_authorization: [{ jurisdiction: 'NG', status: 'CITIZEN', verified: true }],
      },
    });
    expect(result.eligibility).toBe('UNKNOWN');
  });
  it('preserves hard exclusion failures even when visa language is ambiguous', () => {
    const result = evaluateEligibility({
      job: {
        title: 'Software Engineer',
        location: null,
        remote_restrictions: null,
        description: 'Defense. No sponsorship provided.',
        compensation: null,
      },
      profile: { ...baseProfile, hard_exclusions: ['Defense'] },
    });
    expect(result.eligibility).toBe('INELIGIBLE');
  });
  it('does not interpret positive sponsorship language as a restriction', () => {
    const result = evaluateEligibility({
      job: {
        title: 'Software Engineer',
        location: 'United States',
        remote_restrictions: null,
        description: 'Visa sponsorship provided.',
        compensation: null,
      },
      profile: {
        ...baseProfile,
        work_authorization: [{ jurisdiction: 'US', status: 'CITIZEN', verified: true }],
      },
    });
    expect(result.hard_failures).toEqual([]);
  });
  it('blocks a verified sponsorship requirement when the employer cannot sponsor', () => {
    const result = evaluateEligibility({
      job: {
        title: 'Software Engineer',
        location: 'United States',
        remote_restrictions: null,
        description: 'No sponsorship provided.',
        compensation: null,
      },
      profile: {
        ...baseProfile,
        work_authorization: [{ jurisdiction: 'US', status: 'NEEDS_SPONSORSHIP', verified: true }],
      },
    });
    expect(result.eligibility).toBe('INELIGIBLE');
  });
});
