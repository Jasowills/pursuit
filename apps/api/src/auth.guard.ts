import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { AuthService, SessionPrincipal } from './auth.service';
import { IS_PUBLIC } from './public.decorator';

interface ReqLike extends Request {
  auth?: SessionPrincipal;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<ReqLike>();
    const header = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ error: 'missing_bearer_token' });
    }
    const token = header.slice('Bearer '.length).trim();
    const principal = await this.auth.validate(token);
    if (!principal) {
      throw new UnauthorizedException({ error: 'invalid_or_expired_session' });
    }
    if (!principal.tenantId) {
      throw new ForbiddenException({ error: 'missing_tenant_membership' });
    }
    req.auth = principal;
    const res = context.switchToHttp().getResponse<Response>();
    res.setHeader('x-pursuit-tenant', principal.tenantId);
    return true;
  }
}
