/**
 * Eligibility / qualification rules (PRD: hard constraints first, then
 * explainable weighted fit score; UNKNOWN never silently passes).
 * Keyword-based placeholder fit — replaced by AI fit analysis in M2 (kept
 * deterministic for tests until then).
 */

import { normalizeRoleTitle } from './dedupe';

export interface EligibilityInput {
  job: {
    title: string;
    location: string | null;
    remote_restrictions: string | null;
    description: string | null;
    compensation: string | null;
  };
  profile: {
    work_authorization: { jurisdiction: string; status: string; verified: boolean }[];
    desired_compensation: { min_amount: number; currency: string } | null;
    role_families: string[];
    seniority: string[];
    hard_exclusions: string[];
  };
}

export interface EligibilityResult {
  eligibility: 'VERIFIED_ELIGIBLE' | 'POSSIBLY_ELIGIBLE' | 'UNKNOWN' | 'INELIGIBLE';
  hard_failures: string[];
  eligibility_evidence: string[];
}

/** Hard-rule eligibility evaluation. Returns INELIGIBLE with reasons when a
 * hard constraint fails; UNKNOWN when evidence is absent; VERIFIED_ELIGIBLE
 * only from verified facts; POSSIBLY_ELIGIBLE otherwise. */
export function evaluateEligibility(input: EligibilityInput): EligibilityResult {
  const hard_failures: string[] = [];
  const eligibility_evidence: string[] = [];

  const haystack = [
    input.job.title,
    input.job.location ?? '',
    input.job.description ?? '',
    input.job.compensation ?? '',
  ]
    .join(' \n ')
    .toLowerCase();

  // hard exclusions — user-set, never overridden
  for (const exclusion of input.profile.hard_exclusions) {
    if (haystack.includes(exclusion.toLowerCase())) {
      hard_failures.push(`matches_hard_exclusion:${exclusion}`);
    }
  }

  // work authorization: verified facts are authoritative
  const hasVerifiedAuth = input.profile.work_authorization.some((a) => a.verified);
  const mentionsRestrictiveVisa =
    /sponsor(?:ship|s)?\s+(?:not\s+)?(?:provided|available)|no\s+sponsorship|requires?\s+sponsorship|cannot\s+provide\s+(?:visa\s+)?sponsorship/.test(
      haystack,
    );
  if (hasVerifiedAuth) {
    eligibility_evidence.push('work_authorization_verified');
    if (mentionsRestrictiveVisa) {
      hard_failures.push('mentions_unavailable_sponsorship_with_verified_restriction');
    }
  } else if (mentionsRestrictiveVisa) {
    // cannot decide — never silently pass
    return {
      eligibility: 'UNKNOWN',
      hard_failures,
      eligibility_evidence: ['restrictive_visa_language_without_verified_profile'],
    };
  }

  if (hard_failures.length > 0) {
    return { eligibility: 'INELIGIBLE', hard_failures, eligibility_evidence };
  }

  // role family relevance
  const roleHint = normalizeRoleTitle(input.job.title);
  const familyHit = input.profile.role_families.some((f) =>
    roleHint.includes(normalizeRoleTitle(f)),
  );
  if (input.profile.role_families.length > 0 && !familyHit) {
    eligibility_evidence.push('role_family_no_match');
    return {
      eligibility: 'UNKNOWN',
      hard_failures,
      eligibility_evidence,
    };
  }
  if (familyHit) {
    eligibility_evidence.push(`role_family_match:${roleHint}`);
  }

  // compensation is advisory, not a hard gate, unless profile has verified floor
  if (input.profile.desired_compensation && input.job.compensation) {
    const m = input.job.compensation.match(/[^0-9]*([0-9][0-9,\.]+)\s*k?/i);
    if (m?.[1]) {
      const offered = Number(m[1].replace(/[,\.]/g, ''));
      const floor = input.profile.desired_compensation.min_amount;
      eligibility_evidence.push(
        offered >= floor
          ? 'compensation_offered_at_or_above_floor'
          : 'compensation_below_stated_floor',
      );
    } else {
      eligibility_evidence.push('compensation_present_unparsed');
    }
  }

  if (eligibility_evidence.length === 0) {
    return { eligibility: 'UNKNOWN', hard_failures, eligibility_evidence: ['no_evidence'] };
  }

  // verified facts only produce VERIFIED_ELIGIBLE
  const verified = eligibility_evidence.includes('work_authorization_verified');
  return {
    eligibility: verified ? 'VERIFIED_ELIGIBLE' : 'POSSIBLY_ELIGIBLE',
    hard_failures,
    eligibility_evidence,
  };
}

/** Explainable baseline fit score 0–100 (placeholder M1; AI fit in M2). */
export function baselineFitScore(
  job: { title: string; description: string | null },
  profile: { skills: { name: string; level: string }[]; role_families: string[] },
): { score: number; rationale: string } {
  const text = `${job.title} ${job.description ?? ''}`.toLowerCase();
  const weights: Record<string, number> = { EXPERT: 12, PROFICIENT: 8, FAMILIAR: 4 };
  let score = 0;
  const hits: string[] = [];
  const levelRank: Record<string, number> = { EXPERT: 3, PROFICIENT: 2, FAMILIAR: 1 };
  const levelRankAccessor = (level: string) => levelRank[level] ?? 0;
  for (const skill of [...profile.skills].sort(
    (a, b) => levelRankAccessor(b.level) - levelRankAccessor(a.level),
  )) {
    if (text.includes(skill.name.toLowerCase())) {
      score += weights[skill.level] ?? 4;
      hits.push(skill.name);
    }
  }
  if (profile.role_families.some((f) => text.includes(normalizeRoleTitle(f)))) {
    score += 10;
  }
  score = Math.min(100, score);
  const rationale =
    hits.length > 0 ? `matched skills: ${hits.join(', ')}` : 'no direct skill evidence in job text';
  return { score, rationale };
}
