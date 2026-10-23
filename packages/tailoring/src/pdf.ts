import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { validatePacket, digest } from './core.js';
const clean = (text: string) => text.replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\t/g, ' ');
function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const output: string[] = [];
  let line = '';
  for (const word of clean(text).split(/\s+/)) {
    if (font.widthOfTextAtSize(word, size) > width) {
      if (line) output.push(line);
      line = '';
      let part = '';
      for (const char of word) {
        if (font.widthOfTextAtSize(part + char, size) > width) {
          output.push(part);
          part = '';
        }
        part += char;
      }
      line = part;
    } else if (font.widthOfTextAtSize(line ? line + ' ' + word : word, size) > width) {
      output.push(line);
      line = word;
    } else line += (line ? ' ' : '') + word;
  }
  if (line) output.push(line);
  return output;
}
export async function renderResumePdf(
  packetInput: unknown,
  resumeInput: unknown,
  fontBytes?: Uint8Array,
) {
  const packet = await validatePacket(packetInput, resumeInput);
  const pdf = await PDFDocument.create();
  pdf.setTitle('Resume');
  pdf.setAuthor('');
  pdf.setCreator('Pursuit deterministic resume renderer');
  const font = fontBytes
    ? (pdf.registerFontkit(fontkit), await pdf.embedFont(fontBytes, { subset: true }))
    : await pdf.embedFont(StandardFonts.Helvetica);
  const bold = fontBytes ? font : await pdf.embedFont(StandardFonts.HelveticaBold);
  const supported = new Set(font.getCharacterSet());
  for (const b of packet.blocks)
    for (const char of clean(b.text))
      if (!supported.has(char.codePointAt(0)!))
        throw new Error('resume_font_missing_glyph_choose_supported_font');
  const size = packet.template === 'compact' ? 10.5 : 11;
  const lineHeight = size * 1.38,
    margin = 48,
    width = 612 - 2 * margin;
  let page = pdf.addPage([612, 792]),
    y = 744;
  const nextPage = () => {
    if (pdf.getPageCount() >= 4) throw new Error('resume_exceeds_four_pages_review_selection');
    page = pdf.addPage([612, 792]);
    y = 744;
  };
  for (let i = 0; i < packet.blocks.length; i++) {
    const b = packet.blocks[i]!;
    const heading = b.kind === 'section';
    const name = i === 0 && b.kind === 'identity';
    const textSize = name ? 20 : heading ? 11 : size;
    const useFont = heading || name ? bold : font;
    const lines = wrap(b.text, useFont, textSize, width);
    if (heading) {
      if (y < margin + lineHeight * 4) nextPage();
      y -= 12;
    }
    const step = name ? 27 : lineHeight;
    for (const line of lines) {
      if (y < margin + step) nextPage();
      page.drawText(line, {
        x: margin,
        y,
        size: textSize,
        font: useFont,
        color: rgb(0.07, 0.07, 0.07),
      });
      y -= step;
    }
    y -= heading ? 5 : b.kind === 'bullet' ? 4 : 3;
  }
  const bytes = await pdf.save();
  if (bytes.length > 2_500_000) throw new Error('resume_pdf_exceeds_portable_size_limit');
  return {
    bytes,
    pages: pdf.getPageCount(),
    hash: await digest(bytes),
    packetHash: await digest(JSON.stringify(packet)),
    mime: 'application/pdf',
    renderer: 'single-column-1',
  };
}
