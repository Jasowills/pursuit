import { parentPort, workerData } from 'node:worker_threads';
import { extractResume } from './imports.js';
async function main() {
  try {
    parentPort!.postMessage({
      resume: await extractResume(new Uint8Array(workerData.bytes), workerData.filename),
    });
  } catch (e) {
    parentPort!.postMessage({
      error:
        e instanceof Error && /^[a-z_]+$/.test(e.message) ? e.message : 'document_import_failed',
    });
  }
}
void main();
