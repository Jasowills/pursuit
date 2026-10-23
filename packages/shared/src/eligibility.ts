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

  if (hard_failures.length)
    return { eligibility: 'INELIGIBLE', hard_failures, eligibility_evidence };

  // Only match authorization to explicit employer jurisdiction; unrelated verified
  // citizenship is not evidence for every country. Free-text ambiguity stays unknown.
  const geography = `${input.job.location ?? ''} ${input.job.remote_restrictions ?? ''}`;
  const regions: Record<string, string[]> = {
    US: ['United States', 'USA'],
    GB: ['United Kingdom', 'UK', 'Great Britain'],
    CA: ['Canada'],
    NG: ['Nigeria'],
    DE: ['Germany'],
    FR: ['France'],
    AU: ['Australia'],
    IE: ['Ireland'],
    NL: ['Netherlands'],
    IN: ['India'],
    NZ: ['New Zealand'],
    SG: ['Singapore'],
  };
  const jurisdictions = Object.entries(regions)
    .filter(
      ([code, names]) =>
        new RegExp(`\\b${code}\\b`).test(geography) ||
        names.some((name) => new RegExp(`\\b${name}\\b`, 'i').test(geography)),
    )
    .map(([code]) => code);
  const status = (s: string) => s.trim().toUpperCase().replace(/[ -]/g, '_');
  const authorized = new Set([
    'AUTHORIZED',
    'CITIZEN',
    'CITIZENSHIP',
    'PERMANENT_RESIDENT',
    'WORK_PERMIT',
    'WORK_AUTHORIZED',
  ]);
  const auth = input.profile.work_authorization.filter(
    (a) => a.verified && jurisdictions.includes(a.jurisdiction.toUpperCase()),
  );
  const hasVerifiedAuth = auth.some((a) => authorized.has(status(a.status)));
  const needsSponsorship = auth.some((a) =>
    ['NEEDS_SPONSORSHIP', 'REQUIRES_SPONSORSHIP'].includes(status(a.status)),
  );
  const noSponsorship =
    /no\s+(?:visa\s+)?sponsorship|(?:cannot|can not|do not|does not|unable to)\s+(?:provide|offer|support)\s+(?:visa\s+)?sponsor|sponsorship\s+(?:is\s+)?not\s+(?:provided|available|offered)/i.test(
      haystack,
    );
  if (needsSponsorship && !hasVerifiedAuth && noSponsorship) {
    hard_failures.push('required_sponsorship_unavailable');
    return {
      eligibility: 'INELIGIBLE',
      hard_failures,
      eligibility_evidence: ['verified_sponsorship_requirement_conflicts_with_posting'],
    };
  }
  if (hasVerifiedAuth)
    eligibility_evidence.push(`work_authorization_verified_for:${jurisdictions.join(',')}`);
  else
    eligibility_evidence.push(
      jurisdictions.length
        ? 'work_authorization_for_employer_jurisdiction_unknown'
        : 'employer_jurisdiction_unknown',
    );

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

  // The legacy text field has no reliable currency/pay-period contract. Never compare
  // "$120k" as 120 or an hourly rate against an annual floor.
  if (input.profile.desired_compensation && input.job.compensation)
    eligibility_evidence.push('compensation_currency_and_period_need_verification');

  if (eligibility_evidence.length === 0) {
    return { eligibility: 'UNKNOWN', hard_failures, eligibility_evidence: ['no_evidence'] };
  }

  // Remote residency, timezone and payroll restrictions need additional facts the
  // legacy contract cannot represent; never treat verified citizenship as those facts.
  const additionalRestrictions = Boolean(input.job.remote_restrictions?.trim());
  return {
    eligibility:
      hasVerifiedAuth && jurisdictions.length === 1 && !additionalRestrictions
        ? 'VERIFIED_ELIGIBLE'
        : 'UNKNOWN',
    hard_failures,
    eligibility_evidence: additionalRestrictions
      ? [...eligibility_evidence, 'remote_residency_or_other_restrictions_need_verification']
      : eligibility_evidence,
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
