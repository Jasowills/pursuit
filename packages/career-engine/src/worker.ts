import { readFileSync } from 'node:fs';
import { CareerEngine } from './index.js';
const output = (value: unknown) => process.stdout.write(JSON.stringify(value) + '\n');
async function main() {
  let engine: CareerEngine | undefined;
  try {
    const [major = 0, minor = 0] = process.versions.node.split('.').map(Number);
    if (major < 22 || (major === 22 && minor < 13)) throw Error('node_22_13_or_later_required');
    const raw = readFileSync(0);
    if (raw.length > 4_000_000) throw Error('request_too_large');
    const envelope = JSON.parse(raw.toString('utf8'));
    engine = new CareerEngine(process.argv[2]!, {
      browserExecutable: process.argv[3] || undefined,
      executionEnabled: process.argv[4] === 'enabled',
      progress: (event) => output({ type: 'progress', event }),
    });
    output({ type: 'result', value: await engine.dispatch(envelope) });
  } catch (e) {
    output({
      type: 'error',
      error:
        e instanceof Error && /^[a-z_\d]+$/.test(e.message)
          ? e.message
          : 'career_action_failed_review_setup_and_inputs',
    });
    process.exitCode = 1;
  } finally {
    engine?.close();
  }
}
void main();
