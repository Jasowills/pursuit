import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import { ApplicationQueue, AshbyAdapter, formHash, resolveApplication } from '@pursuit/application';
import { digest } from '@pursuit/tailoring';
import { createReader } from '@pursuit/discovery';
import { DbService } from './db.service';
import { TailoringService } from './tailoring.service';
import type { SessionPrincipal } from './auth.service';
@Injectable()
export class ApplicationExecutionService implements OnModuleInit, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | undefined;
  private scanning = false;
  onModuleInit() {
    if (
      process.env.APPLICATION_WORKER_ENABLED === 'true' &&
      process.env.ENABLE_ASHBY_EXECUTION === 'true'
    ) {
      this.timer = setInterval(() => void this.tick().catch(() => {}), 30000);
      this.timer.unref();
    }
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async tick() {
    if (this.scanning) return;
    this.scanning = true;
    const uuid = /^[a-f0-9-]{36}$/;
    try {
      const root = process.env.APPLICATION_STORAGE_DIR ?? '.data/applications';
      const tenants = await readdir(root, { withFileTypes: true }).catch(() => []);
      for (const tenant of tenants) {
        if (!tenant.isDirectory() || !uuid.test(tenant.name)) continue;
        const users = await readdir(join(root, tenant.name), { withFileTypes: true });
        for (const user of users) {
          if (!user.isDirectory() || !uuid.test(user.name)) continue;
          const membership = await this.db.db.membership.findFirst({
            where: { tenantId: tenant.name, userId: user.name, tenant: { status: 'ACTIVE' } },
          });
          const a = {
            tenantId: tenant.name,
            userId: user.name,
            email: '',
            displayName: '',
            sessionId: 'exact-payload-approval',
          };
          const q = this.queue(a);
          if (!membership) {
            q.policy(false);
            q.close();
            continue;
          }
          const rows = q.list();
          q.close();
          for (const row of rows) {
            if (row.state === 'AUTHORIZED' && typeof row.id === 'string')
              await this.run(a, row.id).catch(() => {});
          }
        }
      }
    } finally {
      this.scanning = false;
    }
  }
  private active = 0;
  constructor(
    private readonly db: DbService,
    private readonly tailoring: TailoringService,
  ) {}
  private queue(a: SessionPrincipal) {
    return new ApplicationQueue(
      join(
        process.env.APPLICATION_STORAGE_DIR ?? '.data/applications',
        a.tenantId,
        a.userId,
        'queue.sqlite',
      ),
    );
  }
  private browser() {
    if (
      process.env.ENABLE_ASHBY_EXECUTION !== 'true' ||
      !process.env.APPLICATION_BROWSER_EXECUTABLE
    )
      throw new ServiceUnavailableException({ error: 'ashby_execution_not_configured' });
    return process.env.APPLICATION_BROWSER_EXECUTABLE;
  }
  async resolve(url: string) {
    return resolveApplication(url, createReader());
  }
  private async packet(a: SessionPrincipal, id: string) {
    const version = await this.db.db.resumeVersion.findFirst({
      where: { id, tenantId: a.tenantId, master: { ownerId: a.userId } },
      include: { job: true },
    });
    if (!version?.job || version.job.status === 'CLOSED')
      throw new NotFoundException({ error: 'active_application_packet_not_found' });
    const url = new URL(version.job.canonicalUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'jobs.ashbyhq.com')
      throw new BadRequestException({ error: 'only_ashby_hosted_execution_supported' });
    return { version, pdf: await this.tailoring.pdf(a, id), url: url.toString() };
  }
  async inspect(a: SessionPrincipal, id: string) {
    const executable = this.browser();
    if (this.active >= 2)
      throw new ServiceUnavailableException({ error: 'application_browsers_busy' });
    this.active++;
    let adapter: AshbyAdapter | undefined;
    try {
      const packet = await this.packet(a, id);
      adapter = await AshbyAdapter.launch(packet.url, executable);
      const form = await adapter.observe();
      return {
        form,
        formHash: await formHash(form),
        pdfHash: await digest(packet.pdf),
        packetVersionId: id,
      };
    } finally {
      await adapter?.close();
      this.active--;
    }
  }
  async create(
    a: SessionPrincipal,
    input: {
      packetVersionId: string;
      formHash: string;
      answers: Record<string, string | boolean>;
      eligibilityConfirmed: true;
    },
    previousId?: string,
  ) {
    const p = await this.packet(a, input.packetVersionId);
    const queue = this.queue(a);
    try {
      const payload = {
        personId: a.userId,
        packetVersionId: input.packetVersionId,
        jobUrl: p.url,
        packetHash: await digest(JSON.stringify(p.version.diffJson)),
        pdfHash: await digest(p.pdf),
        answers: input.answers,
        formHash: input.formHash,
      };
      return previousId ? await queue.revise(previousId, payload) : await queue.add(payload);
    } finally {
      queue.close();
    }
  }
  list(a: SessionPrincipal) {
    const q = this.queue(a);
    try {
      return q.list();
    } finally {
      q.close();
    }
  }
  authorize(a: SessionPrincipal, id: string, hash: string) {
    const q = this.queue(a);
    try {
      return q.authorize(id, hash);
    } catch {
      throw new ConflictException({ error: 'application_changed_or_locked' });
    } finally {
      q.close();
    }
  }
  policy(a: SessionPrincipal, enabled: boolean, dailyLimit: number) {
    const q = this.queue(a);
    try {
      q.policy(enabled, dailyLimit);
      return { enabled, dailyLimit, timezone: 'UTC', outreach: 'separate_approval' };
    } finally {
      q.close();
    }
  }
  async run(a: SessionPrincipal, id: string) {
    const executable = this.browser();
    if (this.active >= 2)
      throw new ServiceUnavailableException({ error: 'application_browsers_busy' });
    const q = this.queue(a);
    this.active++;
    try {
      let row;
      try {
        row = q.get(id);
      } catch {
        throw new NotFoundException({ error: 'application_plan_not_found' });
      }
      if (!q.ready(id)) return row;
      const p = await this.packet(a, row.payload.packetVersionId!);
      const fresh = await resolveApplication(p.url, createReader()).catch(() => null);
      if (
        !fresh ||
        fresh.status !== 'resolved' ||
        !fresh.job ||
        (fresh.job.validThrough && Date.parse(fresh.job.validThrough) <= Date.now()) ||
        fresh.job.description !== (p.version.diffJson as any)?.role?.description
      ) {
        q.hold(id, 'job_changed_or_unverified');
        throw new ConflictException({ error: 'job_changed_or_unverified' });
      }
      if ((await digest(JSON.stringify(p.version.diffJson))) !== row.payload.packetHash)
        throw new ConflictException({ error: 'packet_changed' });
      return await q.run(id, p.pdf, async () => {
        const adapter = await AshbyAdapter.launch(p.url, executable);
        return {
          observe: () => adapter.observe(),
          fill: (payload, pdf) => adapter.fill(payload, pdf),
          close: () => adapter.close(),
          submit: async () => {
            const member = await this.db.db.membership.findFirst({
              where: { tenantId: a.tenantId, userId: a.userId, tenant: { status: 'ACTIVE' } },
            });
            if (!member) throw new Error('authorization_revoked');
            await this.packet(a, row.payload.packetVersionId!);
            return adapter.submit();
          },
        };
      });
    } catch (error) {
      q.hold(id, 'execution_needs_review');
      throw error;
    } finally {
      q.close();
      this.active--;
    }
  }
}
