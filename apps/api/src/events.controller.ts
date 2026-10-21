/**
 * SSE endpoint (DEC-05): GET /api/v1/events/stream?cursor=<isoDate>.
 * Streams outbox events for the tenant; DB-polled every second for M1
 * (upgrade path: Postgres LISTEN/NOTIFY). Heartbeats keep proxies alive.
 */
import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DbService } from './db.service';
import { authOf } from './ctx';

@Controller('events')
export class EventsController {
  constructor(private readonly dbw: DbService) {}

  @Get('stream')
  async stream(
    @Req() req: Request,
    @Res() res: Response,
    @Query('cursor') cursor?: string,
  ): Promise<void> {
    let auth;
    try {
      auth = authOf(req);
    } catch {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }
    const tenantId = auth.tenantId;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('x-accel-buffering', 'no');
    res.flushHeaders();

    let watermark = cursor ? new Date(cursor) : new Date();
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', at: new Date().toISOString() })}\n\n`);

    let closed = false;
    req.on('close', () => {
      closed = true;
    });

    while (!closed && !res.destroyed) {
      const events = await this.dbw.db.outboxEvent.findMany({
        where: { tenantId, createdAt: { gt: watermark } },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });
      for (const e of events) {
        res.write(
          `data: ${JSON.stringify({
            id: e.id,
            type: 'outbox',
            topic: e.topic,
            entityRef: e.entityRef,
            payload: e.payload,
            createdAt: e.createdAt.toISOString(),
          })}\n\n`,
        );
        watermark = e.createdAt;
      }
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', at: new Date().toISOString() })}\n\n`);
      await sleep(1000);
    }
    res.end();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
