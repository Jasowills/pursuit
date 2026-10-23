import { extractResume } from '@pursuit/tailoring/imports';
const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (value: unknown) => void;
};
scope.onmessage = async (event) => {
  try {
    scope.postMessage({
      resume: await extractResume(new Uint8Array(event.data.bytes), event.data.filename),
    });
  } catch (e) {
    scope.postMessage({ error: e instanceof Error ? e.message : 'document_import_failed' });
  }
};
