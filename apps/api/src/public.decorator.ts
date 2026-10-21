import { SetMetadata } from '@nestjs/common';

/** Marks a route as unauthenticated (health, dev login). */
export const IS_PUBLIC = 'pursuit:isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);
