/**
 * Runtime context attached by the auth guard. Kept as a typed accessor so
 * controller/interceptor code never touches untyped request fields.
 */
import type { Request } from 'express';
import type { SessionPrincipal } from './auth.service';

export function authOf(req: Request): SessionPrincipal {
  const auth = (req as Request & { auth?: SessionPrincipal }).auth;
  if (!auth) throw new Error('auth required: request reached handler without session');
  return auth;
}
