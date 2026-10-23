import { it, expect } from 'vitest';
import { resolveApplication, missingAnswers } from '../src/plan.js';
it('does not scrape restricted platform links or treat them as resolved job details', async () => {
  let calls = 0;
  const result = await resolveApplication('https://www.linkedin.com/jobs/view/123', async () => {
    calls++;
    throw Error();
  });
  expect(result.status).toBe('needs_employer_link');
  expect(calls).toBe(0);
});
it('requires explicit answers to unknown required questions', () => {
  const form = {
    url: 'https://jobs.ashbyhq.com/x/y',
    fields: [
      {
        id: 'right',
        label: 'Will you require sponsorship?',
        type: 'select' as const,
        required: true,
        options: ['Yes', 'No'],
      },
    ],
  };
  expect(
    missingAnswers(form, {
      personId: 'user',
      jobUrl: form.url,
      packetHash: 'a'.repeat(64),
      pdfHash: 'a'.repeat(64),
      formHash: 'a'.repeat(64),
      answers: {},
    }),
  ).toHaveLength(1);
});

it('validates supplied optional answers while allowing unanswered optional fields', () => {
  const form = {
    url: 'https://jobs.ashbyhq.com/x/y',
    fields: [
      {
        id: 'email',
        label: 'Alternate email',
        type: 'email' as const,
        required: false,
        options: [],
      },
      {
        id: 'updates',
        label: 'Product updates',
        type: 'checkbox' as const,
        required: false,
        options: [],
      },
    ],
  };
  const payload = {
    personId: 'user',
    jobUrl: form.url,
    packetHash: 'a'.repeat(64),
    pdfHash: 'a'.repeat(64),
    formHash: 'a'.repeat(64),
    answers: { email: 'not an email', updates: 'yes' },
  };
  expect(missingAnswers(form, payload).map((f) => f.id)).toEqual(['email', 'updates']);
  expect(missingAnswers(form, { ...payload, answers: {} })).toEqual([]);
  expect(
    missingAnswers(form, { ...payload, answers: { email: 'alex@example.com', updates: false } }),
  ).toEqual([]);
});
