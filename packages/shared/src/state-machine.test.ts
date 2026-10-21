import { describe, expect, it } from 'vitest';
import {
  ALLOWED_APPLICATION_TRANSITIONS,
  isTransitionAllowed,
  assertTransition,
} from './state-machine';
import type { ApplicationStatus } from './contracts';

describe('application state machine', () => {
  it('follows the PRD pipeline order', () => {
    const path = [
      'DISCOVERED',
      'VERIFIED',
      'QUALIFIED',
      'DRAFTING',
      'READY_FOR_REVIEW',
      'APPROVED',
      'APPLYING',
    ] as const;
    for (let i = 0; i < path.length - 1; i++) {
      expect(isTransitionAllowed(path[i]!, path[i + 1]!)).toBe(true);
    }
  });

  it('never jumps to SUBMITTED without APPLYING', () => {
    expect(isTransitionAllowed('READY_FOR_REVIEW', 'SUBMITTED')).toBe(false);
    expect(isTransitionAllowed('DISCOVERED', 'SUBMITTED')).toBe(false);
    expect(isTransitionAllowed('APPROVED', 'SUBMITTED')).toBe(false);
  });

  it('requires human verification for uncertain outcomes, never blind retry', () => {
    expect(isTransitionAllowed('APPLYING', 'NEEDS_VERIFICATION')).toBe(true);
    expect(isTransitionAllowed('NEEDS_VERIFICATION', 'SUBMITTED')).toBe(true);
    expect(isTransitionAllowed('NEEDS_ATTENTION', 'SUBMITTED')).toBe(false);
  });

  it('terminal states stay terminal', () => {
    expect(isTransitionAllowed('REJECTED', 'APPLYING')).toBe(false);
    expect(isTransitionAllowed('WITHDRAWN', 'DISCOVERED')).toBe(false);
  });

  it('assertTransition throws on illegal moves', () => {
    expect(() => assertTransition('VERIFIED', 'SUBMITTED')).toThrow();
    expect(() => assertTransition('VERIFIED', 'QUALIFIED')).not.toThrow();
  });

  it('every status has an explicit transition list', () => {
    const statuses: ApplicationStatus[] = [
      'DISCOVERED',
      'VERIFIED',
      'QUALIFIED',
      'DRAFTING',
      'READY_FOR_REVIEW',
      'APPROVED',
      'APPLYING',
      'SUBMITTED',
      'NEEDS_ATTENTION',
      'NEEDS_VERIFICATION',
      'FAILED',
      'REJECTED',
      'SKIPPED',
      'WITHDRAWN',
    ];
    for (const s of statuses) {
      expect(Array.isArray(ALLOWED_APPLICATION_TRANSITIONS[s])).toBe(true);
    }
  });
});
