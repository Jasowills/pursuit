/**
 * Unit tests — no DB required.
 * Covers: approval payload hash binding, Zod pipe validation errors,
 * shared state machine legality.
 */
import { approvalPayloadHash } from '@pursuit/shared/server';
import { assertTransition, type ApplicationStatus } from '@pursuit/shared';
import { ZodValidationPipe } from '../src/zod.pipe';
import { z } from 'zod';

describe('approval payload hash binding', () => {
  const base = {
    destination: 'https://jobs.example.com/apply/123',
    recipient: null,
    summary: 'Submit application for Senior Engineer',
    answers: [{ field: 'cover_letter', value: 'Hi' }],
    attachments: ['resume_v2.pdf'],
  };

  it('is stable for identical payloads', () => {
    expect(approvalPayloadHash(base)).toBe(approvalPayloadHash({ ...base }));
  });

  it('changes when any payload detail changes (PRD: exact-payload binding)', () => {
    const mutations = [
      { ...base, summary: 'Submit application for Senior Engineer II' },
      { ...base, destination: 'https://jobs.example.com/apply/999' },
      { ...base, answers: [{ field: 'cover_letter', value: 'Hello' }] },
      { ...base, attachments: ['resume_v3.pdf'] },
    ];
    const h0 = approvalPayloadHash(base);
    for (const m of mutations) {
      expect(approvalPayloadHash(m)).not.toBe(h0);
    }
  });
});

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(z.object({ email: z.string().email() }));

  it('passes valid data', () => {
    expect(pipe.transform({ email: 'a@b.co' })).toEqual({ email: 'a@b.co' });
  });

  it('raises a structured validation error with field paths', () => {
    let caught: unknown = null;
    try {
      pipe.transform({ email: 'not-an-email' });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeDefined();
    const body = (caught as { getResponse: () => unknown }).getResponse() as {
      error: string;
      issues: { path: string }[];
    };
    expect(body.error).toBe('validation_failed');
    expect(body.issues[0]!.path).toBe('email');
  });
});

describe('application state machine (PRD core gate)', () => {
  it('accepts legal transitions through the happy path', () => {
    const path: ApplicationStatus[] = [
      'DISCOVERED',
      'VERIFIED',
      'QUALIFIED',
      'DRAFTING',
      'READY_FOR_REVIEW',
      'APPROVED',
      'APPLYING',
      'SUBMITTED',
    ];
    for (let i = 0; i < path.length - 1; i++) {
      expect(() => assertTransition(path[i]!, path[i + 1]!)).not.toThrow();
    }
  });

  it('rejects the fabricated-submission shortcut and terminal dead-ends', () => {
    expect(() => assertTransition('DISCOVERED', 'SUBMITTED')).toThrow();
    expect(() => assertTransition('SUBMITTED', 'APPLYING')).toThrow();
    expect(() => assertTransition('REJECTED', 'SUBMITTED')).toThrow();
  });
});
