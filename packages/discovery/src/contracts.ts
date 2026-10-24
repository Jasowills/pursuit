import { z } from 'zod';
export const Provider = z.enum([
  'greenhouse',
  'ashby',
  'lever',
  'workable',
  'himalayas',
  'page',
  'feed',
  'hackernews',
]);
export const Source = z
  .object({
    id: z.string().min(1).max(200),
    provider: Provider,
    board: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{1,150}$/)
      .optional(),
    region: z.enum(['us', 'eu']).default('us'),
    company: z.string().min(1).max(300),
    url: z
      .string()
      .url()
      .refine((raw) => {
        const u = new URL(raw);
        return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password;
      }, 'Use a public HTTP(S) URL without embedded credentials.')
      .optional(),
    intervalMinutes: z.number().int().min(15).max(10080).default(360),
    enabled: z.boolean().default(true),
    query: z.string().min(1).max(300).optional(),
    country: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .optional(),
  })
  .strict()
  .superRefine((s, c) => {
    if (['greenhouse', 'ashby', 'lever', 'workable'].includes(s.provider) && !s.board)
      c.addIssue({ code: 'custom', message: 'An employer board identifier is required.' });
    if (['page', 'feed'].includes(s.provider) && !s.url)
      c.addIssue({ code: 'custom', message: 'A public job-detail URL is required.' });
  });
export type Source = z.infer<typeof Source>;
export const Job = z.object({
  provider: Provider,
  sourceId: z.string(),
  externalId: z.string().min(1),
  title: z.string().min(1).max(1000),
  company: z.string().min(1).max(300),
  sourceUrl: z.string().url(),
  applyUrl: z.string().url().nullable(),
  description: z.string().max(200000),
  location: z.string().nullable(),
  workplace: z.enum(['remote', 'hybrid', 'onsite', 'unknown']),
  applicantCountries: z.array(z.string()), // explicit source country constraints only
  countryEvidence: z.string().nullable(),
  timezoneRestrictions: z.array(z.string()).nullable(),
  raw: z.record(z.string(), z.unknown()),
  publishedAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  validThrough: z.string().nullable(),
  compensation: z
    .object({
      min: z.number().nullable(),
      max: z.number().nullable(),
      currency: z.string(),
      unit: z.string(),
    })
    .nullable(),
  employmentType: z.string().nullable(),
  kind: z.enum(['vacancy', 'hiring_lead']).default('vacancy'),
  evidence: z.object({
    url: z.string().url(),
    method: z.string(),
    parserVersion: z.string(),
    observedAt: z.string(),
  }),
  attribution: z.string().nullable().default(null),
});
export type Job = z.infer<typeof Job>;
export type Poll = { jobs: Job[]; complete: boolean; diagnostics: string[]; observedAt: string };
export type HttpResult = {
  status: number;
  url: string;
  headers: Record<string, string>;
  body: string;
};
export type Reader = (
  url: string,
  options?: { headers?: Record<string, string>; sameOriginOnly?: boolean; accept?: string },
) => Promise<HttpResult>;
export const SearchProfile = z
  .object({
    roles: z.array(z.string().min(1).max(150)).max(30).default([]),
    skills: z
      .array(
        z.object({
          name: z.string().min(1).max(150),
          evidence: z.string().min(1).max(2000),
        }),
      )
      .max(200)
      .default([]),
    residenceCountry: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .nullable()
      .default(null),
    residenceVerified: z.boolean().default(false),
    workAuthorization: z
      .array(
        z.object({
          country: z.string().regex(/^[A-Z]{2}$/),
          status: z.enum(['authorized', 'needs_sponsorship', 'unknown']),
          verified: z.boolean(),
        }),
      )
      .max(50)
      .default([]),
    remoteOnly: z.boolean().default(false),
    exclusions: z.array(z.string().min(1).max(200)).max(100).default([]),
    salaryFloor: z
      .object({ amount: z.number().nonnegative(), currency: z.string(), unit: z.string() })
      .nullable()
      .default(null),
  })
  .strict();
export type SearchProfile = z.infer<typeof SearchProfile>;
export type Assessment = {
  eligibility: 'confirmed_eligible' | 'likely_eligible' | 'unknown' | 'ineligible';
  reasons: string[];
  unknowns: string[];
  fitScore: number;
  fitEvidence: { requirement: string; candidateEvidence: string; jobEvidence: string }[];
  missingSkills: string[];
  candidateSkillsNotMentioned: string[];
  version: string;
};
