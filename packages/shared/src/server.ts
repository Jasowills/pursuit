/**
 * Server-only shared helpers. NOT for browser bundles (uses node:crypto).
 * Import from '@pursuit/shared/server'.
 */
import { createHash } from 'node:crypto';

/** Canonical payload hash for approvals: any payload change invalidates the
 * approval (SECURITY_AND_POLICY hash-binding requirement). */
export function approvalPayloadHash(preview: {
  destination: string;
  recipient?: string | null;
  summary: string;
  answers?: unknown;
  attachments?: unknown;
}): string {
  const canonical = JSON.stringify({
    destination: preview.destination,
    recipient: preview.recipient ?? null,
    summary: preview.summary,
    answers: preview.answers ?? [],
    attachments: preview.attachments ?? [],
  });
  return createHash('sha256').update(canonical).digest('hex');
}
