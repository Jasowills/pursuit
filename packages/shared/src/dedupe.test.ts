import { describe, expect, it } from 'vitest';
import {
  canonicalizeUrl,
  jobFingerprint,
  normalizeCompanyName,
  normalizeRoleTitle,
} from './dedupe';

describe('canonicalizeUrl', () => {
  it('strips tracking params and normalizes case/scheme', () => {
    const a = canonicalizeUrl('https://WWW.Example.com/careers/Job?utm_source=x&id=7');
    const b = canonicalizeUrl('https://example.com/careers/Job?id=7');
    expect(a).toBe(b);
  });

  it('collapses default ports and trailing slashes', () => {
    expect(canonicalizeUrl('https://example.com:443/job/')).toBe('https://example.com/job');
    expect(canonicalizeUrl('http://example.com:80/job')).toBe('http://example.com/job');
  });

  it('keeps meaningful params sorted', () => {
    const a = canonicalizeUrl('https://x.com/p?b=2&a=1');
    const b = canonicalizeUrl('https://x.com/p?a=1&b=2');
    expect(a).toBe(b);
  });

  it('is robust to invalid input', () => {
    expect(canonicalizeUrl('  Not a URL  ')).toBe('not a url');
  });
});

describe('fingerprinting', () => {
  it('normalizes company suffixes', () => {
    expect(normalizeCompanyName('Acme Corp')).toBe('acme');
    expect(normalizeCompanyName('Acme LLC')).toBe('acme');
    expect(normalizeCompanyName('Acme')).toBe('acme');
  });

  it('normalizes role noise', () => {
    expect(normalizeRoleTitle('Senior Software Engineer II')).toBe('software engineer');
    expect(normalizeRoleTitle('Sr. UX designer')).toBe('ux designer');
  });

  it('dedupes across title-level variations', () => {
    expect(jobFingerprint('Rivian Inc', 'Senior Software Engineer II')).toBe(
      jobFingerprint('rivian', 'software engineer'),
    );
  });

  it('distinguishes different roles at same company', () => {
    expect(jobFingerprint('acme', 'designer')).not.toBe(jobFingerprint('acme', 'engineer'));
  });
});

it('preserves encoded query values through repeated canonicalization', () => {
  const url = canonicalizeUrl('https://example.com/job?value=a%26b&utm_source=x');
  expect(new URL(url).searchParams.get('value')).toBe('a&b');
  expect(canonicalizeUrl(url)).toBe(url);
});
it('preserves non-Latin titles and distinct C++/C# specialties', () => {
  expect(normalizeRoleTitle('软件工程师')).toBe('软件工程师');
  expect(jobFingerprint('Acme', 'C++ Engineer')).not.toBe(jobFingerprint('Acme', 'C# Engineer'));
});
