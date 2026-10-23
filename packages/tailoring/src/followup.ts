import { validateResume } from './core.js';
import { Voice } from './contracts.js';
import { checkDraft, draftPunctuation, writingIssues } from './writing.js';
export async function followup(input: {
  resume: unknown;
  person: { name: string; role: string; sourceUrl: string };
  job: { title: string; company: string };
  appliedReceipt?: string;
  tone?: 'story' | 'professional' | 'direct';
  voice?: unknown;
}) {
  const resume = await validateResume(input.resume);
  const voice = Voice.parse(input.voice ?? {});
  const tone = input.tone ?? voice.tone;
  if (!resume.reviewedAt) throw new Error('review_resume_first');
  const name = resume.blocks.find((b) => b.kind === 'identity')?.text ?? '';
  const example = resume.blocks
    .filter((b) => b.kind === 'bullet')
    .map((b) => draftPunctuation(b.text.replace(/^[•*\-]\s*/, '')))
    .find((text) => writingIssues(text, voice.avoid).length === 0);
  const opening = input.appliedReceipt?.trim()
    ? `I applied for the ${input.job.title} role at ${input.job.company}.`
    : `I am interested in the ${input.job.title} role at ${input.job.company}.`;
  const message = checkDraft(
    [
      `Hi ${input.person.name},`,
      opening,
      checkDraft(voice.motivation, voice.avoid),
      example
        ? tone === 'story'
          ? `This is the work behind my interest:\n${example}`
          : tone === 'direct'
            ? example
            : `A relevant example from my experience:\n${example}`
        : '',
      tone === 'direct'
        ? 'Is there someone on the hiring team I should speak with?'
        : 'Would you be open to pointing me to the right person on the hiring team?',
      name,
    ]
      .filter(Boolean)
      .join('\n\n'),
    voice.avoid,
  );
  return {
    message,
    sourceUrl: input.person.sourceUrl,
    status: 'draft_for_manual_review',
    channels: ['linkedin_copy', 'x_copy', 'email_review'],
    notice: 'Review the person, role and exact wording. Copying a message is not a send.',
  };
}
