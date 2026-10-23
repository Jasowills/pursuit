import { structureResume } from '../src/core.js';
export const SOURCE = `Alex Morgan
alex.morgan@example.com | London, UK

Experience
Meridian Studio | QA Analyst | 2022-2025
- Tested REST APIs with Postman and SQL.
- Coordinated regression testing for the release team.
- Produced training videos in Premiere.

Education
BA Interaction Design | University of Example | 2020

Skills
SQL, Postman, Premiere`;
export const ROLE = {
  id: 'role-1',
  title: 'QA Analyst',
  company: 'Example',
  description: 'Test REST APIs using SQL and Postman.',
};
export async function reviewed() {
  const r = await structureResume(SOURCE, 'original.txt');
  r.reviewedAt = new Date().toISOString();
  return r;
}
