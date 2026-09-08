import { describe, expect, it } from 'vitest';

import { checkContrast, isValidHexColor } from '../contrast';

describe('isValidHexColor', () => {
  it('accepts 3- and 6-digit hex', () => {
    expect(isValidHexColor('#fff')).toBe(true);
    expect(isValidHexColor('#0F172A')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isValidHexColor('#ff')).toBe(false);
    expect(isValidHexColor('blue')).toBe(false);
    expect(isValidHexColor(undefined)).toBe(false);
    expect(isValidHexColor(42)).toBe(false);
  });
});

describe('checkContrast', () => {
  it('passes the seeded default palette (same pair the backend asserts on)', () => {
    // Mirrors apps.agents.tests.test_agent_service.TestProvisionDefaults
    // .test_seeded_draft_palette_passes_contrast — same two colors, so a
    // drift in either implementation is caught here too.
    const result = checkContrast('#0F172A', '#FFFFFF');
    expect(result.ratio).toBeGreaterThan(15);
    expect(result.passesAaNormalText).toBe(true);
    expect(result.passesAaLargeText).toBe(true);
    expect(result.suggestedFallback).toBeNull();
  });

  it('fails a pair below 4.5:1 and suggests a passing fallback', () => {
    // The YB Inspire teal on white — 2.24:1, well under AA.
    const result = checkContrast('#5EBCB8', '#FFFFFF');
    expect(result.passesAaNormalText).toBe(false);
    expect(result.suggestedFallback).not.toBeNull();
    // The suggested fallback must actually pass against the same background.
    const verified = checkContrast(result.suggestedFallback as string, '#FFFFFF');
    expect(verified.passesAaNormalText).toBe(true);
  });

  it('darkens the foreground when the background is the lighter of the pair', () => {
    // Teal text on white: white is lighter than the teal foreground, so the
    // fix is to darken the foreground further, not lighten it.
    const failing = checkContrast('#5EBCB8', '#FFFFFF');
    const fallback = failing.suggestedFallback as string;
    const originalLuminance = checkContrast('#5EBCB8', '#000000').ratio;
    const fallbackLuminance = checkContrast(fallback, '#000000').ratio;
    // Darkened, so it now contrasts *less* with black than the original did.
    expect(fallbackLuminance).toBeLessThan(originalLuminance);
  });

  it('treats large text at the 3:1 floor separately from normal text', () => {
    const result = checkContrast('#8a8a8a', '#FFFFFF');
    expect(result.ratio).toBeGreaterThanOrEqual(3);
    expect(result.ratio).toBeLessThan(4.5);
    expect(result.passesAaLargeText).toBe(true);
    expect(result.passesAaNormalText).toBe(false);
  });
});
