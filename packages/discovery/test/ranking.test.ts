import { it, expect } from 'vitest';
import { bm25, reciprocalRankFusion } from '../src/ranking.js';
import { assess } from '../src/matching.js';
import { job, profile } from './fixtures.js';
it('retrieves the relevant document and preserves specialty symbols', () => {
  const scores = bm25(
    [
      { id: 'cpp', text: 'C++ engineer rendering C++ graphics' },
      { id: 'cs', text: 'C# engineer backend .NET' },
      { id: 'nurse', text: 'Clinical nurse practitioner' },
    ],
    'C++',
  );
  expect(scores.get('cpp')).toBeGreaterThan(0);
  expect(scores.get('cs')).toBe(0);
  expect(scores.get('nurse')).toBe(0);
});
it('fuses agreement without interpreting it as hiring likelihood', () => {
  const result = reciprocalRankFusion([
    ['a', 'b'],
    ['b', 'c'],
  ]);
  expect(result.get('b')).toBeGreaterThan(result.get('a')!);
  expect(result.get('b')).toBeLessThan(1);
});
it('distinguishes absent candidate evidence from candidate skills not used in a posting', () => {
  const result = assess(job({ description: 'Build React and Python services.' }), profile());
  expect(result.missingSkills).toContain('python');
  expect(result.candidateSkillsNotMentioned).toContain('TypeScript');
  expect(result.missingSkills).not.toContain('TypeScript');
});
