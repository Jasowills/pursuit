#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { DiscoveryStore } from './store.js';
import { DiscoveryEngine } from './engine.js';
import { createReader } from './transport.js';
const [command, ...args] = process.argv.slice(2);
const store = new DiscoveryStore(
  process.env.PURSUIT_DISCOVERY_DB ?? join(homedir(), '.pursuit', 'discovery.sqlite'),
);
let stopped = false;
const reader = createReader();
const engine = new DiscoveryEngine(store, async (url, options) => {
  if (stopped) throw new Error('worker_stopped');
  return reader(url, options);
});
const output = (value: unknown) => process.stdout.write(JSON.stringify(value, null, 2) + '\n');
try {
  switch (command) {
    case 'add':
      output(store.addSource(JSON.parse(readFileSync(args[0]!, 'utf8'))));
      break;
    case 'disable':
      store.setEnabled(args[0]!, false);
      output({ disabled: args[0] });
      break;
    case 'enable':
      store.setEnabled(args[0]!, true);
      output({ enabled: args[0] });
      break;
    case 'sources':
      output(store.sources());
      break;
    case 'poll':
      output(args[0] ? await engine.poll(args[0]) : await engine.due());
      break;
    case 'crawl':
      output(await engine.crawl(args[0]!, 5));
      break;
    case 'discover':
      output(
        await engine.discover(
          JSON.parse(readFileSync(args[0]!, 'utf8')),
          process.env.BRAVE_SEARCH_API_KEY,
        ),
      );
      break;
    case 'hunt':
      output(
        await engine.hunt(
          JSON.parse(readFileSync(args[0]!, 'utf8')),
          process.env.BRAVE_SEARCH_API_KEY,
        ),
      );
      break;
    case 'matches':
      output(engine.matches(JSON.parse(readFileSync(args[0]!, 'utf8'))));
      break;
    case 'verify':
      output(await engine.verify(args[0]!));
      break;
    case 'jobs':
      output(store.jobs({ query: args.join(' ') }));
      break;
    case 'runs':
      output(store.runs());
      break;
    case 'frontier':
      output(store.frontier());
      break;
    case 'watch': {
      process.on('SIGINT', () => {
        stopped = true;
      });
      process.on('SIGTERM', () => {
        stopped = true;
      });
      while (!stopped) {
        output(await engine.due(() => stopped));
        if (!stopped)
          await new Promise<void>((resolve) => {
            const finish = () => {
              clearTimeout(t);
              process.removeListener('SIGINT', finish);
              process.removeListener('SIGTERM', finish);
              resolve();
            };
            const t = setTimeout(finish, 30000);
            process.once('SIGINT', finish);
            process.once('SIGTERM', finish);
          });
      }
      break;
    }
    default:
      output({
        usage:
          'pursuit-discovery add source.json | sources | discover profile.json | hunt profile.json | verify job-id | poll [source-id] | crawl public-careers-url | jobs [query] | matches profile.json | runs | frontier | watch',
        capability:
          'Read-only sourcing. No applications, emails, payments or browser logins. BRAVE_SEARCH_API_KEY is optional; public job-board discovery works without it.',
      });
  }
} catch (e) {
  process.stderr.write(
    (e instanceof Error && /^[a-z_\d]+$/.test(e.message)
      ? e.message
      : 'Discovery command failed. Check the input/configuration and source-run diagnostics; credentials are never printed.') +
      '\n',
  );
  process.exitCode = 1;
} finally {
  store.close();
}
