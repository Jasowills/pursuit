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

  it('returns INELIGIBLE when verified authorization conflicts with sponsorship restriction', () => {
    const res = evaluateEligibility({
      job: {
        title: 'Software Engineer',
        location: null,
        remote_restrictions: null,
        description: 'No sponsorship provided.',
        compensation: null,
      },
      profile: {
        ...baseProfile,
        work_authorization: [{ jurisdiction: 'US', status: 'CITIZEN', verified: true }],
      },
    });
    expect(res.eligibility).toBe('INELIGIBLE');
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
        location: null,
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

  it('POSSIBLY_ELIGIBLE without verified evidence but matching family', () => {
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
    expect(res.eligibility).toBe('POSSIBLY_ELIGIBLE');
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
