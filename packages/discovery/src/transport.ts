import { lookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import ipaddr from 'ipaddr.js';
import type { HttpResult, Reader } from './contracts.js';
export function publicAddress(address: string): boolean {
  try {
    let ip = ipaddr.parse(address);
    if (ip.kind() === 'ipv6' && (ip as ipaddr.IPv6).isIPv4MappedAddress())
      ip = (ip as ipaddr.IPv6).toIPv4Address();
    return ip.range() === 'unicast';
  } catch {
    return false;
  }
}
export async function resolvePublic(
  raw: string,
): Promise<{ url: URL; address: string; family: number }> {
  const url = new URL(raw);
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && !['80', '443'].includes(url.port))
  )
    throw new Error('unsafe_source_url');
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local'))
    throw new Error('private_source_host');
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((a) => !publicAddress(a.address)))
    throw new Error('private_source_address');
  const selected = addresses.find((a) => a.family === 4) ?? addresses[0]!;
  return { url, address: selected.address, family: selected.family };
}
// Pin the validated DNS result into the socket lookup: no DNS rebind between check and connect.
export function createReader(
  options: { maxBytes?: number; timeoutMs?: number; minHostDelayMs?: number } = {},
): Reader {
  const maxBytes = options.maxBytes ?? 8_000_000;
  const timeoutMs = options.timeoutMs ?? 20000;
  const hosts = new Map<string, Promise<void>>();
  const once = async (
    raw: string,
    headers: Record<string, string>,
    redirects: number,
    sameOriginOnly: boolean,
  ): Promise<HttpResult> => {
    const { url, address, family } = await resolvePublic(raw);
    const prior = hosts.get(url.hostname) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    hosts.set(url.hostname, gate);
    await prior;
    let result: HttpResult;
    try {
      result = await new Promise<HttpResult>((resolve, reject) => {
        const req = (url.protocol === 'https:' ? httpsRequest : httpRequest)(
          url,
          {
            method: 'GET',
            headers: {
              'User-Agent': 'PursuitDiscovery/0.1 (read-only career discovery)',
              'Accept-Encoding': 'identity',
              ...headers,
            },
            lookup: (_host, opts: any, callback: any) =>
              opts.all ? callback(null, [{ address, family }]) : callback(null, address, family),
          },
          (res) => {
            let size = 0;
            const chunks: Buffer[] = [];
            if (Number(res.headers['content-length']) > maxBytes) {
              res.destroy();
              reject(new Error('source_too_large'));
              return;
            }
            res.on('data', (chunk: Buffer) => {
              size += chunk.length;
              if (size > maxBytes) {
                res.destroy(new Error('source_too_large'));
              } else chunks.push(chunk);
            });
            res.on('error', reject);
            res.on('end', () =>
              resolve({
                status: res.statusCode ?? 0,
                url: url.toString(),
                headers: Object.fromEntries(
                  Object.entries(res.headers).map(([k, v]) => [
                    k,
                    Array.isArray(v) ? v.join(', ') : (v ?? ''),
                  ]),
                ),
                body: Buffer.concat(chunks).toString('utf8'),
              }),
            );
          },
        );
        req.on('error', reject);
        const timer = setTimeout(() => req.destroy(new Error('source_timeout')), timeoutMs);
        req.on('close', () => clearTimeout(timer));
        req.end();
      });
    } finally {
      setTimeout(() => {
        release();
        if (hosts.get(url.hostname) === gate) hosts.delete(url.hostname);
      }, options.minHostDelayMs ?? 1000);
    }
    if ([301, 302, 303, 307, 308].includes(result.status)) {
      if (redirects >= 3 || !result.headers.location) throw new Error('source_redirect_limit');
      // Never forward API credentials to a different origin.
      const target = new URL(result.headers.location, url);
      if (sameOriginOnly && target.origin !== url.origin)
        throw new Error('cross_origin_page_redirect_blocked');
      if (
        Object.keys(headers).some((k) => !['accept'].includes(k.toLowerCase())) &&
        target.origin !== url.origin
      )
        throw new Error('credential_redirect_blocked');
      return await once(target.toString(), headers, redirects + 1, sameOriginOnly);
    }
    return result;
  };
  return (url, config = {}) =>
    once(
      url,
      { Accept: config.accept ?? 'application/json', ...config.headers },
      0,
      config.sameOriginOnly ?? false,
    );
}
