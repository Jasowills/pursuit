import { Injectable, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { BadRequestException } from '@nestjs/common';

/**
 * Zod-driven validation pipe (DEC-09): one validation layer shared with the
 * web and mobile clients via @pursuit/shared contracts.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    if (process.env['DEBUG_ZOD_PIPE']) {
      console.log('[zod-pipe]', typeof value, JSON.stringify(value)?.slice(0, 120));
    }
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'validation_failed',
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    return parsed.data;
  }
}
