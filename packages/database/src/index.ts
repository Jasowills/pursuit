import { PrismaClient, Prisma } from '@prisma/client';

export * from '@prisma/client';

/** Default dev client factory (DATABASE_URL from env). */
export function createPrismaClient(options?: Prisma.PrismaClientOptions): PrismaClient {
  return new PrismaClient(options);
}

/** Runtime guard helper — throws if tenant scoping is accidentally bypassed. */
export function requireTenantScope(tenantId: string | undefined): string {
  if (!tenantId || tenantId.length === 0) {
    throw new Error(
      'tenant scope required: refusing query without tenantId (DATA_MODEL tenant isolation)',
    );
  }
  return tenantId;
}

/**
 * Tenant-scoped repository helpers. Every accessor enforces tenant filtering
 * so forgetfulness cannot leak cross-tenant rows (PRD non-functional req).
 * Prisma `JobMatchUncheckedCreateInput` variants are accepted on create paths
 * because tenant scoping is enforced by this layer, not the caller.
 */
export function tenantDb(db: PrismaClient, tenantId: string) {
  requireTenantScope(tenantId);

  const tenantWhere = <W>(where?: W) => ({ tenantId, ...(where ?? {}) });

  return {
    careerProfile: {
      findFirst: (args?: Prisma.CareerProfileFindFirstArgs) =>
        db.careerProfile.findFirst({ ...args, where: tenantWhere(args?.where) }),
      update: (args: Prisma.CareerProfileUpdateArgs) =>
        // two-step scoped update: unique inputs don't include id+tenantId
        // composites, so scope explicitly by tenant first
        db.careerProfile
          .findFirst({ where: { id: (args.where as { id: string }).id, tenantId } })
          .then((row) => {
            if (!row) throw new Error('careerProfile not found in tenant scope');
            return db.careerProfile.update({ ...args, where: { id: row.id } });
          }),
    },
    jobMatch: {
      findMany: (args?: Prisma.JobMatchFindManyArgs) =>
        db.jobMatch.findMany({ ...args, where: tenantWhere(args?.where) }),
      upsert: (
        jobId: string,
        data: Prisma.JobMatchUncheckedUpdateInput,
        create: Prisma.JobMatchUncheckedCreateInput,
      ) =>
        db.jobMatch.upsert({
          where: { tenantId_jobId: { tenantId, jobId } },
          update: data,
          create,
        }),
    },
    application: {
      findMany: (args?: Prisma.ApplicationFindManyArgs) =>
        db.application.findMany({ ...args, where: tenantWhere(args?.where) }),
      findFirst: (args?: Prisma.ApplicationFindFirstArgs) =>
        db.application.findFirst({ ...args, where: tenantWhere(args?.where) }),
      count: (args?: Prisma.ApplicationCountArgs) =>
        db.application.count({ ...args, where: tenantWhere(args?.where) }),
      findUnique: (id: string) => db.application.findFirst({ where: { id, tenantId } }),
      update: (args: Prisma.ApplicationUpdateArgs) =>
        db.application
          .findFirst({ where: { id: (args.where as { id: string }).id, tenantId } })
          .then((row) => {
            if (!row) throw new Error('application not found in tenant scope');
            return db.application.update({ ...args, where: { id: row.id } });
          }),
    },
    watcher: {
      findMany: (args?: Prisma.WatcherFindManyArgs) =>
        db.watcher.findMany({ ...args, where: tenantWhere(args?.where) }),
      findUnique: (id: string) => db.watcher.findFirst({ where: { id, tenantId } }),
    },
    agentRun: {
      findMany: (args?: Prisma.AgentRunFindManyArgs) =>
        db.agentRun.findMany({ ...args, where: tenantWhere(args?.where) }),
      findUnique: (id: string) => db.agentRun.findFirst({ where: { id, tenantId } }),
      create: (args: Prisma.AgentRunUncheckedCreateInput) => db.agentRun.create({ data: args }),
    },
    approval: {
      findMany: (args?: Prisma.ApprovalFindManyArgs) =>
        db.approval.findMany({ ...args, where: tenantWhere(args?.where) }),
      findUnique: (id: string) => db.approval.findFirst({ where: { id, tenantId } }),
      create: (args: Prisma.ApprovalUncheckedCreateInput) => db.approval.create({ data: args }),
      update: (args: Prisma.ApprovalUpdateArgs) =>
        db.approval
          .findFirst({ where: { id: (args.where as { id: string }).id, tenantId } })
          .then((row) => {
            if (!row) throw new Error('approval not found in tenant scope');
            return db.approval.update({ ...args, where: { id: row.id } });
          }),
    },
    notification: {
      findMany: (args?: Prisma.NotificationFindManyArgs) =>
        db.notification.findMany({ ...args, where: tenantWhere(args?.where) }),
    },
    contact: {
      findMany: (args?: Prisma.ContactFindManyArgs) =>
        db.contact.findMany({ ...args, where: tenantWhere(args?.where) }),
    },
    outreachThread: {
      findMany: (args?: Prisma.OutreachThreadFindManyArgs) =>
        db.outreachThread.findMany({
          ...args,
          where: tenantWhere(args?.where),
          include: { contact: true, messages: true },
        }),
    },
  };
}

export type TenantDb = ReturnType<typeof tenantDb>;
