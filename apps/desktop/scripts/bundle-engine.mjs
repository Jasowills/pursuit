import { cpSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const desktop = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(desktop, 'engine');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
copyFileSync(
  resolve(desktop, '../../packages/career-engine/dist/worker.cjs'),
  resolve(out, 'worker.cjs'),
);
const engineRequire = createRequire(resolve(desktop, '../../packages/career-engine/package.json'));
const playwright = dirname(engineRequire.resolve('playwright-core/package.json'));
cpSync(playwright, resolve(out, 'node_modules/playwright-core'), { recursive: true });
