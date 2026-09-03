import { describe, it, expect } from 'vitest';

import { format, formatCurrency, formatDate, formatNumber, plural } from '../i18n';

describe('format', () => {
  it('substitutes named placeholders', () => {
    expect(format('Showing {displayed} of {total} items', { displayed: 20, total: 137 })).toBe(
      'Showing 20 of 137 items'
    );
  });

  it('runs numbers through the number formatter', () => {
    expect(format('{count} rows', { count: 1234567 })).toBe('1,234,567 rows');
  });

  it('leaves an unmatched placeholder verbatim', () => {
    // A visible `{total}` gets reported as a bug; "of undefined items" gets
    // misdiagnosed as bad data.
    expect(format('Showing {displayed} of {total}', { displayed: 1 })).toBe('Showing 1 of {total}');
  });

  it('returns the template untouched when it has no placeholders', () => {
    expect(format('Nothing to substitute', {})).toBe('Nothing to substitute');
  });
});

describe('plural', () => {
  const forms = { one: '{count} widget', other: '{count} widgets' };

  it('picks the singular for exactly one', () => {
    expect(plural(1, forms)).toBe('1 widget');
  });

  it('picks the plural for zero and for many', () => {
    expect(plural(0, forms)).toBe('0 widgets');
    expect(plural(5, forms)).toBe('5 widgets');
  });

  it('falls back to `other` when the selected form is absent', () => {
    // A catalog that declares only `other` still renders — a missing form must
    // not produce `undefined` in the UI.
    expect(plural(1, { other: '{count} items' })).toBe('1 items');
  });
});

describe('formatNumber', () => {
  it('applies the locale thousands separator', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
});

describe('formatCurrency', () => {
  it('treats the input as minor units', () => {
    // 12345 cents, not 12345 dollars — floats cannot represent most decimal
    // amounts exactly, so money crosses the wire as integers.
    expect(formatCurrency(12345)).toBe('$123.45');
  });
});

describe('formatDate', () => {
  it('returns the fallback for null, undefined, and empty string', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  it('returns the fallback for an unparseable value rather than "Invalid Date"', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('honours a caller-supplied fallback', () => {
    expect(formatDate(null, 'n/a')).toBe('n/a');
  });

  it('formats a valid ISO timestamp', () => {
    expect(formatDate('2026-01-15T10:30:00Z')).toMatch(/Jan/);
  });
});
