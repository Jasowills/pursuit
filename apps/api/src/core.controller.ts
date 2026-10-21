import { Controller, Get, Post, Req, Body, HttpCode } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { DbService } from './db.service';
import { Public } from './public.decorator';
import { ZodValidationPipe } from './zod.pipe';
import { PasswordlessDevLogin } from '@pursuit/shared';

@Controller()
export class CoreController {
  constructor(
    private readonly auth: AuthService,
    private readonly dbw: DbService,
  ) {}

  @Public()
  @Get('health')
  @HttpCode(200)
  health(): { status: 'ok'; service: 'pursuit-api' } {
    return { status: 'ok', service: 'pursuit-api' };
  }

  @Public()
  @Get('ready')
  async ready(): Promise<{ status: 'ok' | 'degraded'; db: string }> {
    try {
      await this.dbw.db.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'connected' };
    } catch {
      return { status: 'degraded', db: 'unreachable' };
    }
  }

  /** Dev-only passwordless login. Disabled when ENABLE_DEV_LOGIN=false. */
  @Public()
  @Post('auth/dev-login')
  @HttpCode(201)
  async devLogin(
    @Req() req: Request,
    @Body(new ZodValidationPipe(PasswordlessDevLogin))
    body: { email: string; display_name: string },
  ): Promise<{
    token: string;
    user: { id: string; email: string; display_name: string };
    tenant_id: string;
  }> {
    this.auth.checkLoginRate(req.ip ?? 'unknown');
    const { token, principal } = await this.auth.devLogin(
      body.email,
      body.display_name,
      (req.headers['user-agent'] as string | undefined)?.slice(0, 180) ?? null,
    );
    return {
      token,
      user: { id: principal.userId, email: principal.email, display_name: principal.displayName },
      tenant_id: principal.tenantId,
    };
  }
}
