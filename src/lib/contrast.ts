/**
 * WCAG 2.2 AA relative-luminance contrast check — a straight port of the
 * backend's `apps.agents.services.theme_validation_service
 * .ThemeValidationService.check_contrast` (branch
 * `config-theme-validation-2026-09-08`), including its direction-correct
 * fallback search. Kept local rather than calling
 * `POST /api/v1/settings/brand/contrast-check/` on every keystroke: the math
 * is pure and cheap, so a network round trip per color edit would only add
 * latency. The endpoint remains the server's final authority — a failing
 * PATCH to an agent's draft (or the org's `/settings/brand/`) returns this
 * exact same computed result, so nothing here can silently diverge into a
 * false "pass" the backend then rejects.
 *
 * Used for instant inline feedback in the agent theme editor
 * (`AgentDraftTab`) and the organization branding tab (`BrandSettingsTab`).
 */

const AA_NORMAL_TEXT_RATIO = 4.5;
const AA_LARGE_TEXT_RATIO = 3.0;

// `#` + 3 or 6 hex digits — matches the backend's `theme_schema.is_valid_hex_color`
// exactly. Exported so `src/lib/schemas/agent.ts` validates the same shape
// client-side rather than re-deriving a slightly different regex.
export const HEX_COLOR_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_RE.test(value);
}

export interface ContrastResult {
  ratio: number;
  passesAaNormalText: boolean;
  passesAaLargeText: boolean;
  /** A verified-passing fallback for the foreground, only set on failure. */
  suggestedFallback: string | null;
}

function hexToRgb(hex: string): [number, number, number] {
  let value = hex.slice(1);
  if (value.length === 3) {
    value = value
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]: readonly [number, number, number]): string {
  const clamp = (c: number) => Math.max(0, Math.min(255, Math.round(c)));
  return `#${[r, g, b]
    .map(clamp)
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}

function channelLuminance(channel8Bit: number): number {
  const channel = channel8Bit / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function darken(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex([r * factor, g * factor, b * factor]);
}

function lighten(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex([
    r + (255 - r) * (1 - factor),
    g + (255 - g) * (1 - factor),
    b + (255 - b) * (1 - factor),
  ]);
}

/**
 * Contrast ratio plus AA pass/fail, and — on an AA-normal-text failure only
 * — a computed fallback that moves the foreground toward whichever extreme
 * (black or white) actually increases contrast against `backgroundHex`.
 * Darkening a light-on-dark pair would push both colors toward black and
 * make contrast worse, not better, hence the direction check.
 */
export function checkContrast(foregroundHex: string, backgroundHex: string): ContrastResult {
  const ratio = contrastRatio(foregroundHex, backgroundHex);
  const passesAaNormalText = ratio >= AA_NORMAL_TEXT_RATIO;
  const passesAaLargeText = ratio >= AA_LARGE_TEXT_RATIO;
  let suggestedFallback: string | null = null;

  if (!passesAaNormalText) {
    const moveTowardBlack = relativeLuminance(backgroundHex) >= relativeLuminance(foregroundHex);
    for (const factor of [0.75, 0.5, 0.25, 0]) {
      const candidate = moveTowardBlack
        ? darken(foregroundHex, factor)
        : lighten(foregroundHex, factor);
      if (contrastRatio(candidate, backgroundHex) >= AA_NORMAL_TEXT_RATIO) {
        suggestedFallback = candidate;
        break;
      }
    }
  }

  return { ratio, passesAaNormalText, passesAaLargeText, suggestedFallback };
}
