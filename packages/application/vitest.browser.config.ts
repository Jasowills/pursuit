import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['test/*.browser.ts'], testTimeout: 60000 } });
