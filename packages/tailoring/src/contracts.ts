import { z } from 'zod';
export const Voice = z
  .object({
    tone: z.enum(['story', 'professional', 'direct']).default('professional'),
    motivation: z.string().max(1200).default(''),
    writingSamples: z.array(z.string().max(2000)).max(3).default([]),
    avoid: z.array(z.string().max(100)).max(30).default([]),
  })
  .strict();
export type Voice = z.infer<typeof Voice>;
export const Block = z
  .object({
    id: z.string().max(100),
    text: z.string().min(1).max(4000),
    section: z.string().max(100),
    group: z.number().int().nonnegative(),
    kind: z.enum(['identity', 'section', 'context', 'bullet']),
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),
  })
  .strict();
export const Resume = z
  .object({
    sourceId: z.string().min(1).max(100),
    sourceName: z.string().max(300),
    sourceText: z.string().min(1).max(80000),
    blocks: z.array(Block).min(1).max(1000),
    reviewedAt: z.string().datetime().nullable(),
    warnings: z.array(z.string()),
  })
  .strict();
export type Resume = z.infer<typeof Resume>;
export const Role = z
  .object({
    id: z.string().min(1).max(200),
    title: z.string().min(1).max(300),
    company: z.string().min(1).max(300),
    description: z.string().min(1).max(40000),
    url: z.string().url().optional(),
  })
  .strict();
export type Role = z.infer<typeof Role>;
export const Packet = z
  .object({
    version: z.literal(1),
    sourceId: z.string(),
    sourceHash: z.string(),
    role: Role,
    blocks: z.array(Block),
    selectedIds: z.array(z.string()),
    omittedIds: z.array(z.string()),
    evidence: z.array(z.object({ blockId: z.string(), terms: z.array(z.string()) })),
    gaps: z.array(z.string()),
    template: z.enum(['classic', 'compact']),
    voice: Voice,
    coverLetter: z.string(),
    createdAt: z.string().datetime(),
  })
  .strict();
export type Packet = z.infer<typeof Packet>;
