import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma, tenantDb } from '@pursuit/database';
import type { TenantDb } from '@pursuit/database';

/**
 * Prisma service shared by every module. All tenant data access goes through
 * tenantDb (packages/database) which enforces tenant scoping.
 */
@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  readonly db: PrismaClient;

  constructor() {
    this.db = new PrismaClient();
  }

  async onModuleInit(): Promise<void> {
    await this.db.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.db.$disconnect();
  }

  tenant(tenantId: string): TenantDb {
    return tenantDb(this.db, tenantId);
  }

  /** Write an outbox event; SSE hub streams it to all clients of the tenant. */
  async emit(
    tenantId: string,
    topic: string,
    entityRef: string | null,
    payload: Record<string, unknown> = {},
  ): Promise<void> {
    await this.db.outboxEvent.create({
      data: { tenantId, topic, entityRef, payload: payload as Prisma.InputJsonValue },
    });
  }
}
