/**
 * Audit interceptor (SECURITY_AND_POLICY audit trail): every non-GET request
 * from an authenticated principal is written to audit_logs with redacted
 * metadata (no payloads, no secrets — just action + target + actor).
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DbService } from './db.service';
import { authOf } from './ctx';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly db: DbService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    if (req.method === 'GET') return next.handle();
    let auth;
    try {
      auth = authOf(req);
    } catch {
      return next.handle();
    }

    const path = req.route?.path ?? req.path;
    return next.handle().pipe(
      tap({
        next: () => {
          void this.write(req, path, 'SUCCEEDED');
        },
        error: (err: unknown) => {
          void this.write(req, path, 'FAILED', err);
        },
      }),
    );
  }

  private async write(req: Request, path: string, outcome: string, err?: unknown): Promise<void> {
    try {
      const auth = authOf(req);
      await this.db.db.auditLog.create({
        data: {
          tenantId: auth.tenantId,
          actor: auth.email,
          action: `${req.method} ${path}`,
          target: String(req.params?.['id'] ?? ''),
          metadataRedacted: { outcome, error: err instanceof Error ? err.message : undefined },
        },
      });
    } catch (auditErr) {
      // audit must never take the API down; log loudly instead
      console.error('[audit] failed to persist audit row:', auditErr);
    }
  }
}
