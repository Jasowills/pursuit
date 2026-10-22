import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { ConnectionsService } from './connections.service';
import { authOf } from './ctx';
import { ModelProvider } from './model-gateway';
import { ZodValidationPipe } from './zod.pipe';

const connect = z
  .object({
    provider: ModelProvider,
    api_key: z
      .string()
      .trim()
      .min(10)
      .max(4096)
      .regex(/^[^\s]+$/),
  })
  .strict();
const test = z.object({ model: z.string().min(1).max(200) }).strict();

@Controller('connections/models')
export class ConnectionsController {
  constructor(private readonly connections: ConnectionsService) {}
  @Get() list(@Req() req: Request) {
    return this.connections.list(authOf(req));
  }
  @Post() connect(
    @Req() req: Request,
    @Body(new ZodValidationPipe(connect)) body: z.infer<typeof connect>,
  ) {
    return this.connections.connect(authOf(req), body.provider, body.api_key);
  }
  @Post(':id/test') test(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(test)) body: z.infer<typeof test>,
  ) {
    return this.connections.test(authOf(req), id, body.model);
  }
  @Delete(':id') revoke(@Req() req: Request, @Param('id') id: string) {
    return this.connections.revoke(authOf(req), id);
  }
}
