import { parseFragment } from 'parse5';
export function plain(html: string): string {
  const root = parseFragment(html);
  const queue: any[] = [root];
  const output: string[] = [];
  let visited = 0;
  while (queue.length) {
    if (++visited > 100000) throw new Error('html_node_budget');
    const n = queue.pop();
    if (['script', 'style', 'noscript'].includes(n.nodeName)) continue;
    if (n.nodeName === '#text') output.push(n.value);
    else for (const c of [...(n.childNodes ?? [])].reverse()) queue.push(c);
  }
  return output.join(' ').replace(/\s+/gu, ' ').trim();
}
export function tokens(s: string): string[] {
  return (
    s
      .normalize('NFKC')
      .toLocaleLowerCase()
      .match(/[\p{L}\p{N}]+(?:[+#]+|\.[\p{L}\p{N}]+)*/gu) ?? []
  );
}
export function canonicalUrl(raw: string): string {
  const u = new URL(raw);
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password)
    throw new Error('A public HTTP(S) URL is required.');
  u.hash = '';
  for (const k of [...u.searchParams.keys()])
    if (/^(utm_|gclid$|fbclid$|gh_src$)/i.test(k)) u.searchParams.delete(k);
  u.searchParams.sort();
  return u.toString();
}
export function iso(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const n = Date.parse(raw);
  return Number.isFinite(n) ? new Date(n).toISOString() : null;
}
export function httpUrl(raw: unknown): string | null {
  try {
    return typeof raw === 'string' ? canonicalUrl(raw) : null;
  } catch {
    return null;
  }
}
