import type { CSSProperties } from 'react';

import { isValidHexColor } from '@/lib/contrast';

/**
 * Inline token overrides that carry an organization's own color into one element.
 *
 * This is the sanctioned exception to "colors come from globals.css only", for the
 * same reason `RHFColorField` is one: the value is tenant data, not a design
 * decision, so no token can hold it. It works by re-pointing an existing token pair
 * on a single subtree, so every class already derived from it (`bg-brand-accent`,
 * `text-brand-surface-foreground/70`) follows, and the override never leaks past
 * that element. The text color is the backend's server-computed readable one
 * (`on_color_primary`), never guessed here. Both values are validated as hex before
 * they reach a style attribute; anything else yields no override at all.
 */
function isPair(color: string, onColor: string): boolean {
  return isValidHexColor(color) && isValidHexColor(onColor);
}

/** Re-points `--brand-accent` (the small highlight tile) to the organization's color. */
export function orgAccentStyle(color: string, onColor: string): CSSProperties | undefined {
  if (!isPair(color, onColor)) return undefined;
  return { '--brand-accent': color, '--brand-accent-foreground': onColor } as CSSProperties;
}

/**
 * Re-points `--brand-surface` (the full-bleed brand panel) to the organization's
 * color, and inverts the accent pair inside it: the platform's jaune highlight would
 * vanish on a yellow panel, so the marks on it take the panel's own readable text
 * color instead.
 */
export function orgSurfaceStyle(color: string, onColor: string): CSSProperties | undefined {
  if (!isPair(color, onColor)) return undefined;
  return {
    '--brand-surface': color,
    '--brand-surface-foreground': onColor,
    '--brand-accent': onColor,
    '--brand-accent-foreground': color,
  } as CSSProperties;
}
