import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { structureResume, tailor } from '../src/core.js';
import { renderResumePdf } from '../src/pdf.js';
const source = `Alex Morgan
QA Analyst
alex.morgan@example.com | London, UK | alexmorgan.example

Profile
QA analyst focused on API testing, release confidence and clear defect reporting.

Experience
Meridian Studio | QA Analyst | 2022-2025
- Tested REST APIs with Postman and SQL across customer-facing workflows.
- Built regression checklists and documented reproducible defects with the product team.
- Worked with engineers to investigate failed requests and verify fixes before release.
- Maintained test data and checked database changes with PostgreSQL queries.

Fieldwork | Support Analyst | 2020-2022
- Reproduced customer issues and recorded clear steps for engineering follow-up.
- Reviewed product changes and helped maintain the support knowledge base.
- Produced short training videos for the customer support team.

Education
BA Interaction Design | University of Example | 2020

Skills
API testing | Postman | SQL | PostgreSQL | Regression testing | Defect reporting`;
const resume = await structureResume(source, 'fictional-example.txt');
resume.reviewedAt = new Date().toISOString();
const packet = await tailor(
  resume,
  {
    id: 'fictional-qa-role',
    title: 'QA Analyst',
    company: 'Example Employer',
    description:
      'API testing with Postman, PostgreSQL and SQL. Regression testing and defect reporting.',
  },
  { maxBullets: 5 },
);
const pdf = await renderResumePdf(
  packet,
  resume,
  await readFile(new URL('../assets/NotoSans-Regular.ttf', import.meta.url)),
);
await mkdir('../../output/pdf', { recursive: true });
await writeFile('../../output/pdf/tailored-resume-example.pdf', pdf.bytes);
await mkdir('/tmp/pursuit-tailoring-evidence', { recursive: true });
await writeFile(
  '/tmp/pursuit-tailoring-evidence/example.json',
  JSON.stringify(
    { resume, packet, pdf: { pages: pdf.pages, hash: pdf.hash, bytes: pdf.bytes.length } },
    null,
    2,
  ),
);
console.log(JSON.stringify({ pages: pdf.pages, hash: pdf.hash, bytes: pdf.bytes.length }));
