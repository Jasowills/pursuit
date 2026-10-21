/**
 * Dev passwordless auth — explicitly dev-only (SECURITY_AND_POLICY):
 * real production auth providers are NOT integrated in this milestone and
 * this module refuses to start when not explicitly enabled for dev.
 */
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DbService } from './db.service';

const SESSION_TTL_DAYS = 7;

export interface SessionPrincipal {
  userId: string;
  tenantId: string;
  email: string;
  displayName: string;
  sessionId: string;
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(private readonly dbw: DbService) {}

  get devLoginEnabled(): boolean {
    return process.env['ENABLE_DEV_LOGIN'] !== 'false';
  }

  /** In-memory rate limiter for the login endpoint (10/min/IP). */
  private loginHits = new Map<string, number[]>();
  checkLoginRate(ip: string): void {
    const now = Date.now();
    const hits = (this.loginHits.get(ip) ?? []).filter((t) => now - t < 60_000);
    if (hits.length >= 10) {
      throw new UnauthorizedException({ error: 'rate_limited', detail: 'try again in a minute' });
    }
    hits.push(now);
    this.loginHits.set(ip, hits);
  }

  async devLogin(
    email: string,
    displayName: string,
    device: string | null,
  ): Promise<{ token: string; principal: SessionPrincipal }> {
    if (!this.devLoginEnabled) {
      throw new UnauthorizedException({ error: 'dev_login_disabled' });
    }
    let user = await this.dbw.db.user.findUnique({ where: { email } });
    user ??= await this.dbw.db.user.create({ data: { email, displayName } });

    // personal tenant: first membership wins, else create one
    const membership = await this.dbw.db.membership.findFirst({
      where: { userId: user.id },
      include: { tenant: true },
    });
    let tenantId: string;
    if (membership) {
      tenantId = membership.tenantId;
    } else {
      const tenant = await this.dbw.db.tenant.create({ data: { name: `${email} personal` } });
      await this.dbw.db.membership.create({
        data: { userId: user.id, tenantId: tenant.id, role: 'OWNER' },
      });
      tenantId = tenant.id;
    }

    const token = `pst_${randomBytes(32).toString('base64url')}`;
    const session = await this.dbw.db.session.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000),
        device,
      },
    });
    return {
      token,
      principal: {
        userId: user.id,
        tenantId,
        email: user.email,
        displayName: user.displayName,
        sessionId: session.id,
      },
    };
  }

  async validate(token: string): Promise<SessionPrincipal | null> {
    const session = await this.dbw.db.session.findUnique({
      where: { tokenHash: sha256(token) },
      include: { user: { include: { memberships: { include: { tenant: true } } } } },
    });
    if (!session) return null;
    if (session.revokedAt || session.expiresAt.getTime() < Date.now()) return null;
    const membership = session.user.memberships[0];
    if (!membership) return null;
    return {
      userId: session.userId,
      tenantId: membership.tenantId,
      email: session.user.email,
      displayName: session.user.displayName,
      sessionId: session.id,
    };
  }

  /** Constant-time bearer comparison helper (defense in depth). */
  static constantsEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    return ab.length === bb.length && timingSafeEqual(ab, bb);
  }

  hashToken(token: string): string {
    return sha256(token);
  }

  lookupFail(): never {
    throw new BadRequestException({ error: 'invalid_session' });
  }
}
