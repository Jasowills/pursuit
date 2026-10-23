import { createReader, researchCompany } from '@pursuit/discovery';
import { DiscoveryRequest } from './discovery.service';
import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { authOf } from './ctx';
import { ZodValidationPipe } from './zod.pipe';
import { EditableContent, WorkflowService } from './workflow.service';
import { GmailService } from './gmail.service';
import type { WorkflowDraft } from '@pursuit/database';
import { DirectGmailService } from './direct-gmail.service';

const discovery = z.object({ board: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/) }).strict();
const prepare = z
  .object({
    job_id: z.string().uuid(),
    connection_id: z.string().uuid(),
    resume: z.string().min(50).max(30000),
  })
  .strict();
const approval = z.object({ payload_hash: z.string().regex(/^[a-f\d]{64}$/) }).strict();
const gmailPath = z.object({ path: z.enum(['composio', 'direct']).default('composio') }).strict();
const gmailCallback = z
  .object({ code: z.string().min(1).max(4096), state: z.string().min(1).max(200) })
  .strict();
const composioCallback = z.object({ session_uri: z.string().min(1).max(8192) }).strict();

@Controller()
export class WorkflowController {
  constructor(
    private readonly workflows: WorkflowService,
    private readonly gmail: GmailService,
    private readonly direct: DirectGmailService,
  ) {}
  @Get('connections/gmail') gmailStatus(@Req() r: Request) {
    return this.gmail.status(authOf(r));
  }
  @Post('connections/gmail') gmailConnect(
    @Req() r: Request,
    @Body(new ZodValidationPipe(gmailPath)) body: z.infer<typeof gmailPath>,
  ) {
    return this.gmail.connect(authOf(r), body.path);
  }
  @Post('connections/gmail/callback') gmailFinish(
    @Req() r: Request,
    @Body(new ZodValidationPipe(gmailCallback)) body: z.infer<typeof gmailCallback>,
  ) {
    return this.direct.finish(authOf(r), body.code, body.state);
  }
  @Post('connections/gmail/composio-callback') composioFinish(
    @Req() r: Request,
    @Body(new ZodValidationPipe(composioCallback)) body: z.infer<typeof composioCallback>,
  ) {
    return this.gmail.finish(authOf(r), body.session_uri);
  }
  @Delete('connections/gmail') gmailDisconnect(@Req() r: Request) {
    return this.gmail.disconnect(authOf(r));
  }
  @Post('workflow/company-research') companyResearch(
    @Req() r: Request,
    @Body(
      new ZodValidationPipe(
        z.object({ url: z.string().url().max(2048), company: z.string().min(1).max(300) }).strict(),
      ),
    )
    body: { url: string; company: string },
  ) {
    authOf(r);
    return researchCompany(body.url, body.company, createReader());
  }
  @Post('workflow/discover') discover(
    @Req() r: Request,
    @Body(new ZodValidationPipe(discovery)) body: z.infer<typeof discovery>,
  ) {
    return this.workflows.discover(authOf(r), body.board);
  }
  @Post('workflow/discover-source') discoverSource(
    @Req() r: Request,
    @Body(new ZodValidationPipe(DiscoveryRequest))
    body: import('./discovery.service').DiscoveryRequest,
  ) {
    return this.workflows.discoverSource(authOf(r), body);
  }
  @Get('workflow') async list(@Req() r: Request): Promise<{ items: WorkflowDraft[] }> {
    return { items: await this.workflows.list(authOf(r)) };
  }
  @Post('workflow') prepare(
    @Req() r: Request,
    @Body(new ZodValidationPipe(prepare)) body: z.infer<typeof prepare>,
  ): Promise<WorkflowDraft> {
    return this.workflows.prepare(authOf(r), body);
  }
  @Get('workflow/:id') preview(
    @Req() r: Request,
    @Param('id') id: string,
  ): Promise<{ draft: WorkflowDraft; payload_hash: string | null }> {
    return this.workflows.preview(authOf(r), id);
  }
  @Patch('workflow/:id') edit(
    @Req() r: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(EditableContent)) body: z.infer<typeof EditableContent>,
  ): Promise<WorkflowDraft> {
    return this.workflows.edit(authOf(r), id, body);
  }
  @Post('workflow/:id/approve') approve(
    @Req() r: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approval)) body: z.infer<typeof approval>,
  ): Promise<WorkflowDraft> {
    return this.workflows.approve(authOf(r), id, body.payload_hash);
  }
  @Post('workflow/:id/send') send(
    @Req() r: Request,
    @Param('id') id: string,
  ): Promise<WorkflowDraft> {
    return this.workflows.send(authOf(r), id);
  }
}
