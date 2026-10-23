import { writeFileSync } from 'node:fs';
import { structureResume, selectionPrompt, parseSelection, tailor } from '../src/core.js';
import { SOURCE, ROLE } from './fixtures.js';
const resume = await structureResume(SOURCE, 'synthetic.txt');
resume.reviewedAt = new Date().toISOString();
const prompt = selectionPrompt(resume, ROLE);
const response = await fetch('http://127.0.0.1:11434/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'qwen2.5:7b',
    stream: false,
    messages: [{ role: 'user', content: prompt }],
    format: {
      type: 'object',
      properties: {
        selectedIds: {
          type: 'array',
          items: {
            type: 'string',
            enum: resume.blocks.filter((b) => b.kind === 'bullet').map((b) => b.id),
          },
          maxItems: 12,
        },
      },
      required: ['selectedIds'],
      additionalProperties: false,
    },
    options: { temperature: 0, num_predict: 256, num_ctx: 4096 },
  }),
  signal: AbortSignal.timeout(180000),
});
if (!response.ok) throw new Error(`ollama_http_${response.status}`);
const data = await response.json();
const ids = parseSelection(data.message.content);
const packet = await tailor(resume, ROLE, { selectedIds: ids });
const report = {
  observedAt: new Date().toISOString(),
  model: 'qwen2.5:7b',
  scope:
    'Synthetic resume only; one schema-constrained selection call. No tools, account access or submissions.',
  promptCharacters: prompt.length,
  promptTokens: data.prompt_eval_count,
  outputTokens: data.eval_count,
  totalSeconds: data.total_duration / 1e9,
  selectedIds: ids,
  selectedBulletText: packet.blocks.filter((b) => b.kind === 'bullet').map((b) => b.text),
  allResumeTextFromSource: packet.blocks.every((b) => SOURCE.slice(b.start, b.end) === b.text),
  notes: 'This verifies a local selection path, not universal model quality or full rewriting.',
};
writeFileSync('/tmp/pursuit-tailoring-ollama.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
