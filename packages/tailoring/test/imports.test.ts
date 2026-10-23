import { it, expect, vi } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { extractResume, exportGoogleDoc, googleDocId } from '../src/imports.js';
it('extracts DOCX body paragraphs and bullets without loading external relationships or embedded objects', async () => {
  const xml = `<w:document xmlns:w="w"><w:body><w:p><w:r><w:t>Alex Morgan</w:t></w:r></w:p><w:p><w:r><w:t>- Tested APIs with SQL.</w:t></w:r></w:p></w:body></w:document>`;
  const bytes = zipSync({
    'word/document.xml': strToU8(xml),
    'word/_rels/document.xml.rels': strToU8('https://attacker.example'),
    'word/embeddings/a.bin': strToU8('ignore'),
  });
  const r = await extractResume(bytes, 'resume.docx');
  expect(r.sourceText).toContain('Alex Morgan\n- Tested APIs with SQL.');
  expect(r.reviewedAt).toBeNull();
  expect(r.sourceText).not.toContain('attacker');
});
it('rejects empty, disguised and oversized inputs', async () => {
  await expect(extractResume(strToU8('not pdf'), 'resume.pdf')).rejects.toThrow(
    'invalid_pdf_signature',
  );
  await expect(extractResume(new Uint8Array(8_000_001), 'resume.txt')).rejects.toThrow(
    'size_limit',
  );
  await expect(extractResume(strToU8('content'), 'resume.docm')).rejects.toThrow(
    'unsupported_document',
  );
});
it('rejects XML entities and excessive decompressed DOCX content', async () => {
  await expect(
    extractResume(
      zipSync({ 'word/document.xml': strToU8('<!DOCTYPE x><w:document/>') }),
      'resume.docx',
    ),
  ).rejects.toThrow('unsafe_docx_xml');
  await expect(
    extractResume(zipSync({ 'word/document.xml': strToU8('x'.repeat(2_000_001)) }), 'resume.docx'),
  ).rejects.toThrow('docx_xml_budget');
});
it('exports only a validated Google Docs ID through a fixed authorized endpoint', async () => {
  expect(() => googleDocId('https://evil.example/document/d/abcdefghijk')).toThrow();
  const transport = vi
    .fn()
    .mockResolvedValue(new Response(new Uint8Array([80, 75]), { status: 200 }));
  const bytes = await exportGoogleDoc(
    'https://docs.google.com/document/d/abcdefghijk/edit',
    'fixture-secret',
    transport,
  );
  expect(bytes.length).toBe(2);
  expect(transport.mock.calls[0][0]).toMatch(
    /^https:\/\/www.googleapis.com\/drive\/v3\/files\/abcdefghijk\/export/,
  );
  expect(transport.mock.calls[0][1].redirect).toBe('error');
});
it('does not treat a missing Drive grant as a successful document import', async () => {
  await expect(
    exportGoogleDoc(
      'https://docs.google.com/document/d/abcdefghijk/edit',
      'fixture',
      vi.fn().mockResolvedValue(new Response('', { status: 403 })),
    ),
  ).rejects.toThrow('google_doc_export_403');
});
