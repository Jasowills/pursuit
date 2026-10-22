// Disposable API: no root .env loading, no background polls, no provider credentials.
const target = new URL(process.env.DATABASE_URL || 'postgresql://invalid');
if (
  target.hostname !== '127.0.0.1' ||
  target.port !== '55439' ||
  target.pathname !== '/pursuit_qa'
) {
  throw new Error('QA server requires the disposable loopback pursuit_qa database on port 55439');
}
if (process.env.AUTOPILOT_WORKER_ENABLED !== 'false')
  throw new Error('Disable background polling for this audit server');
require('../../apps/api/node_modules/reflect-metadata');
const { NestFactory } = require('../../apps/api/node_modules/@nestjs/core');
const { AppModule } = require('../../apps/api/dist/app.module');
const { GlobalExceptionFilter } = require('../../apps/api/dist/http-error.filter');
(async () => {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: 'http://127.0.0.1:3001' });
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.listen(4401, '127.0.0.1');
  console.log('Disposable QA API listening on 4401');
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, async () => {
      await app.close();
      process.exit(0);
    });
})();
