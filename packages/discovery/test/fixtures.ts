import { Job, Source, SearchProfile, type Reader } from '../src/contracts.js';
export const source = (
  provider: 'greenhouse' | 'ashby' | 'lever' | 'workable' | 'himalayas' | 'page' = 'greenhouse',
) =>
  Source.parse({
    id: provider + ':fixture',
    provider,
    board: 'fixture',
    company: 'Fixture Company',
    url: 'https://example.com/careers',
    query: 'designer',
  });
export const job = (changes: Record<string, unknown> = {}) =>
  Job.parse({
    provider: 'greenhouse',
    sourceId: 'greenhouse:fixture',
    externalId: '1',
    title: 'Software Engineer',
    company: 'Fixture Company',
    sourceUrl: 'https://example.com/jobs/1',
    applyUrl: 'https://example.com/jobs/1/apply',
    description: 'Build React and TypeScript services.',
    location: 'Remote',
    workplace: 'remote',
    applicantCountries: [],
    countryEvidence: null,
    timezoneRestrictions: null,
    raw: {},
    publishedAt: null,
    updatedAt: null,
    validThrough: null,
    compensation: null,
    employmentType: null,
    evidence: {
      url: 'https://example.com/jobs/1',
      method: 'fixture',
      parserVersion: 'test',
      observedAt: new Date().toISOString(),
    },
    ...changes,
  });
export const profile = (changes: Record<string, unknown> = {}) =>
  SearchProfile.parse({
    roles: ['software engineer'],
    skills: [
      { name: 'React', evidence: 'resume#project-1' },
      { name: 'TypeScript', evidence: 'resume#project-1' },
    ],
    residenceCountry: 'NG',
    residenceVerified: true,
    ...changes,
  });
export function reader(callback: (url: string) => unknown): Reader {
  return async (url) => ({
    status: 200,
    url,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(callback(url)),
  });
}
