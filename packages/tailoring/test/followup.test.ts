import { it, expect } from 'vitest';
import { followup } from '../src/followup.js';
import { reviewed, ROLE } from './fixtures.js';
it('does not falsely claim an application was sent', async () => {
  const base = {
    resume: await reviewed(),
    person: { name: 'Priya', role: 'Recruiter', sourceUrl: 'https://example.com/team' },
    job: ROLE,
  };
  expect((await followup(base)).message).toContain('I am interested');
  expect((await followup({ ...base, appliedReceipt: 'user-confirmed-receipt' })).message).toContain(
    'I applied',
  );
  expect((await followup(base)).status).toBe('draft_for_manual_review');
});
