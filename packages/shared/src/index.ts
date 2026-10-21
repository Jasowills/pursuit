export * from './contracts';
export * from './state-machine';
export * from './untrusted';
export * from './dedupe';
export * from './eligibility';
export * from './agent-prompt';
export { ALLOWED_APPLICATION_TRANSITIONS } from './contracts';

/** Safe JSON parse for anything that crossed a trust boundary. */
export function parseJsonSafe<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Extract the first JSON object/model response embedded in LLM text. */
export function extractLastJsonObject(text: string): Record<string, unknown> | null {
  const matches = [...text.matchAll(/\{[\s\S]*?\}/g)];
  for (let i = matches.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(matches[i]![0]) as Record<string, unknown>;
    } catch {
      continue;
    }
  }
  return null;
}
