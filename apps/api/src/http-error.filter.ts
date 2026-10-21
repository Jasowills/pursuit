import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: Record<string, unknown> = { error: 'internal_error' };
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      body =
        typeof payload === 'string' ? { error: payload } : (payload as Record<string, unknown>);
    } else {
      // avoid leaking internals
      console.error(
        '[api] unhandled error:',
        exception instanceof Error ? exception.message : exception,
      );
    }
    res.status(status).json(body);
  }
}
