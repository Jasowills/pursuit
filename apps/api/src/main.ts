/**
 * Pursuit API bootstrap.
 * REST under /api/v1, tenant-scoped, Zod-validated, audit-logged mutations,
 * SSE event stream for cross-client sync (DEC-05).
 */
import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './http-error.filter';

async function bootstrap(): Promise<void> {
  const envFile = resolve(__dirname, '../../../.env');
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const port = Number(process.env['PORT'] ?? 4000);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: (process.env['CORS_ORIGINS'] ?? 'http://localhost:3000,http://127.0.0.1:3000').split(
      ',',
    ),
    credentials: false,
  });
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.listen(port, '127.0.0.1');
  console.log(`pursuit api listening on http://127.0.0.1:${port}/api/v1`);
}

void bootstrap();
