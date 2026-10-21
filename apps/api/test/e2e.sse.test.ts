/**
 * API integration test — SSE stream delivers tenant-scoped outbox events.
 * Runs against the real dev DB (docker compose must be up).
 */
import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import type { Server } from 'node:http';
import { get } from 'node:http';
import { AppModule } from '../src/app.module';

jest.setTimeout(60_000);

let app: INestApplication;
let httpServer: Server;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  await app.init();
  httpServer = app.getHttpServer() as Server;
  await new Promise<void>((resolve) => {
    if (httpServer.listening) return resolve();
    httpServer.listen(() => resolve());
  });
});

afterAll(async () => {
  await app.close();
});

interface Login {
  token: string;
  tenant_id: string;
}

async function login(email: string): Promise<Login> {
  const res = await supertest
    .agent(app.getHttpServer())
    .post('/api/v1/auth/dev-login')
    .send({ email, display_name: `SSE ${email.split('@')[0]}` })
    .expect(201);
  return { token: res.body.token, tenant_id: res.body.tenant_id };
}

interface SseEvent {
  id?: string;
  type: string;
  topic?: string;
  entityRef?: string | null;
}

function openSse(token: string, onEvent: (e: SseEvent) => void): () => void {
  const open = get(
    {
      host: '127.0.0.1',
      port: (httpServer.address() as { port: number }).port,
      path: '/api/v1/events/stream',
      headers: { Authorization: `Bearer ${token}` },
    },
    (res) => {
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/event-stream');
      let buf = '';
      res.on('data', (chunk: Buffer) => {
        buf += chunk.toString();
        for (const frame of buf.split('\n\n')) {
          if (frame.startsWith('data: ')) {
            try {
              onEvent(JSON.parse(frame.slice(6)) as SseEvent);
            } catch {
              /* ignore partial */
            }
          }
        }
        buf = buf.slice(buf.lastIndexOf('\n') + 1);
      });
    },
  );
  return () => open.destroy();
}

describe('SSE event stream', () => {
  it('streams tenant-scoped outbox events and excludes other tenants', async () => {
    const a = await login(`sse-test-${Date.now()}@pursuit.test`);
    const b = await login(`sse-other-${Date.now()}@pursuit.test`);

    const events: SseEvent[] = [];
    const close = openSse(a.token, (e) => events.push(e));
    await new Promise((r) => setTimeout(r, 800));

    // tenant A activity → events
    await supertest
      .agent(app.getHttpServer())
      .post('/api/v1/watchers')
      .set('Authorization', `Bearer ${a.token}`)
      .send({
        kind: 'COMPANY_URL',
        source_url: `https://careers.example-sse3.test/a-${Date.now()}`,
        frequency_minutes: 60,
      })
      .expect(201);

    // tenant B activity must NOT appear in tenant A's stream
    await supertest
      .agent(app.getHttpServer())
      .post('/api/v1/watchers')
      .set('Authorization', `Bearer ${b.token}`)
      .send({
        kind: 'KEYWORD',
        source_url: 'https://careers.example-sse3.test/b',
        frequency_minutes: 60,
      })
      .expect(201);

    await new Promise((r) => setTimeout(r, 2500));
    close();

    const topics = events.filter((e) => e.type === 'outbox').map((e) => e.topic);
    expect(topics).toContain('watcher.created');
    // tenant scoping: exactly one watcher event (A's) — B's is filtered by the tenant-scoped DB query
    expect(topics.filter((t) => t === 'watcher.created')).toHaveLength(1);
    // and no event stream from an unauthenticated client
  });

  it('rejects the stream without a bearer token', async () => {
    await new Promise<void>((resolve, reject) => {
      get(
        {
          host: '127.0.0.1',
          port: (httpServer.address() as { port: number }).port,
          path: '/api/v1/events/stream',
        },
        (res) => {
          try {
            expect(res.statusCode).toBe(401);
            res.resume();
            resolve();
          } catch (e) {
            reject(e);
          }
        },
      );
    });
  });
});
