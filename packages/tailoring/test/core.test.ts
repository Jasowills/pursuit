import { it, expect } from 'vitest';
import {
  structureResume,
  tailor,
  validatePacket,
  selectionPrompt,
  selectionCandidates,
  parseSelection,
} from '../src/core.js';
import { SOURCE, ROLE, reviewed } from './fixtures.js';
it('requires source review before tailoring', async () => {
  await expect(tailor(await structureResume(SOURCE, 'original.txt'), ROLE)).rejects.toThrow(
    'review_resume_first',
  );
});
it('selects relevant supported facts without adding experience or dropping employer/date context', async () => {
  const resume = await reviewed();
  const packet = await tailor(resume, ROLE, { maxBullets: 1 });
  expect(packet.blocks.some((b) => b.text.includes('Tested REST APIs'))).toBe(true);
  expect(
    packet.blocks.some((b) => b.text.includes('Meridian Studio | QA Analyst | 2022-2025')),
  ).toBe(true);
  expect(packet.omittedIds.length).toBe(2);
  for (const b of packet.blocks) expect(SOURCE.slice(b.start, b.end)).toBe(b.text);
});
it('rejects invented IDs, text and source tampering', async () => {
  const r = await reviewed();
  await expect(tailor(r, ROLE, { selectedIds: ['invented'] })).rejects.toThrow('unknown_fact_id');
  const p = await tailor(r, ROLE);
  p.blocks[0]!.text = 'Doctor of Medicine';
  await expect(validatePacket(p, r)).rejects.toThrow('unsupported_fact');
  await expect(tailor({ ...r, sourceText: SOURCE + ' invented' }, ROLE)).rejects.toThrow(
    'resume_source_changed',
  );
});
it('keeps degrees and licenses even if model IDs omit them', async () => {
  const r = await reviewed();
  const p = await tailor(r, ROLE, { selectedIds: [] });
  expect(p.blocks.some((b) => b.section === 'Education' && b.text.includes('BA Interaction'))).toBe(
    true,
  );
  const q = { ...p, blocks: p.blocks.slice(1), selectedIds: p.selectedIds.slice(1) };
  await expect(validatePacket(q, r)).rejects.toThrow('protected_context');
});
it('offers distinct introductions and uses the candidate motivation verbatim', async () => {
  const r = await reviewed();
  const letters = await Promise.all(
    ['story', 'professional', 'direct'].map((tone) =>
      tailor(r, ROLE, { voice: { tone, motivation: 'I want to improve release confidence.' } }),
    ),
  );
  expect(new Set(letters.map((p) => p.coverLetter.split('\n\n')[1])).size).toBe(3);
  expect(
    letters.every((p) => p.coverLetter.includes('I want to improve release confidence.')),
  ).toBe(true);
});
it('bounds optional model context and accepts only selection JSON', async () => {
  const r = await reviewed();
  expect(selectionPrompt(r, ROLE).length).toBeLessThan(18000);
  expect(parseSelection('{"selectedIds":["a","a"]}')).toEqual(['a']);
  expect(() => parseSelection('{"selectedIds":[],"resume":"invented"}')).toThrow();
  expect(() => parseSelection('{"selectedIds":["a"]}', ['b'])).toThrow('unknown_fact_id');
  expect(() =>
    parseSelection(
      JSON.stringify({ selectedIds: Array.from({ length: 13 }, (_, i) => String(i)) }),
    ),
  ).toThrow('invalid_selection');
  for (const output of ['null', '[]', '"text"', '{"selectedIds":"a"}', 'x'.repeat(12001)]) {
    expect(() => parseSelection(output)).toThrow();
  }
});
it('retrieves relevant evidence after the first twenty bullets before applying the model budget', async () => {
  const source =
    'Alex\n\nExperience\nExample | QA | 2022-2025\n' +
    Array.from({ length: 30 }, (_, i) => `- Coordinated internal meeting ${i}.`).join('\n') +
    '\n- Tested REST APIs with SQL and Postman.';
  const resume = await structureResume(source, 'long.txt');
  const candidates = selectionCandidates(resume, ROLE);
  expect(candidates).toHaveLength(20);
  expect(candidates[0]?.text).toContain('Tested REST APIs');
  expect(selectionPrompt(resume, ROLE)).toContain(candidates[0]!.id);
});
