/**
 * Mirrors the allowlists/limits in the backend's
 * `apps/agents/theme_schema.py` and `apps/agents/behavior_schema.py`
 * (branch `config-theme-validation-2026-09-08`). Kept as literal tuples in
 * one file, the same "mirror, not re-derive" convention `src/lib/apiError.ts`
 * documents for the cross-repo contract files — a future backend addition
 * (e.g. a new widget shadow option) is a deliberate edit here, not a silent
 * client-side gap.
 *
 * Used both to build `RHFSelectField` options and as the source for
 * `agentDraftUpdateSchema`'s `z.enum()`s in `src/lib/schemas/agent.ts`, so
 * there is exactly one place these can drift from the backend.
 */

//: theme_schema.py's 9-color system: primary/secondary/accent are brand
// identity; background/surface/text are layout; success/warning/error are
// semantic states a themed widget still needs.
export const THEME_COLOR_KEYS = [
  'primary',
  'secondary',
  'accent',
  'background',
  'surface',
  'text',
  'success',
  'warning',
  'error',
] as const;

export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number];

// Web-safe stack every `typography.font_family` choice must come from — not
// an open text field the widget would have to load arbitrary web fonts for.
export const APPROVED_FONT_FAMILIES = [
  'system-ui',
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Source Sans Pro',
  'Nunito Sans',
] as const;

export const WIDGET_LAUNCHER_SHAPES = ['circle', 'rounded_square', 'pill'] as const;

export const WIDGET_POSITIONS = ['bottom_right', 'bottom_left', 'top_right', 'top_left'] as const;

export const WIDGET_PANEL_SIZES = ['compact', 'standard', 'large'] as const;

export const WIDGET_SHADOWS = ['none', 'sm', 'md', 'lg'] as const;

export const WIDGET_MODES = ['light', 'dark', 'auto'] as const;

export const WIDGET_MOBILE_LAYOUTS = ['fullscreen', 'overlay'] as const;

export const DEFAULT_WIDGET_POSITION: (typeof WIDGET_POSITIONS)[number] = 'bottom_right';

export const ANSWER_LENGTHS = ['concise', 'standard', 'detailed'] as const;

export const FORMALITY_LEVELS = ['casual', 'neutral', 'formal'] as const;

// Sane ceiling so a widget's quick-reply row stays usable, not a scroll of
// buttons — no spec-named number on the backend either, just a UI limit.
export const MAX_SUGGESTED_QUESTIONS = 6;
export const MAX_SUGGESTED_QUESTION_LENGTH = 140;

// Colour pairs the backend hard-rejects on AA failure — see
// `ThemeValidationService._assert_colors_pass_contrast`. Keyed by
// (foreground_key, background_key) into `theme_config.colors`.
export const CONTRAST_CHECKED_PAIRS: ReadonlyArray<readonly [ThemeColorKey, ThemeColorKey]> = [
  ['text', 'background'],
  ['text', 'surface'],
  ['success', 'background'],
  ['success', 'surface'],
  ['warning', 'background'],
  ['warning', 'surface'],
  ['error', 'background'],
  ['error', 'surface'],
];
