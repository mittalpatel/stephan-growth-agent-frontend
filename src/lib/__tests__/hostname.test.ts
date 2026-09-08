import { describe, it, expect } from 'vitest';

import { isValidHostname } from '../hostname';

describe('isValidHostname', () => {
  it('accepts a plain multi-label hostname with an alphabetic TLD', () => {
    for (const value of ['example.com', 'app.example.com', 'a-b.example.co.uk', 'x1.io']) {
      expect(isValidHostname(value)).toBe(true);
    }
  });

  it('rejects a scheme, a path, a bare label, or a stray hyphen', () => {
    for (const value of [
      'https://example.com',
      'example.com/path',
      '-example.com',
      'example-.com',
      'example..com',
      'exa mple.com',
      'example',
    ]) {
      expect(isValidHostname(value)).toBe(false);
    }
  });

  it('rejects a numeric-only TLD', () => {
    expect(isValidHostname('example.123')).toBe(false);
  });

  it('rejects a hostname over 253 characters', () => {
    const long = `${'a'.repeat(250)}.io`;
    expect(isValidHostname(long)).toBe(false);
  });

  it('rejects "localhost" by default, accepts it only when allowLocalhost is set', () => {
    expect(isValidHostname('localhost')).toBe(false);
    expect(isValidHostname('localhost', { allowLocalhost: true })).toBe(true);
  });
});
