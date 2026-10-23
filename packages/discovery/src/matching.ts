import { type Job, type SearchProfile, type Assessment } from './contracts.js';
import { tokens } from './text.js';
export const ROLE_ALIASES: Record<string, string[]> = {
  'software engineer': [
    'software engineer',
    'software developer',
    'backend engineer',
    'frontend engineer',
    'full stack developer',
    'full stack engineer',
    'fullstack engineer',
    'backend developer',
    'frontend developer',
    'platform engineer',
  ],
  'qa engineer': [
    'qa engineer',
    'quality assurance',
    'sdet',
    'software test engineer',
    'test automation engineer',
  ],
  'product designer': [
    'product designer',
    'ux designer',
    'ui designer',
    'interaction designer',
    'ux researcher',
  ],
  'data analyst': [
    'data analyst',
    'business intelligence analyst',
    'bi analyst',
    'analytics engineer',
    'insights analyst',
  ],
  'video editor': ['video editor', 'motion designer', 'post production editor', 'film editor'],
  accountant: ['accountant', 'financial accountant', 'management accountant', 'accounting analyst'],
  'customer success': [
    'customer success',
    'customer support specialist',
    'client success',
    'customer experience',
  ],
  'registered nurse': ['registered nurse', 'staff nurse', 'clinical nurse'],
};
export function expandRoles(roles: string[]): string[] {
  return [
    ...new Set(
      roles
        .flatMap((r) => ROLE_ALIASES[r.toLowerCase()] ?? [r])
        .map((r) => r.trim())
        .filter(Boolean),
    ),
  ].slice(0, 100);
}
const normalized = (s: string) => tokens(s).join(' ');
function contains(text: string, term: string): boolean {
  return ` ${normalized(text)} `.includes(` ${normalized(term)} `);
}
export function assess(job: Job, profile: SearchProfile): Assessment {
  const reasons: string[] = [];
  const unknowns: string[] = [];
  let blocked = false;
  const haystack = `${job.title}\n${job.description}`;
  const normalizedHaystack = ` ${normalized(haystack)} `;
  const mentions = (term: string) => normalizedHaystack.includes(` ${normalized(term)} `);
  if (job.kind === 'hiring_lead')
    unknowns.push('This is an unverified hiring signal, not a confirmed vacancy.');
  for (const x of profile.exclusions)
    if (contains(`${haystack}\n${job.company}`, x)) {
      blocked = true;
      reasons.push(`Excluded by your rule: ${x}`);
    }
  if (profile.remoteOnly && ['onsite', 'hybrid'].includes(job.workplace)) {
    blocked = true;
    reasons.push('The source does not describe a fully remote role.');
  } else if (profile.remoteOnly && job.workplace === 'unknown')
    unknowns.push('Remote work arrangement is not confirmed.');
  let geography = false;
  if (!profile.residenceCountry || !profile.residenceVerified)
    unknowns.push('Your work location is not confirmed.');
  else if (!job.countryEvidence)
    unknowns.push('Applicant-country eligibility is not explicit in the source.');
  else if (
    job.applicantCountries.length &&
    !job.applicantCountries.includes(profile.residenceCountry)
  ) {
    blocked = true;
    reasons.push(
      `Source applicant-country restrictions do not include ${profile.residenceCountry}.`,
    );
  } else {
    geography = true;
    reasons.push(job.countryEvidence);
  }
  // No arbitrary authorization in country A can qualify a role in country B.
  // The current adapters do not establish payroll/visa jurisdiction, so never manufacture it.
  unknowns.push(
    'Employer work-authorization, payroll and sponsorship requirements need verification.',
  );
  if (job.timezoneRestrictions?.length)
    unknowns.push(
      `Source timezone restrictions: ${job.timezoneRestrictions.join(', ')}. Confirm working-hour compatibility.`,
    );
  else if (job.timezoneRestrictions === null)
    unknowns.push('Working-hour/timezone requirements are not confirmed.');
  if (profile.salaryFloor) {
    const pay = job.compensation;
    const floor = profile.salaryFloor;
    if (!pay || pay.currency !== floor.currency || pay.unit !== floor.unit)
      unknowns.push(
        'Compensation is absent or not comparable in the same currency and pay period.',
      );
    else if (pay.max !== null && pay.max < floor.amount) {
      blocked = true;
      reasons.push('The published maximum is below your compensation floor.');
    } else if (pay.min === null || pay.min < floor.amount)
      unknowns.push('The published range does not guarantee your compensation floor.');
  }
  const fitEvidence: Assessment['fitEvidence'] = [];
  const candidateSkillsNotMentioned: string[] = [];
  const skills = [
    ...new Map(profile.skills.map((skill) => [normalized(skill.name), skill])).values(),
  ];
  const vocabulary = [
    ...skills.map((s) => s.name),
    'Python',
    'Java',
    'JavaScript',
    'TypeScript',
    'React',
    'C++',
    'C#',
    'SQL',
    'PostgreSQL',
    'Redis',
    'Kafka',
    'Figma',
    'Adobe Premiere',
    'After Effects',
    'Excel',
    'Salesforce',
    'QuickBooks',
    'registered nurse',
    'CPR',
    'customer research',
    'accessibility',
    'account reconciliation',
    'GAAP',
  ];
  const requirements = [...new Set(vocabulary.map(normalized))].filter((term) => mentions(term));
  const missingSkills = requirements.filter(
    (term) => !skills.some((skill) => normalized(skill.name) === term),
  );
  for (const skill of skills) {
    if (mentions(skill.name)) {
      const index = haystack.toLocaleLowerCase().indexOf(skill.name.toLocaleLowerCase());
      fitEvidence.push({
        requirement: skill.name,
        candidateEvidence: skill.evidence,
        jobEvidence:
          index >= 0
            ? haystack.slice(Math.max(0, index - 60), index + skill.name.length + 100)
            : job.title,
      });
    } else candidateSkillsNotMentioned.push(skill.name);
  }
  const roles = expandRoles(profile.roles);
  const titleFit = roles.some((r) => contains(job.title, r));
  const skillCoverage = requirements.length ? fitEvidence.length / requirements.length : 0;
  // Transparent retrieval baseline, not a hiring probability. No unsupported semantic claims.
  const fitScore = Math.round(60 * skillCoverage + 30 * Number(titleFit) + 10 * Number(geography));
  return {
    eligibility: blocked
      ? 'ineligible'
      : job.kind === 'hiring_lead'
        ? 'unknown'
        : geography
          ? 'likely_eligible'
          : 'unknown',
    reasons,
    unknowns,
    fitScore,
    fitEvidence,
    missingSkills,
    candidateSkillsNotMentioned,
    version: 'evidence-baseline-1',
  };
}
