import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from './db.service';
import { CredentialVault } from './credential-vault';
import { ModelGateway, ModelProvider, PROVIDERS } from './model-gateway';
import type { SessionPrincipal } from './auth.service';
import type { UserConnection } from '@pursuit/database';

@Injectable()
export class ConnectionsService {
  readonly vault = new CredentialVault();
  readonly gateway = new ModelGateway();
  constructor(private readonly db: DbService) {}

  owner(a: SessionPrincipal, provider: string) {
    return `${a.tenantId}:${a.userId}:${provider}`;
  }
  scope(a: SessionPrincipal) {
    return { tenantId: a.tenantId, userId: a.userId };
  }

  async list(a: SessionPrincipal) {
    const connections = await this.db.db.userConnection.findMany({
      where: { ...this.scope(a), provider: { in: PROVIDERS.map((p) => p.id) } },
      select: {
        id: true,
        provider: true,
        models: true,
        model: true,
        testedAt: true,
        updatedAt: true,
      },
    });
    return {
      providers: PROVIDERS,
      connections: connections.map((c) => ({ ...c, models: c.models as string[] })),
      configured: this.vault.available(),
    };
  }

  async connect(a: SessionPrincipal, provider: ModelProvider, key: string) {
    const ciphertext = this.vault.seal(key, this.owner(a, provider));
    const models = await this.gateway.models(provider, key);
    if (!models.length) throw new BadRequestException({ error: 'no_compatible_models_available' });
    const row = await this.db.db.userConnection.upsert({
      where: { tenantId_userId_provider: { ...this.scope(a), provider } },
      create: { ...this.scope(a), provider, ciphertext, models },
      update: { ciphertext, models, model: null, testedAt: null },
    });
    return { id: row.id, provider, models, model: null, testedAt: null };
  }

  async get(a: SessionPrincipal, id: string): Promise<UserConnection> {
    const row = await this.db.db.userConnection.findFirst({
      where: { id, ...this.scope(a), provider: { in: PROVIDERS.map((p) => p.id) } },
    });
    if (!row) throw new NotFoundException({ error: 'model_connection_not_found' });
    return row;
  }

  async test(a: SessionPrincipal, id: string, model: string) {
    const row = await this.get(a, id);
    if (!(row.models as string[]).includes(model))
      throw new BadRequestException({ error: 'model_not_in_catalog' });
    const key = this.vault.open(row.ciphertext, this.owner(a, row.provider));
    const reply = await this.gateway.generate(
      ModelProvider.parse(row.provider),
      key,
      model,
      'Connection test. Reply with exactly PURSUIT_OK. Do not use tools.',
    );
    if (reply.trim() !== 'PURSUIT_OK')
      throw new BadRequestException({ error: 'model_connection_test_failed' });
    const changed = await this.db.db.userConnection.updateMany({
      where: { id, ...this.scope(a), ciphertext: row.ciphertext, updatedAt: row.updatedAt },
      data: { model, testedAt: new Date() },
    });
    if (!changed.count) throw new BadRequestException({ error: 'connection_changed_retry_test' });
    return { model, verified: true };
  }

  async generate(a: SessionPrincipal, id: string, prompt: string) {
    const row = await this.get(a, id);
    if (!row.model || !row.testedAt)
      throw new BadRequestException({ error: 'test_model_connection_first' });
    const text = await this.gateway.generate(
      ModelProvider.parse(row.provider),
      this.vault.open(row.ciphertext, this.owner(a, row.provider)),
      row.model,
      prompt,
    );
    // A revocation or replacement during inference invalidates the result.
    const current = await this.get(a, id);
    if (current.updatedAt.getTime() !== row.updatedAt.getTime())
      throw new BadRequestException({ error: 'connection_changed_during_run' });
    return { text, model: row.model, provider: row.provider };
  }

  async revoke(a: SessionPrincipal, id: string) {
    await this.get(a, id);
    await this.db.db.userConnection.deleteMany({ where: { id, ...this.scope(a) } });
    return { revoked: true };
  }
}
