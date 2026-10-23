/**
 * Job normalization, canonical URLs and dedupe fingerprints.
 * DATA_MODEL: unique (source_id, external_id) when present; otherwise
 * canonical URL + normalized company/role fingerprint with merge review.
 * Uniqueness across canonical URL, ATS IDs and company/role fingerprints.
 */

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'ref',
  'gh_src',
]);

export function canonicalizeUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl.trim().toLowerCase();
  }
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  // drop default ports so :443/https and :80/http collapse
  if (
    (url.protocol === 'https:' && url.port === '443') ||
    (url.protocol === 'http:' && url.port === '80')
  ) {
    url.port = '';
  }
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  // sort remaining params for stable comparison
  const search = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
  const qs = new URLSearchParams(search).toString();
  url.search = '';
  url.hash = '';
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  return url.toString() + (qs ? `?${qs}` : '');
}

/** Normalize a human string for fingerprinting: lowercase, alnum+space only. */
function normalizeToken(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}+# ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const COMPANY_SUFFIXES = [
  'incorporated',
  'corporation',
  'company',
  'inc',
  'corp',
  'llc',
  'ltd',
  'co',
  'gmbh',
];

export function normalizeCompanyName(name: string): string {
  let t = normalizeToken(name);
  // strip suffixes repeatedly ("acme corp industries" edge ignored by design)
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of COMPANY_SUFFIXES) {
      if (t.endsWith(` ${suffix}`)) {
        t = t.slice(0, -(suffix.length + 1)).trim();
        changed = true;
      }
    }
  }
  return t;
}

const ROLE_NOISE = [
  'senior',
  'sr',
  'junior',
  'jr',
  'mid',
  'lead',
  'staff',
  'principal',
  'i',
  'ii',
  'iii',
];

export function normalizeRoleTitle(title: string): string {
  let t = normalizeToken(title);
  for (const noise of ROLE_NOISE) {
    // remove standalone noise levels (careful not to merge words)
    t = t
      .split(' ')
      .filter((w) => w !== noise)
      .join(' ');
  }
  return t.trim();
}

/**
 * Similarity hint for retrieval/clustering, NEVER a unique job identity.
 * Format: `company:role` of the NORMALIZED parts.
 */
export function jobFingerprint(companyName: string, roleTitle: string): string {
  return `${normalizeCompanyName(companyName)}:${normalizeRoleTitle(roleTitle)}`;
}
