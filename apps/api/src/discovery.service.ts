import { BadGatewayException, Injectable } from '@nestjs/common';
import {
  createReader,
  pollSource,
  permittedPage,
  extractJobPosting,
  Source,
  type Poll,
} from '@pursuit/discovery';
import { z } from 'zod';
import { createHash } from 'node:crypto';
export const DiscoveryRequest = z
  .object({
    provider: z.enum(['greenhouse', 'ashby', 'lever', 'workable', 'himalayas', 'page']),
    board: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{1,100}$/)
      .optional(),
    region: z.enum(['us', 'eu']).default('us'),
    query: z.string().trim().min(1).max(300).optional(),
    url: z
      .string()
      .url()
      .max(2048)
      .refine((raw) => {
        const u = new URL(raw);
        return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password;
      })
      .optional(),
  })
  .strict()
  .superRefine((v, c) => {
    if (['greenhouse', 'ashby', 'lever', 'workable'].includes(v.provider) && !v.board)
      c.addIssue({ code: 'custom', message: 'board is required' });
    if (v.provider === 'himalayas' && !v.query)
      c.addIssue({ code: 'custom', message: 'query is required' });
    if (v.provider === 'page' && !v.url)
      c.addIssue({ code: 'custom', message: 'public job URL is required' });
  });
export type DiscoveryRequest = z.infer<typeof DiscoveryRequest>;
@Injectable()
export class DiscoveryService {
  private readonly read = createReader({ minHostDelayMs: 1000 });
  async fetch(input: DiscoveryRequest): Promise<{ source: Source; poll: Poll }> {
    const identity =
      input.board ??
      createHash('sha256')
        .update(input.query ?? input.url!)
        .digest('hex')
        .slice(0, 24);
    const endpoints: Partial<Record<DiscoveryRequest['provider'], string>> = {
      greenhouse: `https://boards-api.greenhouse.io/v1/boards/${input.board}/jobs?content=true`,
      ashby: `https://api.ashbyhq.com/posting-api/job-board/${input.board}`,
      lever: `https://api${input.region === 'eu' ? '.eu' : ''}.lever.co/v0/postings/${input.board}`,
      workable: `https://www.workable.com/api/accounts/${input.board}`,
      himalayas: `https://himalayas.app/jobs/api/search?q=${encodeURIComponent(input.query ?? '')}`,
    };
    const source = Source.parse({
      id: `${input.provider}:${input.region}:${identity}`,
      provider: input.provider,
      board: input.board,
      region: input.region,
      query: input.query,
      url: input.provider === 'page' ? input.url : endpoints[input.provider],
      company:
        input.provider === 'himalayas'
          ? 'Himalayas'
          : `Employer board: ${input.board ?? new URL(input.url!).hostname}`,
    });
    try {
      const poll =
        source.provider === 'page'
          ? extractJobPosting(
              await permittedPage(this.read, source.url!),
              source.url!,
              source,
              new Date().toISOString(),
            )
          : await pollSource(source, this.read, { maxPages: 5 });
      if (poll.jobs.length > 5000) {
        poll.jobs = poll.jobs.slice(0, 5000);
        poll.complete = false;
        poll.diagnostics.push('record_budget_reached');
      }
      return { source, poll };
    } catch {
      throw new BadGatewayException({
        error: 'discovery_source_failed',
        detail:
          'The source was not imported. Check its identifier, public access and availability. Existing jobs were retained.',
      });
    }
  }
}
