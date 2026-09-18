/**
 * The languages an agent can be configured to answer in.
 *
 * Mirrors `apps/agents/constants.py::SUPPORTED_LANGUAGE_CODES` exactly, in the
 * same order. That constant is the source of truth and cites this file back, so
 * adding a language is a deliberate two-file edit on both sides, never a
 * migration: the codes live in a `JSONField`/`CharField` with no DB-level
 * choices constraint. Same "mirror, not re-derive" convention as the theme and
 * behavior allowlists in `agentTheme.ts`.
 *
 * ISO 639-1 codes only, no locale variants: `pt`, never `pt-BR`.
 */

/**
 * Declared as a `const` tuple rather than `string[]` for two reasons: it gives
 * `z.enum()` in `src/lib/schemas/agent.ts` the literal union it needs without a
 * cast, and it makes `LANGUAGE_NAMES` below a total map, so a code with no
 * display name (or a name with no code) fails the build instead of rendering
 * blank.
 */
export const SUPPORTED_LANGUAGE_CODES = [
  'en',
  'es',
  'fr',
  'de',
  'it',
  'pt',
  'nl',
  'sv',
  'da',
  'no',
  'fi',
  'pl',
  'cs',
  'sk',
  'hu',
  'ro',
  'bg',
  'el',
  'ru',
  'uk',
  'tr',
  'ar',
  'he',
  'fa',
  'hi',
  'bn',
  'ur',
  'id',
  'ms',
  'th',
  'vi',
  'zh',
  'ja',
  'ko',
  'tl',
  'sw',
  'af',
  'hr',
  'sr',
  'sl',
  'et',
  'lv',
  'lt',
  'ca',
  'is',
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

/**
 * English display names, deliberately not translated and not sourced from
 * `Intl.DisplayNames`. These label a configuration choice an operator makes
 * about their agent, not content shown to a visitor, and the operator console
 * is English-only today. `Intl.DisplayNames` would also render each language in
 * the *viewer's* locale, which makes a picker harder to scan, not easier, for
 * anyone configuring a language they do not personally read.
 */
const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  sv: 'Swedish',
  da: 'Danish',
  no: 'Norwegian',
  fi: 'Finnish',
  pl: 'Polish',
  cs: 'Czech',
  sk: 'Slovak',
  hu: 'Hungarian',
  ro: 'Romanian',
  bg: 'Bulgarian',
  el: 'Greek',
  ru: 'Russian',
  uk: 'Ukrainian',
  tr: 'Turkish',
  ar: 'Arabic',
  he: 'Hebrew',
  fa: 'Persian',
  hi: 'Hindi',
  bn: 'Bengali',
  ur: 'Urdu',
  id: 'Indonesian',
  ms: 'Malay',
  th: 'Thai',
  vi: 'Vietnamese',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  tl: 'Tagalog',
  sw: 'Swahili',
  af: 'Afrikaans',
  hr: 'Croatian',
  sr: 'Serbian',
  sl: 'Slovenian',
  et: 'Estonian',
  lv: 'Latvian',
  lt: 'Lithuanian',
  ca: 'Catalan',
  is: 'Icelandic',
};

/**
 * Picker options, already shaped as `SelectFieldOption` so both the languages
 * checkbox group and the default-language select consume it with no mapping at
 * the call site. The code is kept in the label because two languages can read
 * similarly in English while being different rows to tick.
 */
export const SUPPORTED_LANGUAGES: readonly { value: LanguageCode; label: string }[] =
  SUPPORTED_LANGUAGE_CODES.map((code) => ({
    value: code,
    label: `${LANGUAGE_NAMES[code]} (${code})`,
  }));

/** A language's English display name, falling back to the raw code. */
export function languageLabel(code: string): string {
  return LANGUAGE_NAMES[code as LanguageCode] ?? code;
}
