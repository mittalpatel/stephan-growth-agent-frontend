import { describe, expect, it } from 'vitest';

import { websiteDiscoverSchema } from '@/lib/schemas/knowledge';
import { pageFailureReason } from '@/lib/pageFailure';
import { t } from '@/locales';

/**
 * Client testing (13 Oct 2026): a failed page was reported as a bare count,
 * and website addresses were refused when friendly (`example.com`) and
 * accepted when they could never be crawled (`ftp://`). These pin both.
 */
describe('pageFailureReason', () => {
  const reasons = t.knowledge.pages.failureReason;

  it.each([
    [404, 'This page no longer exists on the website (error 404).'],
    [410, 'This page no longer exists on the website (error 410).'],
    [403, 'The website refused access to this page (error 403). It may need a login.'],
    [503, 'The website had a problem showing this page (error 503). Try again later.'],
    [418, 'The website returned an error for this page (error 418).'],
  ])('explains HTTP %i in plain words', (status, expected) => {
    expect(pageFailureReason({ http_status: status })).toBe(expected);
  });

  it('asks to retry later on a rate limit', () => {
    expect(pageFailureReason({ http_status: 429 })).toBe(reasons.rateLimited);
  });

  it('falls back when the page was never reached', () => {
    expect(pageFailureReason({ http_status: null })).toBe(reasons.unknown);
  });
});

describe('websiteDiscoverSchema root_url', () => {
  const base = { read_mode: 'all', include_paths: [], exclude_paths: [] } as const;
  const parse = (root_url: string) => websiteDiscoverSchema.safeParse({ ...base, root_url });

  it('adds https:// to a bare domain', () => {
    const result = parse('example.com');
    expect(result.success && result.data.root_url).toBe('https://example.com');
  });

  it('keeps an explicit http:// address', () => {
    const result = parse('http://example.com/shop');
    expect(result.success && result.data.root_url).toBe('http://example.com/shop');
  });

  it('refuses a non-web scheme with a message saying what to type', () => {
    const result = parse('ftp://example.com');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(t.knowledge.validation.rootUrlScheme);
  });

  it('refuses an empty address', () => {
    expect(parse('   ').error?.issues[0]?.message).toBe(t.knowledge.validation.rootUrlRequired);
  });
});
