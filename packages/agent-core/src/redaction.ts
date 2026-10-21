/**
 * Redaction of any sensitive-looking material from persisted agent steps and
 * logs (SECURITY_AND_POLICY: logs redact PII and credentials).
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'authorization',
  'auth',
  'api_key',
  'apikey',
  'key',
  'cookie',
  'set-cookie',
  'refresh_token',
  'access_token',
  'bearer',
]);

export function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[depth-limited]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    // mask obvious bearer tokens / emails in free text minimally
    return value.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[redacted-email]');
  }
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((v) => redactValue(v, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      out[k] = '[redacted]';
    } else {
      out[k] = redactValue(v, depth + 1);
    }
  }
  return out;
}

export function redactionJson(target: unknown): string {
  try {
    return JSON.stringify(redactValue(target));
  } catch {
    return '"[unserializable]"';
  }
}
