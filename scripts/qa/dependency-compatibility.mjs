// Exercise the actual consumers affected by scoped security overrides.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

function consumerRequire(workspace, dependencies) {
  let require = createRequire(resolve(workspace, 'package.json'));
  for (const name of dependencies) require = createRequire(require.resolve(name));
  return require;
}

test('Prisma loads and merges configuration with the patched deepmerge dependency', async () => {
  const prisma = consumerRequire('packages/database', ['prisma/package.json']);
  const configPath = prisma.resolve('@prisma/config');
  const config = createRequire(configPath);
  const { deepmerge } = await import(pathToFileURL(config.resolve('deepmerge-ts')).href);
  assert.deepEqual(deepmerge({ migrations: { path: 'migrations' } }, { schema: 'schema.prisma' }), {
    migrations: { path: 'migrations' },
    schema: 'schema.prisma',
  });
  const left = {};
  left.self = left;
  const right = {};
  right.self = right;
  const merged = deepmerge(left, right);
  assert.equal(merged.self, merged, 'Recursive graphs must not exhaust the stack');
  const temporary = await mkdtemp(join(tmpdir(), 'pursuit-prisma-config-'));
  try {
    const configFile = join(temporary, 'prisma.config.cjs');
    await writeFile(
      configFile,
      `const { defineConfig } = require(${JSON.stringify(configPath)});\nmodule.exports = defineConfig({ schema: 'schema.prisma', migrations: { path: 'migrations' } });\n`,
    );
    const { loadConfigFromFile } = config(configPath);
    const loaded = await loadConfigFromFile({ configRoot: temporary, configFile });
    assert.equal(loaded.error, undefined);
    assert.equal(loaded.config.schema, join(temporary, 'schema.prisma'));
    assert.equal(loaded.config.migrations.path, join(temporary, 'migrations'));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('Expo Xcode consumer still generates unique valid PBX identifiers using patched UUID', () => {
  const plugins = consumerRequire('apps/mobile', [
    'expo',
    '@expo/cli',
    '@expo/config',
    '@expo/config-plugins',
  ]);
  const xcode = plugins('xcode');
  const project = xcode.project('not-read.pbxproj');
  project.hash = { project: { objects: {} } };
  const ids = new Set(Array.from({ length: 1000 }, () => project.generateUuid()));
  assert.equal(ids.size, 1000);
  for (const id of ids) assert.match(id, /^[A-F0-9]{24}$/);
  // Xcode uses v4 without a caller-provided output buffer. Verify the patched
  // dependency also rejects the vulnerable v5 short-buffer case.
  const uuid = createRequire(plugins.resolve('xcode'))('uuid');
  assert.throws(() => uuid.v5('fixture', uuid.v5.DNS, new Uint8Array(8), 4), RangeError);
});
