import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { authOf } from './ctx';
import { ZodValidationPipe } from './zod.pipe';
import { ApplicationExecutionService } from './application-execution.service';
const plan = z
  .object({
    packetVersionId: z.string().uuid(),
    formHash: z.string().regex(/^[a-f0-9]{64}$/),
    answers: z.record(z.string().max(200), z.union([z.string().max(10000), z.boolean()])),
    eligibilityConfirmed: z.literal(true),
  })
  .strict();
const approve = z.object({ payloadHash: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
const policy = z
  .object({ enabled: z.boolean(), dailyLimit: z.number().int().min(1).max(100) })
  .strict();
@Controller('application-execution')
export class ApplicationExecutionController {
  constructor(private readonly service: ApplicationExecutionService) {}
  @Post('resolve') resolve(
    @Req() r: Request,
    @Body(new ZodValidationPipe(z.object({ url: z.string().url().max(2048) }).strict()))
    body: { url: string },
  ) {
    authOf(r);
    return this.service.resolve(body.url);
  }
  @Post('inspect') inspect(
    @Req() r: Request,
    @Body(new ZodValidationPipe(z.object({ packetVersionId: z.string().uuid() }).strict()))
    body: { packetVersionId: string },
  ) {
    return this.service.inspect(authOf(r), body.packetVersionId);
  }
  @Post('plans') create(
    @Req() r: Request,
    @Body(new ZodValidationPipe(plan)) body: z.infer<typeof plan>,
  ) {
    return this.service.create(authOf(r), body);
  }
  @Post('plans/:id/revise') revise(
    @Req() r: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(plan)) body: z.infer<typeof plan>,
  ) {
    return this.service.create(authOf(r), body, id);
  }
  @Get('plans') list(@Req() r: Request) {
    return this.service.list(authOf(r));
  }
  @Post('plans/:id/authorize') authorize(
    @Req() r: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approve)) body: z.infer<typeof approve>,
  ) {
    return this.service.authorize(authOf(r), id, body.payloadHash);
  }
  @Post('policy') policy(
    @Req() r: Request,
    @Body(new ZodValidationPipe(policy)) body: z.infer<typeof policy>,
  ) {
    return this.service.policy(authOf(r), body.enabled, body.dailyLimit);
  }
  @Post('plans/:id/run') run(@Req() r: Request, @Param('id') id: string) {
    return this.service.run(authOf(r), id);
  }
}
