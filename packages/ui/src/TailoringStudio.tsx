import React, { useState } from 'react';
import {
  structureResume,
  tailor,
  Voice,
  selectionPrompt,
  parseSelection,
  styleSignals,
  type Resume,
  type Packet,
} from '@pursuit/tailoring';
import type { Opportunity } from './career-data';
export type TailoringState = {
  resume?: Resume;
  packet?: Packet;
  voice?: Voice;
  artifactHash?: string;
};
export function TailoringStudio({
  value = {},
  opportunities,
  onSave,
  onModel,
  onSavePdf,
  onExportPdf,
}: {
  value?: TailoringState;
  opportunities: Opportunity[];
  onSave: (state: TailoringState) => Promise<boolean>;
  onModel?: (prompt: string) => Promise<string>;
  onSavePdf?: (hash: string, bytes: Uint8Array) => Promise<void>;
  onExportPdf?: (hash: string) => Promise<string>;
}) {
  const [draft, setDraft] = useState(value.resume?.sourceText ?? '');
  const [name, setName] = useState(value.resume?.sourceName ?? 'resume.txt');
  const [reviewed, setReviewed] = useState(Boolean(value.resume?.reviewedAt));
  const [jobId, setJobId] = useState(opportunities[0]?.id ?? '');
  const [tone, setTone] = useState<Voice['tone']>(value.voice?.tone ?? 'professional');
  const [motivation, setMotivation] = useState(value.voice?.motivation ?? '');
  const [sample, setSample] = useState(value.voice?.writingSamples?.[0] ?? '');
  const [template, setTemplate] = useState<'classic' | 'compact'>(
    value.packet?.template ?? 'classic',
  );
  const [warnings, setWarnings] = useState<string[]>(value.resume?.warnings ?? []);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage('');
    setReviewed(false);
    let worker: Worker | undefined;
    try {
      if (file.size > 8_000_000) throw new Error('Choose a file smaller than 8 MB.');
      const bytes = await file.arrayBuffer();
      const result = await new Promise<Resume>((resolve, reject) => {
        worker = new Worker(new URL('./document.worker.ts', import.meta.url), { type: 'module' });
        const timer = setTimeout(() => {
          worker?.terminate();
          reject(new Error('Import took too long. Export a simpler text-based document.'));
        }, 15000);
        worker.onmessage = (event) => {
          clearTimeout(timer);
          event.data.error ? reject(new Error(event.data.error)) : resolve(event.data.resume);
        };
        worker.onerror = () => {
          clearTimeout(timer);
          reject(new Error('Document import failed. Try a DOCX or text export.'));
        };
        worker.postMessage({ bytes, filename: file.name }, [bytes]);
      });
      setDraft(result.sourceText);
      setName(file.name);
      setWarnings(result.warnings);
    } catch (e) {
      setMessage(String(e));
    } finally {
      worker?.terminate();
      setBusy(false);
    }
  }
  async function prepare(useModel = false) {
    setBusy(true);
    setMessage('');
    try {
      const job = opportunities.find((j) => j.id === jobId);
      if (!job) throw new Error('Add or select a job posting first.');
      if (!reviewed) throw new Error('Review the extracted resume first.');
      const resume = await structureResume(draft, name);
      resume.reviewedAt = new Date().toISOString();
      resume.warnings = warnings;
      const voice = Voice.parse({ tone, motivation, writingSamples: sample ? [sample] : [] });
      const role = { id: job.id, title: job.role, company: job.company, description: job.posting };
      let selectedIds: string[] | undefined;
      if (useModel) {
        if (!onModel) throw new Error('Connect a model first.');
        selectedIds = parseSelection(await onModel(selectionPrompt(resume, role)));
      }
      const packet = await tailor(resume, role, { voice, template, selectedIds });
      if (!(await onSave({ resume, packet, voice })))
        throw new Error('The packet could not be saved.');
      setMessage(
        'Saved a role-specific packet. Original facts and wording were preserved. Review the selection before exporting.',
      );
    } catch (e) {
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function exportPdf() {
    if (!value.packet || !value.resume) return;
    setBusy(true);
    setMessage('');
    try {
      if (value.artifactHash && onExportPdf) {
        setMessage(`PDF exported to ${await onExportPdf(value.artifactHash)}`);
        return;
      }
      const { renderResumePdf } = await import('@pursuit/tailoring/pdf');
      const { resumeFontUrl } = await import('@pursuit/tailoring/font-url');
      const fontResponse = await fetch(resumeFontUrl);
      if (!fontResponse.ok) throw new Error('Bundled resume font unavailable.');
      const result = await renderResumePdf(
        value.packet,
        value.resume,
        new Uint8Array(await fontResponse.arrayBuffer()),
      );
      if (onSavePdf) await onSavePdf(result.hash, result.bytes);
      if (!(await onSave({ ...value, artifactHash: result.hash })))
        throw new Error('Could not save the PDF record.');
      if (onExportPdf) setMessage(`PDF saved and exported to ${await onExportPdf(result.hash)}`);
      else {
        const url = URL.createObjectURL(
          new Blob([Uint8Array.from(result.bytes)], { type: 'application/pdf' }),
        );
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.pdf';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setMessage(`Exported ${result.pages} page PDF.`);
      }
    } catch (e) {
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="cw-tailoring" aria-label="Resume tailoring studio">
      <p>
        Import your original. Check the extraction. Prepare a version for a specific role. Pursuit
        selects supported experience; it does not add employers, dates, qualifications or results.
      </p>
      <label>
        Original resume{' '}
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          disabled={busy}
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      </label>
      <p>
        For Google Docs, download as Word (.docx) and import it here. Direct Drive authorization is
        a separate integration.
      </p>
      {warnings.map((warning) => (
        <p key={warning} className="cw-muted">
          {warning}
        </p>
      ))}
      <label>
        Review extracted text{' '}
        <textarea
          aria-label="Review extracted text"
          rows={12}
          value={draft}
          maxLength={80000}
          onChange={(e) => {
            setDraft(e.target.value);
            setReviewed(false);
          }}
        />
      </label>
      <label>
        <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />{' '}
        I checked my name, roles, employers, dates, qualifications and results.
      </label>
      <label>
        Target role{' '}
        <select value={jobId} onChange={(e) => setJobId(e.target.value)}>
          <option value="">Choose a saved role</option>
          {opportunities.map((j) => (
            <option key={j.id} value={j.id}>
              {j.company} · {j.role}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>How should your introduction sound?</legend>
        {(
          [
            [
              'story',
              'Story-led',
              'The opening caught my attention. Here is the work behind my interest.',
            ],
            [
              'professional',
              'Professional',
              'I am applying for the role. These examples show my relevant experience.',
            ],
            [
              'direct',
              'Direct',
              'I would like to be considered. Would you be open to a conversation?',
            ],
          ] as const
        ).map(([id, label, example]) => (
          <label key={id}>
            <input type="radio" name="voice" checked={tone === id} onChange={() => setTone(id)} />
            <strong>{label}</strong>
            <span>{example}</span>
          </label>
        ))}
      </fieldset>
      <label>
        Why this work matters to you, in your words{' '}
        <textarea
          aria-label="Why this work matters to you, in your words"
          rows={3}
          maxLength={1200}
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
        />
      </label>
      <label>
        A short writing sample (optional){' '}
        <textarea
          aria-label="Writing sample"
          rows={2}
          maxLength={2000}
          value={sample}
          onChange={(e) => setSample(e.target.value)}
        />
      </label>
      {sample && (
        <p>
          Your sample averages {styleSignals([sample]).averageSentenceWords} words per sentence.{' '}
          {styleSignals([sample]).usesContractions
            ? 'Contractions detected; the informal greeting follows that preference.'
            : 'No contraction preference detected.'}{' '}
          Your selected tone takes priority.
        </p>
      )}
      <label>
        PDF template{' '}
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value as 'classic' | 'compact')}
        >
          <option value="classic">Classic · single column</option>
          <option value="compact">Compact · single column</option>
        </select>
      </label>
      <div className="cw-row-actions">
        <button disabled={busy || !reviewed || !jobId} onClick={() => void prepare()}>
          Prepare without a model
        </button>
        {onModel && (
          <button disabled={busy || !reviewed || !jobId} onClick={() => void prepare(true)}>
            Ask my model to select experience
          </button>
        )}
      </div>
      {message && <p role="status">{message}</p>}
      {value.packet && (
        <div className="cw-tailoring-result">
          <h2>Review your packet</h2>
          <p>
            {value.packet.role.company} · {value.packet.role.title}
          </p>
          <p>
            {value.packet.selectedIds.length} source blocks kept · {value.packet.omittedIds.length}{' '}
            omitted. No wording was rewritten.
          </p>
          {value.packet.gaps.map((gap) => (
            <p key={gap}>{gap}</p>
          ))}
          <details>
            <summary>Selected resume and source references</summary>
            {value.packet.blocks.map((b) => (
              <p key={b.id}>
                <small>
                  {b.id.split(':').pop()} · {b.section}
                </small>
                <br />
                {b.text}
              </p>
            ))}
          </details>
          <label>
            Cover letter preview
            <textarea
              aria-label="Cover letter preview"
              rows={12}
              readOnly
              value={value.packet.coverLetter}
            />
          </label>
          <button disabled={busy} onClick={() => void exportPdf()}>
            {value.artifactHash ? 'Export saved PDF' : 'Build and export PDF'}
          </button>
        </div>
      )}
    </section>
  );
}
