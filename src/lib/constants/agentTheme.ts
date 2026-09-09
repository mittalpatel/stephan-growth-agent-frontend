/**
 * Mirrors the allowlists/limits in the backend's
 * `apps/agents/theme_schema.py` and `apps/agents/behavior_schema.py`
 * (as of commit `f163f70`, "Add widget bot display_name and rich-text
 * greeting, close embed-widget gap"). Kept as literal tuples in one file,
 * the same "mirror, not re-derive" convention `src/lib/apiError.ts`
 * documents for the cross-repo contract files — a future backend addition
 * (e.g. a new widget mode) is a deliberate edit here, not a silent
 * client-side gap.
 *
 * Used both to build `RHFSelectField` options and as the source for
 * `agentDraftUpdateSchema`'s `z.enum()`s in `src/lib/schemas/agent.ts`, so
 * there is exactly one place these can drift from the backend.
 */

//: theme_schema.py's color system, trimmed to 8 as of 2026-09-09 (`accent`
// dropped as low-value form complexity): primary/secondary are brand
// identity; background/surface/text are layout; success/warning/error are
// semantic states a themed widget still needs.
export const THEME_COLOR_KEYS = [
  'primary',
  'secondary',
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
  'Work Sans',
  'Poppins',
] as const;

export const WIDGET_LAUNCHER_SHAPES = ['circle', 'rounded_square', 'pill'] as const;

export const WIDGET_POSITIONS = ['bottom_right', 'bottom_left', 'top_right', 'top_left'] as const;

export const WIDGET_MODES = ['light', 'dark', 'auto'] as const;

export const DEFAULT_WIDGET_POSITION: (typeof WIDGET_POSITIONS)[number] = 'bottom_right';

// Sane ceiling so a widget's quick-reply row stays usable, not a scroll of
// buttons — no spec-named number on the backend either, just a UI limit.
export const MAX_SUGGESTED_QUESTIONS = 6;
export const MAX_SUGGESTED_QUESTION_LENGTH = 140;

/**
 * `apps.agents.constants.UnsupportedLanguageBehavior` — what the widget does
 * when a visitor writes in a language outside `Agent.enabled_languages`.
 * One of `behavior_config`'s runtime-consumed keys `ThemeValidationService
 * .validate_behavior_config` now validates (2026-09-09), previously an
 * unchecked JSON blob a caller had to know the runtime's expected shape for.
 */
export const UNSUPPORTED_LANGUAGE_BEHAVIORS = [
  'answer_in_default_language',
  'polite_decline',
  'escalate_to_human',
] as const;

// UI-only sanity ceilings — the backend enforces no upper bound on either
// (only a `>= 1` floor), these just stop obviously-broken input from ever
// reaching the server.
export const MAX_RETRIEVAL_CONTEXT_TURNS = 20;
export const MAX_HISTORY_MESSAGES_CEILING = 100;
export const MAX_MODERATION_CATEGORIES = 20;

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
