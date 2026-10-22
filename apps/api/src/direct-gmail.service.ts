import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { SessionPrincipal } from './auth.service';
import { DbService } from './db.service';
import { ConnectionsService } from './connections.service';

interface GoogleCredential {
  refresh_token: string;
  email: string;
  sub: string;
}

@Injectable()
export class DirectGmailService {
  constructor(
    private readonly db: DbService,
    private readonly connections: ConnectionsService,
  ) {}
  configured() {
    return Boolean(
      process.env['GOOGLE_CLIENT_ID'] &&
      process.env['GOOGLE_CLIENT_SECRET'] &&
      this.connections.vault.available(),
    );
  }
  private callback() {
    return `${process.env['WEB_URL'] ?? 'http://127.0.0.1:3000'}/app/settings`;
  }
  private async request(url: string, init: RequestInit): Promise<any> {
    try {
      const res = await fetch(url, {
        ...init,
        redirect: 'error',
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok)
        throw new BadGatewayException({
          error: 'google_request_failed',
          provider_status: res.status,
        });
      return await res.json();
    } catch (e) {
      if (e instanceof BadGatewayException) throw e;
      throw new BadGatewayException({ error: 'google_unreachable' });
    }
  }
  private async token(parameters: Record<string, string>) {
    if (!this.configured())
      throw new ServiceUnavailableException({ error: 'direct_gmail_not_configured' });
    return this.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env['GOOGLE_CLIENT_ID']!,
        client_secret: process.env['GOOGLE_CLIENT_SECRET']!,
        ...parameters,
      }).toString(),
    });
  }
  async connect(a: SessionPrincipal) {
    if (!this.configured())
      throw new ServiceUnavailableException({ error: 'direct_gmail_not_configured' });
    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(48).toString('base64url');
    const ciphertext = this.connections.vault.seal(
      JSON.stringify({ state, verifier, expires: Date.now() + 10 * 60_000 }),
      this.connections.owner(a, 'gmail_pending'),
    );
    await this.db.db.userConnection.upsert({
      where: {
        tenantId_userId_provider: { ...this.connections.scope(a), provider: 'gmail_pending' },
      },
      create: { ...this.connections.scope(a), provider: 'gmail_pending', ciphertext },
      update: { ciphertext },
    });
    const query = new URLSearchParams({
      client_id: process.env['GOOGLE_CLIENT_ID']!,
      redirect_uri: this.callback(),
      response_type: 'code',
      scope: 'openid email https://www.googleapis.com/auth/gmail.send',
      access_type: 'offline',
      prompt: 'consent',
      state,
      code_challenge: createHash('sha256').update(verifier).digest('base64url'),
      code_challenge_method: 'S256',
    });
    return { redirect_url: `https://accounts.google.com/o/oauth2/v2/auth?${query}` };
  }
  async finish(a: SessionPrincipal, code: string, state: string) {
    const pending = await this.db.db.userConnection.findFirst({
      where: { ...this.connections.scope(a), provider: 'gmail_pending' },
    });
    if (!pending) throw new BadRequestException({ error: 'gmail_auth_session_missing' });
    const data = JSON.parse(
      this.connections.vault.open(pending.ciphertext, this.connections.owner(a, 'gmail_pending')),
    );
    const actual = Buffer.from(state);
    const expected = Buffer.from(String(data.state));
    if (
      actual.length !== expected.length ||
      !timingSafeEqual(actual, expected) ||
      data.expires < Date.now()
    )
      throw new BadRequestException({ error: 'gmail_auth_state_invalid' });
    const claimed = await this.db.db.userConnection.deleteMany({
      where: { id: pending.id, ...this.connections.scope(a), ciphertext: pending.ciphertext },
    });
    if (!claimed.count) throw new BadRequestException({ error: 'gmail_auth_session_consumed' });
    const tokens = await this.token({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.callback(),
      code_verifier: String(data.verifier),
    });
    if (typeof tokens.refresh_token !== 'string')
      throw new BadRequestException({ error: 'gmail_offline_consent_required' });
    if (
      !String(tokens.scope ?? '')
        .split(' ')
        .includes('https://www.googleapis.com/auth/gmail.send')
    )
      throw new BadRequestException({ error: 'gmail_send_permission_required' });
    const user = await this.request('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!user.email_verified || typeof user.email !== 'string' || typeof user.sub !== 'string')
      throw new BadRequestException({ error: 'gmail_identity_unverified' });
    const ciphertext = this.connections.vault.seal(
      JSON.stringify({ refresh_token: tokens.refresh_token, email: user.email, sub: user.sub }),
      this.connections.owner(a, 'gmail_direct'),
    );
    await this.db.db.userConnection.create({
      data: { ...this.connections.scope(a), provider: 'gmail_direct', ciphertext },
    });
    return { connected: true, email: user.email };
  }
  async account(a: SessionPrincipal) {
    const row = await this.db.db.userConnection.findFirst({
      where: { ...this.connections.scope(a), provider: 'gmail_direct' },
    });
    if (!row) return null;
    const credential: GoogleCredential = JSON.parse(
      this.connections.vault.open(row.ciphertext, this.connections.owner(a, 'gmail_direct')),
    );
    await this.token({ grant_type: 'refresh_token', refresh_token: credential.refresh_token });
    return {
      id: `direct:${row.id}:${credential.sub}`,
      status: 'ACTIVE',
      disabled: false,
      email: credential.email,
    };
  }
  async disconnect(a: SessionPrincipal) {
    const rows = await this.db.db.userConnection.findMany({
      where: { ...this.connections.scope(a), provider: { in: ['gmail_direct', 'gmail_pending'] } },
    });
    for (const row of rows) {
      if (row.provider === 'gmail_direct') {
        const credential: GoogleCredential = JSON.parse(
          this.connections.vault.open(row.ciphertext, this.connections.owner(a, row.provider)),
        );
        const res = await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token: credential.refresh_token }),
          redirect: 'error',
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok && res.status !== 400)
          throw new BadGatewayException({ error: 'google_revoke_failed' });
      }
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
    const current = await this.account(a);
    if (!current || current.id !== accountId)
      throw new BadRequestException({ error: 'gmail_connection_changed' });
    const row = await this.db.db.userConnection.findFirstOrThrow({
      where: { ...this.connections.scope(a), provider: 'gmail_direct' },
    });
    const credential: GoogleCredential = JSON.parse(
      this.connections.vault.open(row.ciphertext, this.connections.owner(a, row.provider)),
    );
    const token = await this.token({
      grant_type: 'refresh_token',
      refresh_token: credential.refresh_token,
    });
    const subject = `=?UTF-8?B?${Buffer.from(message.subject).toString('base64')}?=`;
    const mime = [
      `To: ${message.recipient}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(message.body)
        .toString('base64')
        .match(/.{1,76}/g)
        ?.join('\r\n') ?? '',
    ].join('\r\n');
    const result = await this.request(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: Buffer.from(mime).toString('base64url') }),
      },
    );
    if (typeof result.id !== 'string' || !result.id)
      throw new BadGatewayException({ error: 'gmail_delivery_unconfirmed' });
    return result.id as string;
  }
}
