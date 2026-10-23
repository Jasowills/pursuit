import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { TailoringService } from './tailoring.service';
import { authOf } from './ctx';
import { ZodValidationPipe } from './zod.pipe';
import { Voice } from '@pursuit/tailoring';
const review = z
  .object({
    text: z.string().min(1).max(80000),
    expectedHash: z.string().regex(/^[a-f0-9]{64}$/),
    confirmed: z.literal(true),
  })
  .strict();
const prepare = z
  .object({
    masterId: z.string().uuid(),
    jobId: z.string().uuid(),
    voice: Voice.optional(),
    template: z.enum(['classic', 'compact']).optional(),
    connectionId: z.string().uuid().optional(),
  })
  .strict();
@Controller('tailoring')
export class TailoringController {
  constructor(private readonly service: TailoringService) {}
  @Post('sources')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 8_000_000, files: 1, fields: 0 } }),
  )
  import(@Req() r: Request, @UploadedFile() file: { buffer: Buffer; originalname: string }) {
    if (!file) throw new BadRequestException({ error: 'document_required' });
    return this.service.import(authOf(r), file);
  }
  @Get('sources/:id') async get(@Req() r: Request, @Param('id') id: string) {
    const data = await this.service.source(authOf(r), id);
    return { id, resume: data.resume };
  }
  @Get('sources/:id/original') async original(
    @Req() r: Request,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const bytes = await this.service.original(authOf(r), id);
    res
      .set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="original-resume"',
        'Cache-Control': 'no-store',
      })
      .send(bytes);
  }
  @Post('sources/:id/review') review(
    @Req() r: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(review)) body: z.infer<typeof review>,
  ) {
    return this.service.review(authOf(r), id, body.text, body.expectedHash);
  }
  @Post('packets') prepare(
    @Req() r: Request,
    @Body(new ZodValidationPipe(prepare)) body: z.infer<typeof prepare>,
  ): Promise<{ id: string; packet: unknown; cached: boolean; pdfHash?: string }> {
    return this.service.prepare(authOf(r), body);
  }
  @Get('packets/:id/pdf') async pdf(
    @Req() r: Request,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const bytes = await this.service.pdf(authOf(r), id);
    res
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
        'Cache-Control': 'no-store',
      })
      .send(bytes);
  }
}
