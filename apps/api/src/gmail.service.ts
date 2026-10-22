import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { SessionPrincipal } from './auth.service';
import { ConnectionsService } from './connections.service';
import { DbService } from './db.service';
import { DirectGmailService } from './direct-gmail.service';

@Injectable()
export class GmailService {
  constructor(
    private readonly db: DbService,
    private readonly connections: ConnectionsService,
    private readonly direct: DirectGmailService,
  ) {}
  composioConfigured() {
    return Boolean(
      process.env['COMPOSIO_API_KEY'] &&
      process.env['COMPOSIO_GMAIL_AUTH_CONFIG_ID'] &&
      this.connections.vault.available(),
    );
  }
  configured() {
    return this.composioConfigured() || this.direct.configured();
  }
  identity(a: SessionPrincipal) {
    return `pursuit_${a.tenantId}_${a.userId}`;
  }

  private async request(path: string, method = 'GET', body?: unknown): Promise<any> {
    if (!this.composioConfigured())
      throw new ServiceUnavailableException({ error: 'gmail_composio_not_configured' });
    try {
      const res = await fetch(`https://backend.composio.dev/api/v3.1/${path}`, {
        method,
        headers: {
          'x-api-key': process.env['COMPOSIO_API_KEY']!,
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'error',
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok)
        throw new BadGatewayException({
          error: 'composio_request_failed',
          provider_status: res.status,
        });
      return res.status === 204 ? {} : await res.json();
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      throw new BadGatewayException({ error: 'composio_unreachable' });
    }
  }

  async connect(a: SessionPrincipal, path: 'composio' | 'direct' = 'composio') {
    // The server fixes both owner and callback; a client cannot attach someone else's account ID.
    const existing = await this.db.db.userConnection.findFirst({
      where: { ...this.connections.scope(a), provider: { in: ['gmail', 'gmail_direct'] } },
    });
    if (existing) throw new BadRequestException({ error: 'disconnect_existing_gmail_first' });
    if (path === 'direct') return this.direct.connect(a);
    const result = await this.request('connected_accounts/link', 'POST', {
      user_id: this.identity(a),
      auth_config_id: process.env['COMPOSIO_GMAIL_AUTH_CONFIG_ID'],
      callback_url: `${process.env['WEB_URL'] ?? 'http://127.0.0.1:3000'}/app/settings`,
    });
    if (
      typeof result.connected_account_id !== 'string' ||
      typeof result.redirect_url !== 'string' ||
      new URL(result.redirect_url).origin !== 'https://connect.composio.dev'
    ) {
      throw new BadGatewayException({ error: 'invalid_composio_link' });
    }
    const ciphertext = this.connections.vault.seal(
      result.connected_account_id,
      this.connections.owner(a, 'gmail'),
    );
    await this.db.db.userConnection.create({
      data: { ...this.connections.scope(a), provider: 'gmail', ciphertext },
    });
    return { redirect_url: result.redirect_url };
  }

  async account(a: SessionPrincipal) {
    const direct = await this.direct.account(a);
    if (direct) return direct;
    const row = await this.db.db.userConnection.findFirst({
      where: { ...this.connections.scope(a), provider: 'gmail' },
    });
    if (!row) return null;
    const id = this.connections.vault.open(row.ciphertext, this.connections.owner(a, 'gmail'));
    const account = await this.request(`connected_accounts/${encodeURIComponent(id)}`);
    if (
      account.user_id !== this.identity(a) ||
      account.toolkit?.slug !== 'gmail' ||
      account.auth_config?.id !== process.env['COMPOSIO_GMAIL_AUTH_CONFIG_ID']
    ) {
      throw new BadRequestException({ error: 'gmail_account_owner_mismatch' });
    }
    const verified =
      process.env['COMPOSIO_CALLBACK_VERIFICATION'] !== 'true' || Boolean(row.testedAt);
    return {
      id,
      status: verified ? String(account.status) : 'PENDING_VERIFICATION',
      disabled: Boolean(account.is_disabled),
    };
  }

  async finish(a: SessionPrincipal, sessionUri: string) {
    const row = await this.db.db.userConnection.findFirst({
      where: { ...this.connections.scope(a), provider: 'gmail' },
    });
    if (!row) throw new BadRequestException({ error: 'gmail_auth_session_missing' });
    const id = this.connections.vault.open(row.ciphertext, this.connections.owner(a, 'gmail'));
    const completed = await this.request('connected_accounts/complete_auth', 'POST', {
      session_uri: sessionUri,
      user_id: this.identity(a),
    });
    if (completed.connected_account_id !== id || completed.toolkit_slug !== 'gmail')
      throw new BadRequestException({ error: 'gmail_account_owner_mismatch' });
    await this.db.db.userConnection.updateMany({
      where: { id: row.id, ...this.connections.scope(a), ciphertext: row.ciphertext },
      data: { testedAt: new Date() },
    });
    return this.status(a);
  }

  async status(a: SessionPrincipal) {
    const paths = { composio: this.composioConfigured(), direct: this.direct.configured() };
    if (!this.configured()) return { configured: false, status: 'NOT_CONFIGURED', paths };
    const account = await this.account(a);
    return {
      configured: true,
      status: account?.disabled ? 'INACTIVE' : (account?.status ?? 'DISCONNECTED'),
      paths,
    };
  }

  async disconnect(a: SessionPrincipal) {
    await this.direct.disconnect(a);
    const row = await this.db.db.userConnection.findFirst({
      where: { ...this.connections.scope(a), provider: 'gmail' },
    });
    if (row) {
      const id = this.connections.vault.open(row.ciphertext, this.connections.owner(a, 'gmail'));
      await this.request(`connected_accounts/${encodeURIComponent(id)}/revoke`, 'POST');
      await this.db.db.userConnection.deleteMany({
        where: { id: row.id, ...this.connections.scope(a) },
      });
    }
    return { revoked: true };
  }

  async send(
    a: SessionPrincipal,
    accountId: string,
    message: { recipient: string; subject: string; body: string },
  ) {
    if (accountId.startsWith('direct:')) return this.direct.send(a, accountId, message);
    const result = await this.request('tools/execute/GMAIL_SEND_EMAIL', 'POST', {
      user_id: this.identity(a),
      connected_account_id: accountId,
      version: '20261018_00',
      arguments: {
        user_id: 'me',
        recipient_email: message.recipient,
        subject: message.subject,
        body: message.body,
        is_html: false,
      },
    });
    const receipt = result.data?.id ?? result.data?.messageId ?? result.data?.message_id;
    if (result.successful !== true || typeof receipt !== 'string' || !receipt) {
      throw new BadGatewayException({ error: 'gmail_delivery_unconfirmed' });
    }
    return receipt;
  }
}
