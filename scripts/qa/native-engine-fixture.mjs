// Local transport fixture only. Production worker.ts never imports this adapter.
import { createInterface } from 'node:readline';
import { CareerEngine } from '../../packages/career-engine/dist/index.js';
const events = [];
const url = 'https://jobs.ashbyhq.com/fixture/qa';
const form = {
  url,
  fields: [
    { id: 'name', label: 'Full name', type: 'text', required: true, options: [] },
    { id: 'email', label: 'Email', type: 'email', required: true, options: [] },
    { id: 'resume', label: 'Resume', type: 'file', required: true, options: [] },
  ],
};
let submitted = 0;
let changed = false;
const engine = new CareerEngine(process.argv[2], {
  executionEnabled: true,
  progress: (e) => events.push(e),
  read: async (address) => ({
    url: address,
    status: 200,
    headers: {},
    body: JSON.stringify(
      address.includes('api.ashbyhq.com')
        ? {
            jobs: [
              {
                id: 'qa',
                title: 'QA Analyst',
                jobUrl: url,
                applyUrl: url,
                isListed: true,
                descriptionPlain:
                  'Test REST APIs using SQL and Postman.' + (changed ? ' Review CI tests.' : ''),
                location: 'Remote',
                workplaceType: 'Remote',
              },
            ],
          }
        : { jobs: [] },
    ),
  }),
  adapter: async () => ({
    observe: async () => form,
    fill: async () => {},
    submit: async () => {
      submitted++;
      return {
        kind: 'hosted_confirmation',
        url,
        text: 'Application submitted',
        acceptedPostStatus: 200,
        observedAt: new Date().toISOString(),
      };
    },
    close: async () => {},
  }),
});
for await (const line of createInterface({ input: process.stdin })) {
  try {
    events.length = 0;
    const request = JSON.parse(line);
    if (request.action === '__fixture_change_role') {
      changed = true;
      process.stdout.write(JSON.stringify({ value: true, events: [], submitted }) + '\n');
      continue;
    }
    const value = await engine.dispatch(request);
    process.stdout.write(JSON.stringify({ value, events: [...events], submitted }) + '\n');
  } catch (error) {
    process.stdout.write(
      JSON.stringify({ error: String(error), events: [...events], submitted }) + '\n',
    );
  }
}
engine.close();
