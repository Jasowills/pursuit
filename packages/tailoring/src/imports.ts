import { getDocumentProxy, extractText } from 'unpdf';
import { Unzip, UnzipInflate, strFromU8 } from 'fflate';
import { XMLParser } from 'fast-xml-parser';
import { structureResume } from './core.js';
export const MAX_DOCUMENT_BYTES = 8_000_000;
function documentXml(bytes: Uint8Array): string {
  let count = 0,
    total = 0,
    found = false;
  const chunks: Uint8Array[] = [];
  const unzip = new Unzip((file) => {
    if (++count > 500) throw new Error('docx_entry_budget');
    if (file.name !== 'word/document.xml') return; // Never load embeddings, macros, relationships or external targets.
    if (found || (file.originalSize ?? 0) > 2_000_000) throw new Error('docx_xml_budget');
    found = true;
    file.ondata = (error, data) => {
      if (error) throw new Error('invalid_docx_archive');
      total += data.length;
      if (total > 2_000_000) {
        file.terminate();
        throw new Error('docx_xml_budget');
      }
      chunks.push(data);
    };
    file.start();
  });
  unzip.register(UnzipInflate);
  for (let offset = 0; offset < bytes.length; offset += 8192)
    unzip.push(bytes.slice(offset, offset + 8192), offset + 8192 >= bytes.length);
  if (!found) throw new Error('docx_document_missing');
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return strFromU8(result);
}
function xmlText(xml: string): string {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('unsafe_docx_xml');
  const nodes = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    processEntities: true,
    parseTagValue: false,
  }).parse(xml);
  let text = '',
    visited = 0;
  const visit = (list: any[], depth = 0) => {
    if (depth > 100) throw new Error('docx_depth_budget');
    for (const node of list) {
      if (++visited > 50000) throw new Error('docx_node_budget');
      for (const [key, value] of Object.entries(node)) {
        if (key === '#text') text += String(value);
        else if (key === 'w:tab') text += ' ';
        else if (key === 'w:br') text += '\n';
        else if (key === 'w:del' || key === 'w:instrText') continue;
        else if (Array.isArray(value)) {
          if (key === 'w:p' && JSON.stringify(value).includes('\"w:numPr\"')) text += '- ';
          visit(value, depth + 1);
          if (key === 'w:p') text += '\n';
        }
      }
    }
  };
  visit(nodes);
  return text;
}
// Execute this function in a terminable worker. A Promise timeout alone cannot stop PDF/XML CPU work.
export async function extractResume(bytes: Uint8Array, filename: string) {
  if (!bytes.length || bytes.length > MAX_DOCUMENT_BYTES) throw new Error('document_size_limit');
  const lower = filename.toLowerCase();
  let text = '',
    warnings: string[] = [];
  if (lower.endsWith('.pdf')) {
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-')
      throw new Error('invalid_pdf_signature');
    const pdf = await getDocumentProxy(Uint8Array.from(bytes), {
      useSystemFonts: false,
      disableFontFace: true,
      maxImageSize: 1_000_000,
      disableAutoFetch: true,
    });
    try {
      if (pdf.numPages > 20) throw new Error('pdf_page_limit');
      const extracted = await extractText(pdf, { mergePages: false });
      text = extracted.text.join('\n\n');
      if (text.trim().length < 30) throw new Error('pdf_has_no_reliable_text_ocr_required');
      warnings.push(
        'PDF reading order can differ from the page. Review columns, dates, symbols and contact details. OCR is not performed.',
      );
    } finally {
      await pdf.loadingTask.destroy();
    }
  } else if (lower.endsWith('.docx')) {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error('invalid_docx_signature');
    text = xmlText(documentXml(bytes));
    warnings.push(
      'Imported the main document body. Headers, footers, comments, tracked deletions, text boxes and embedded content are not trusted career facts. Review the extracted text.',
    );
  } else if (lower.endsWith('.txt')) text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  else throw new Error('unsupported_document_use_pdf_docx_or_utf8_text');
  const resume = await structureResume(text, filename);
  return { ...resume, warnings: [...resume.warnings, ...warnings] };
}
export function googleDocId(url: string): string {
  const value = new URL(url);
  const match =
    value.hostname === 'docs.google.com' &&
    value.protocol === 'https:' &&
    !value.username &&
    !value.password &&
    value.pathname.match(/^\/document\/d\/([a-zA-Z0-9_-]{10,200})(?:\/|$)/);
  if (!match) throw new Error('invalid_google_document_url');
  return match[1]!;
}
// Separate authorized Drive grant required. Never re-use Gmail-only authorization or fetch arbitrary URLs.
export async function exportGoogleDoc(
  url: string,
  accessToken: string,
  transport: typeof fetch = fetch,
): Promise<Uint8Array> {
  const id = googleDocId(url);
  const response = await transport(
    `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=application%2Fvnd.openxmlformats-officedocument.wordprocessingml.document`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      redirect: 'error',
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!response.ok) throw new Error(`google_doc_export_${response.status}`);
  if (Number(response.headers.get('content-length')) > MAX_DOCUMENT_BYTES)
    throw new Error('document_size_limit');
  if (!response.body) throw new Error('google_doc_export_empty');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.length;
      if (length > MAX_DOCUMENT_BYTES) throw new Error('document_size_limit');
      chunks.push(next.value);
    }
  } finally {
    await reader.cancel();
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
