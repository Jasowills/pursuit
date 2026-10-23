import { z } from 'zod';
export const Field = z
  .object({
    id: z.string().min(1).max(200),
    label: z.string().min(1).max(500),
    type: z.enum(['text', 'email', 'tel', 'url', 'textarea', 'select', 'checkbox', 'file']),
    required: z.boolean(),
    options: z.array(z.string()).default([]),
  })
  .strict();
export type Field = z.infer<typeof Field>;
export const Form = z.object({ url: z.string().url(), fields: z.array(Field).max(100) }).strict();
export type Form = z.infer<typeof Form>;
export const Payload = z
  .object({
    personId: z.string().min(1).max(200),
    packetVersionId: z.string().uuid().optional(),
    jobUrl: z.string().url(),
    packetHash: z.string().regex(/^[a-f0-9]{64}$/),
    pdfHash: z.string().regex(/^[a-f0-9]{64}$/),
    answers: z.record(z.string(), z.union([z.string().max(10000), z.boolean()])),
    formHash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export type Payload = z.infer<typeof Payload>;
export type Receipt = {
  kind: 'hosted_confirmation';
  url: string;
  text: string;
  acceptedPostStatus: number;
  observedAt: string;
};
export interface ApplicationAdapter {
  observe(): Promise<Form>;
  fill(payload: Payload, pdf: Uint8Array): Promise<void>;
  submit(): Promise<Receipt>;
  close(): Promise<void>;
}
