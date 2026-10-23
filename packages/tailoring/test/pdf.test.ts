import { it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { tailor } from '../src/core.js';
import { renderResumePdf } from '../src/pdf.js';
import { extractResume } from '../src/imports.js';
import { reviewed, ROLE } from './fixtures.js';
it('creates a real text PDF and round-trips the supported facts', async () => {
  const resume = await reviewed();
  const packet = await tailor(resume, ROLE, { maxBullets: 1 });
  const font = await readFile(new URL('../assets/NotoSans-Regular.ttf', import.meta.url));
  const result = await renderResumePdf(packet, resume, font);
  expect(result.pages).toBe(1);
  expect(result.bytes.length).toBeLessThan(2_500_000);
  const reread = await extractResume(result.bytes, 'tailored.pdf');
  expect(reread.sourceText).toContain('QA Analyst');
  expect(reread.sourceText).toContain('2022-2025');
  expect(reread.sourceText).toContain('Postman');
  expect(reread.sourceText).not.toContain('Produced training videos');
});
it('rejects a tampered packet before writing the PDF', async () => {
  const r = await reviewed();
  const p = await tailor(r, ROLE);
  p.blocks[0]!.text = 'Invented Experience';
  await expect(renderResumePdf(p, r)).rejects.toThrow('unsupported_fact');
});
it('detects scanned/blank PDFs instead of inventing extracted content', async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  await expect(extractResume(await pdf.save(), 'scan.pdf')).rejects.toThrow('ocr_required');
});
