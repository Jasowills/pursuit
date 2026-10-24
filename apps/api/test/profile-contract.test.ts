import { profilePatchSchema } from '../src/careers.controller';

describe('career profile patch bounds', () => {
  it('rejects oversized authorization lists and preference values', () => {
    const authorization = { jurisdiction: 'NG', status: 'authorized', verified: true };
    expect(
      profilePatchSchema.safeParse({ work_authorization: Array(51).fill(authorization) }).success,
    ).toBe(false);
    expect(profilePatchSchema.safeParse({ preferences: ['x'.repeat(501)] }).success).toBe(false);
  });

  it('rejects unbounded exclusions and accepts the documented maximum', () => {
    expect(
      profilePatchSchema.safeParse({ hard_exclusions: Array(101).fill('employer') }).success,
    ).toBe(false);
    const accepted = profilePatchSchema.safeParse({ hard_exclusions: Array(100).fill('employer') });
    expect(accepted.success).toBe(true);
  });
});
