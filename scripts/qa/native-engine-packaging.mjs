// Isolated packaged-runtime check. No repository node_modules or network calls.
import { mkdtempSync, cpSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
const temporary = mkdtempSync(join(tmpdir(), 'pursuit-packaged-engine-'));
const output = resolve('docs/qa/evidence/native-engine-packaging.json');
try {
  const runtime = join(temporary, 'runtime'),
    storage = join(temporary, 'private');
  cpSync(resolve('apps/desktop/engine'), runtime, { recursive: true });
  mkdirSync(storage);
  const durations = [];
  const request = (body) => {
    const start = performance.now();
    const run = spawnSync(
      process.execPath,
      [join(runtime, 'worker.cjs'), storage, '', 'disabled'],
      {
        cwd: storage,
        env: {
          PATH: process.env.PATH ?? '',
          ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
        },
        input: JSON.stringify(body),
        encoding: 'utf8',
        timeout: 15000,
        maxBuffer: 4_000_000,
      },
    );
    assert.ifError(run.error);
    const lines = run.stdout
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    durations.push(Math.round(performance.now() - start));
    return { run, result: lines.at(-1) };
  };
  let r = request({ action: 'snapshot' });
  assert.equal(r.run.status, 0);
  assert.equal(r.result.value.policy.enabled, false);
  r = request({ action: 'source.add', url: 'https://jobs.ashbyhq.com/packaging-fixture' });
  assert.equal(r.run.status, 0);
  for (let i = 0; i < 3; i++) {
    r = request({ action: 'snapshot' });
    assert.equal(r.run.status, 0);
    assert.equal(r.result.value.sources[0].provider, 'ashby');
  }
  const denied = request({ action: 'shell', command: 'must_not_execute' });
  assert.equal(denied.run.status, 1);
  assert.equal(denied.result.type, 'error');
  const sorted = [...durations].sort((a, b) => a - b);
  const report = {
    scope:
      'Packaged CJS worker and copied Playwright resources outside the repository, separate processes and private SQLite. No network, browsers or model calls.',
    platform: process.platform,
    node: process.versions.node,
    checks: {
      isolated_module_resolution: 'pass',
      default_execution_off: 'pass',
      source_persists_across_processes: 'pass',
      unsupported_action_rejected: 'pass',
    },
    cold_process_samples_ms: durations,
    median_ms:
      sorted.length % 2
        ? sorted[Math.floor(sorted.length / 2)]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2,
    max_ms: sorted.at(-1),
    limitations:
      'Small local process-startup measurements only; not a production throughput, RSS, browser resource or network-load qualification.',
  };
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
