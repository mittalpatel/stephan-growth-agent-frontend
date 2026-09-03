import { describe, it, expect } from 'vitest';
import { DEFAULT_LANDING } from '@/constants/navItems';

import { safeRedirect } from '../auth/safeRedirect';

describe('safeRedirect', () => {
  it('returns fallback for null input', () => {
    expect(safeRedirect(null)).toBe(DEFAULT_LANDING);
  });

  it('returns fallback for undefined', () => {
    expect(safeRedirect(undefined)).toBe(DEFAULT_LANDING);
  });

  it('allows relative paths', () => {
    expect(safeRedirect('/dashboard')).toBe('/dashboard');
  });

  it('allows nested relative paths', () => {
    expect(safeRedirect('/users/123')).toBe('/users/123');
  });

  // The two below are the reason this function exists: a `callbackUrl` comes
  // straight from the query string, so an unchecked redirect hands an attacker a
  // link that looks like your domain and lands on theirs.
  it('blocks open-redirect to external URL', () => {
    expect(safeRedirect('https://evil.com')).toBe(DEFAULT_LANDING);
  });

  it('blocks protocol-relative URLs', () => {
    expect(safeRedirect('//evil.com')).toBe(DEFAULT_LANDING);
  });

  // Regression: the guard used to test `startsWith('/') && !startsWith('//')`
  // against the raw string and then return that string unexamined. A backslash in
  // the second position defeats that test while the URL parser — and every browser
  // — still reads the result as protocol-relative.
  it('blocks backslash-smuggled protocol-relative URLs', () => {
    expect(safeRedirect('/\\/evil.com')).toBe(DEFAULT_LANDING);
    expect(safeRedirect('/\\evil.com')).toBe(DEFAULT_LANDING);
    expect(safeRedirect('\\/evil.com')).toBe(DEFAULT_LANDING);
  });

  it('blocks non-navigable schemes that still parse', () => {
    expect(safeRedirect('javascript:alert(1)')).toBe(DEFAULT_LANDING);
    expect(safeRedirect('data:text/html,<script>alert(1)</script>')).toBe(DEFAULT_LANDING);
  });

  it('blocks a same-path URL on another host', () => {
    expect(safeRedirect('https://evil.com/dashboard')).toBe(DEFAULT_LANDING);
  });

  it('preserves query and hash on an allowed path', () => {
    expect(safeRedirect('/users?page=2#top')).toBe('/users?page=2#top');
  });

  it('normalizes traversal rather than passing it through', () => {
    expect(safeRedirect('/a/../b')).toBe('/b');
  });

  it('allows an absolute URL on the allowed origin, returned as a path', () => {
    expect(safeRedirect('http://localhost:3000/settings')).toBe('/settings');
  });

  it('uses custom fallback when provided', () => {
    expect(safeRedirect(null, '/login')).toBe('/login');
  });
});
