import {
  BadRequestException,
  BadGatewayException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { Worker } from 'node:worker_threads';
import {
  Resume,
  Voice,
  structureResume,
  validateResume,
  tailor,
  selectionPrompt,
  parseSelection,
  digest,
} from '@pursuit/tailoring';
import { renderResumePdf } from '@pursuit/tailoring/pdf';
import { DbService } from './db.service';
import { ConnectionsService } from './connections.service';
import type { SessionPrincipal } from './auth.service';
@Injectable()
export class TailoringService {
  private imports = 0;
  constructor(
    private readonly db: DbService,
    private readonly connections: ConnectionsService,
  ) {}
  private root() {
    return resolve(process.env.RESUME_STORAGE_DIR ?? '.data/resumes');
  }
  private path(key: string) {
    const p = resolve(this.root(), key);
    if (!p.startsWith(this.root() + '/')) throw new Error('invalid_storage_key');
    return p;
  }
  private async write(key: string, body: string | Uint8Array) {
    const path = this.path(key);
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await writeFile(path, body, { mode: 0o600, flag: 'wx' });
  }
  private scope(a: SessionPrincipal) {
    return { tenantId: a.tenantId, ownerId: a.userId };
  }
  async import(a: SessionPrincipal, file: { buffer: Buffer; originalname: string }) {
    if (this.imports >= 2)
      throw new ServiceUnavailableException({ error: 'document_workers_busy' });
    if (file.buffer.length > 8_000_000)
      throw new BadRequestException({ error: 'document_size_limit' });
    this.imports++;
    try {
      const resume = await new Promise<Resume>((done, fail) => {
        const worker = new Worker(require.resolve('@pursuit/tailoring/worker'), {
          workerData: { bytes: file.buffer, filename: file.originalname },
          resourceLimits: { maxOldGenerationSizeMb: 192 },
        });
        const timer = setTimeout(() => {
          void worker.terminate();
          fail(new BadRequestException({ error: 'document_import_timeout' }));
        }, 15000);
        worker.once('message', (value) => {
          clearTimeout(timer);
          void worker.terminate();
          value.error
            ? fail(new BadRequestException({ error: value.error }))
            : done(Resume.parse(value.resume));
        });
        worker.once('error', () => {
          clearTimeout(timer);
          fail(new BadRequestException({ error: 'document_import_failed' }));
        });
        worker.once('exit', (code) => {
          if (code !== 0) {
            clearTimeout(timer);
            fail(new BadRequestException({ error: 'document_worker_stopped' }));
          }
        });
      });
      const masterId = randomUUID();
      const key = `${a.tenantId}/${a.userId}/${masterId}/source.json`;
      const originalFile = {
        key: `${dirname(key)}/original.bin`,
        hash: await digest(file.buffer),
        bytes: file.buffer.length,
      };
      await this.write(originalFile.key, file.buffer);
      await this.write(key, JSON.stringify({ original: resume, resume, originalFile }));
      try {
        const master = await this.db.db.resumeMaster.create({
          data: {
            id: masterId,
            ...this.scope(a),
            fileName: file.originalname.slice(0, 200),
            objectKey: key,
            contentType: 'application/json',
            bytes: file.buffer.length,
            parsedFactsVersion: `import-v1:${resume.sourceId}`,
          },
        });
        return { id: master.id, resume };
      } catch (e) {
        await rm(dirname(this.path(key)), { recursive: true, force: true });
        throw e;
      }
    } finally {
      this.imports--;
    }
  }
  private async master(a: SessionPrincipal, id: string) {
    const row = await this.db.db.resumeMaster.findFirst({ where: { id, ...this.scope(a) } });
    if (!row) throw new NotFoundException({ error: 'resume_not_found' });
    return row;
  }
  async source(a: SessionPrincipal, id: string) {
    const master = await this.master(a, id);
    const body = JSON.parse(await readFile(this.path(master.objectKey), 'utf8'));
    return {
      master,
      original: body.original,
      originalFile: body.originalFile,
      resume: await validateResume(body.resume),
    };
  }
  async original(a: SessionPrincipal, id: string) {
    const source = await this.source(a, id);
    if (!source.originalFile?.key)
      throw new NotFoundException({ error: 'original_document_unavailable' });
    const bytes = await readFile(this.path(source.originalFile.key));
    if ((await digest(bytes)) !== source.originalFile.hash)
      throw new ConflictException({ error: 'original_document_integrity_error' });
    return bytes;
  }
  async review(a: SessionPrincipal, id: string, text: string, expectedHash: string) {
    const old = await this.source(a, id);
    if (old.resume.sourceId !== expectedHash)
      throw new ConflictException({ error: 'resume_changed' });
    const resume = await structureResume(text, old.resume.sourceName);
    resume.reviewedAt = new Date().toISOString();
    const key = `${dirname(old.master.objectKey)}/${randomUUID()}.json`;
    await this.write(
      key,
      JSON.stringify({ original: old.original, resume, originalFile: old.originalFile }),
    );
    const changed = await this.db.db.resumeMaster.updateMany({
      where: { id, ...this.scope(a), objectKey: old.master.objectKey },
      data: { objectKey: key, parsedFactsVersion: `reviewed-v1:${resume.sourceId}` },
    });
    if (!changed.count) {
      await rm(this.path(key), { force: true });
      throw new ConflictException({ error: 'resume_changed' });
    }
    return { id, resume };
  }
  async prepare(
    a: SessionPrincipal,
    input: {
      masterId: string;
      jobId: string;
      voice?: unknown;
      template?: 'classic' | 'compact';
      connectionId?: string;
    },
  ): Promise<{ id: string; packet: unknown; cached: boolean; pdfHash?: string }> {
    const { resume, master } = await this.source(a, input.masterId);
    if (!resume.reviewedAt) throw new BadRequestException({ error: 'review_resume_first' });
    const match = await this.db.db.jobMatch.findFirst({
      where: { tenantId: a.tenantId, jobId: input.jobId },
      include: {
        job: {
          include: { company: true, snapshots: { orderBy: { observedAt: 'desc' }, take: 1 } },
        },
      },
    });
    if (!match || match.job.status === 'CLOSED')
      throw new BadRequestException({ error: 'job_missing_or_closed' });
    const role = {
      id: match.job.id,
      title: match.job.title,
      company: match.job.company.name,
      description: match.job.snapshots[0]?.description ?? '',
      url: match.job.canonicalUrl,
    };
    const voice = Voice.parse(input.voice ?? {});
    const key = await digest(
      JSON.stringify({
        resume: resume.sourceId,
        role,
        voice,
        template: input.template ?? 'classic',
        connection: input.connectionId ?? null,
        version: 1,
      }),
    );
    const existing = await this.db.db.resumeVersion.findFirst({
      where: { tenantId: a.tenantId, masterId: input.masterId, contentHash: key },
    });
    if (existing) return { id: existing.id, packet: existing.diffJson, cached: true };
    let selectedIds: string[] | undefined;
    if (input.connectionId) {
      const result = await this.connections.generate(
        a,
        input.connectionId,
        selectionPrompt(resume, role),
        {
          maxOutputTokens: 512,
          schema: {
            type: 'object',
            properties: { selectedIds: { type: 'array', items: { type: 'string' }, maxItems: 12 } },
            required: ['selectedIds'],
            additionalProperties: false,
          },
        },
      );
      try {
        selectedIds = parseSelection(result.text);
        const allowed = new Set(resume.blocks.map((b) => b.id));
        if (selectedIds.some((id) => !allowed.has(id))) throw new Error();
      } catch {
        throw new BadGatewayException({ error: 'model_selection_invalid_no_packet_saved' });
      }
    }
    const current = await this.master(a, input.masterId);
    if (current.objectKey !== master.objectKey)
      throw new ConflictException({ error: 'resume_changed_during_preparation' });
    const packet = await tailor(resume, role, { voice, template: input.template, selectedIds });
    const font = await readFile(require.resolve('@pursuit/tailoring/font'));
    const result = await renderResumePdf(packet, resume, font);
    const pdfKey = `${dirname(master.objectKey)}/${randomUUID()}.pdf`;
    await this.write(pdfKey, result.bytes);
    try {
      const version = await this.db.db.resumeVersion.create({
        data: {
          tenantId: a.tenantId,
          masterId: input.masterId,
          jobId: input.jobId,
          label: `${role.company} · ${role.title}`,
          templateVersion: `${packet.template}-1`,
          contentHash: key,
          pdfKey,
          diffJson: JSON.parse(JSON.stringify(packet)),
          status: 'DRAFT',
        },
      });
      return { id: version.id, packet, pdfHash: result.hash, cached: false };
    } catch (e) {
      await rm(this.path(pdfKey), { force: true });
      throw e;
    }
  }
  async pdf(a: SessionPrincipal, id: string) {
    const version = await this.db.db.resumeVersion.findFirst({
      where: { id, tenantId: a.tenantId, master: { ownerId: a.userId } },
    });
    if (!version?.pdfKey) throw new NotFoundException({ error: 'resume_pdf_not_found' });
    return readFile(this.path(version.pdfKey));
  }
}
