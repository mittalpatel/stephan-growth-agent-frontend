import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'skipped', 'included')).toBe('base included');
  });

  it('merges tailwind conflicting classes (last wins)', () => {
    // twMerge: p-2 should override p-4 when listed after
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('ignores falsy values', () => {
    expect(cn(null, undefined, '', 'real')).toBe('real');
  });

  it('handles array input', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('returns empty string for no args', () => {
    expect(cn()).toBe('');
  });
});
