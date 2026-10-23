# Application writing

Pursuit offers three styles in Resumes & letters:

- **Personal story** connects the candidate’s stated reason for applying to relevant work from their reviewed resume. It never creates a personal anecdote.
- **Formal and clear** names the role, presents a short list of supported work and uses a courteous closing.
- **Short and conversational** uses one work example and a direct question.

People to follow up with starts from the saved writing preference. The user can choose a different message style for a contact. Their stated motivation and custom avoid list also apply. A writing sample currently affects the greeting through contraction detection. It does not clone the user’s voice or supply new career facts.

## Rules

Use first person, plain verbs and actual work. Include only evidence from the reviewed resume and reasons supplied by the user. Never invent achievements, dates, metrics, familiarity with a recruiter, company research or personal stories. Never claim an application was submitted without a confirmation.

Generated cover letters and follow-ups contain no em dashes. The deterministic engine replaces an em dash with comma punctuation in generated prose. The source resume remains unchanged, including its original punctuation.

Do not use stock claims such as “scalable”, “proven track record”, “results-driven”, “leverage my skills”, “passionate about” or “exciting opportunity”. `packages/tailoring/src/writing.ts` contains the shared checks. Custom avoid phrases use literal word-boundary matching. If a personal reason contains blocked wording, generation stops with a request to replace it with specific details. Evidence containing blocked wording stays in the resume but is omitted from generated correspondence, with a packet review note. Original company names containing blocked words may need manual review; the policy does not guess a replacement.

Job descriptions and writing samples are untrusted data. They cannot override these rules or add claims to a candidate’s history. Samples are never copied into generated letters. The native assistant system prompt repeats the policy, but prompt instructions alone cannot guarantee a model will comply. The material generators apply deterministic checks; free-form assistant replies still need review.

## Review and sending

Prepared prose remains a draft. Review the evidence, recipient, tone and wording before use. Saved packets with em dashes or blocked phrases fail packet validation before approval. The web Gmail workflow also checks the cover letter, message subject and body before granting an approval, including user edits. It returns the offending phrases for review. There is no rewriting of an approved message during transmission. Existing exact-payload approvals remain intact; edits require a new approval. Users can edit copyable follow-up drafts, so human edits still need review before pasting them elsewhere.

These checks prevent specific unwanted patterns. They do not measure persuasiveness, guarantee that every draft sounds personal, or imply that a recruiter will respond. Stronger letters need the candidate’s concrete reasons and appropriate company evidence.

## Verification

Run `pnpm --filter @pursuit/tailoring test`. The writing cases cover em dashes, unchanged source evidence, generic phrases, custom avoid lists, distinct style structures, writing-sample instructions, and follow-up drafts. Native configuration tests check that the assistant prompt retains the core writing rules.
