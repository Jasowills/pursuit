// Explicit opt-in read-only public source check. No user database or application executor.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { DiscoveryStore } from '../../packages/discovery/dist/index.js';

if (process.env.PURSUIT_LIVE_SOURCE_CHECK !== 'true')
  throw Error('Explicit live-source opt-in required');
const temporary = mkdtempSync(join(tmpdir(), 'pursuit-watcher-lifecycle-'));
const database = join(temporary, 'discovery.sqlite');
const store = new DiscoveryStore(database);
let child;
try {
  store.addSource({
    id: 'qa-live-linear',
    provider: 'ashby',
    board: 'linear',
    company: 'Linear',
    intervalMinutes: 1440,
  });
  const started = performance.now();
  child = spawn(process.execPath, [resolve('packages/discovery/dist/cli.js'), 'watch'], {
    cwd: temporary,
    env: {
      PATH: process.env.PATH ?? '',
      PURSUIT_DISCOVERY_DB: database,
      ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '',
    exited = false;
  const closed = new Promise((resolve) =>
    child.once('close', (code, signal) => {
      exited = true;
      resolve({ code, signal });
    }),
  );
  child.stdout.resume();
  child.stderr.on('data', (data) => {
    stderr = (stderr + data.toString()).slice(-4000);
  });
  child.once('error', () => {
    exited = true;
  });
  let run;
  while (performance.now() - started < 45000) {
    run = store.runs().find((r) => r.source_id === 'qa-live-linear' && r.status !== 'running');
    if (run || exited) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(run, 'Watcher did not finish a bounded public source read');
  assert.ok(['complete', 'partial'].includes(run.status), `Source read failed: ${run.diagnostics}`);
  const before = store.jobs({ limit: 5000 }).length;
  assert.ok(before > 0, 'Source returned no observed roles; this is not a passing coverage claim');
  const stopStart = performance.now();
  child.kill('SIGTERM');
  let timeout;
  const stopped = await Promise.race([
    closed,
    new Promise((_, reject) => {
      timeout = setTimeout(() => reject(Error('Watcher did not stop')), 5000);
    }),
  ]).finally(() => clearTimeout(timeout));
  assert.equal(stopped.code, 0, `Watcher failed to stop cleanly: ${stderr}`);
  const reopened = new DiscoveryStore(database);
  try {
    assert.equal(reopened.jobs({ limit: 5000 }).length, before);
    assert.equal(
      reopened.runs().some((r) => r.status === 'running'),
      false,
    );
    const source = reopened.sources()[0];
    assert.ok(source.last_success);
    assert.ok(source.next_poll > new Date().toISOString());
    const report = {
      observedAt: new Date().toISOString(),
      scope:
        'Actual discovery CLI subprocess, disposable SQLite, one read-only Linear Ashby public-board poll, SIGTERM and independent database reopen. No models, browser logins, applications or user data.',
      source: 'https://api.ashbyhq.com/posting-api/job-board/linear',
      poll_status: run.status,
      observed_roles: before,
      read_and_startup_ms: Math.round(stopStart - started),
      shutdown_ms: Math.round(performance.now() - stopStart),
      clean_exit: true,
      persisted_after_reopen: true,
      next_poll_in_future: true,
      no_running_run_after_shutdown: true,
      limitations:
        'One public source on one host. Not indefinite uptime, multi-host synchronization, source recall, auto-applying or a desktop supervisor qualification.',
    };
    writeFileSync(
      resolve('docs/qa/evidence/watcher-lifecycle.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    reopened.close();
  }
} finally {
  if (child && child.exitCode === null) child.kill('SIGKILL');
  store.close();
  rmSync(temporary, { recursive: true, force: true });
}
