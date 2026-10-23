import { validateResume } from './core.js';
export async function followup(input: {
  resume: unknown;
  person: { name: string; role: string; sourceUrl: string };
  job: { title: string; company: string };
  appliedReceipt?: string;
  tone?: 'story' | 'professional' | 'direct';
}) {
  const resume = await validateResume(input.resume);
  if (!resume.reviewedAt) throw new Error('review_resume_first');
  const name = resume.blocks.find((b) => b.kind === 'identity')?.text ?? '';
  const example = resume.blocks.find((b) => b.kind === 'bullet')?.text.replace(/^[•*\-]\s*/, '');
  const opening = input.appliedReceipt?.trim()
    ? `I applied for the ${input.job.title} role at ${input.job.company}.`
    : `I am interested in the ${input.job.title} role at ${input.job.company}.`;
  const message = [
    `Hi ${input.person.name},`,
    opening,
    example ? `A relevant example from my experience:\n${example}` : '',
    input.tone === 'direct'
      ? 'Is there someone on the hiring team I should speak with?'
      : 'Would you be open to pointing me to the right person on the hiring team?',
    name,
  ]
    .filter(Boolean)
    .join('\n\n');
  return {
    message,
    sourceUrl: input.person.sourceUrl,
    status: 'draft_for_manual_review',
    channels: ['linkedin_copy', 'x_copy', 'email_review'],
    notice: 'Review the person, role and exact wording. Copying a message is not a send.',
  };
}
