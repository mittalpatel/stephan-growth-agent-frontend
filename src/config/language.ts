/**
 * The app's languages and locale-dependent formatting.
 *
 * Everything reads from here: `<html lang>`, the `Accept-Language` header on
 * both axios clients, and every `Intl.*` formatter. The active language is
 * per user (the `LANGUAGE_COOKIE`), resolved by `getLanguage()` in
 * `src/locales/activeLanguage.ts`; see ADR-0019.
 */

/** Every language the app can render. Grows by one entry per catalog. */
export const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

/** Used when no cookie is set, or it names a language we do not ship. */
export const DEFAULT_LANGUAGE: Language = 'en';

/** Cookie holding the viewer's chosen language. Read on the server per request. */
export const LANGUAGE_COOKIE = 'yb-lang';

/**
 * BCP-47 tag passed to `Intl.*`, per language.
 *
 * Deliberately separate from the language code: language and region are not
 * the same choice, and conflating them makes "English UI with European dates"
 * unexpressible.
 */
export const LOCALE_TAGS: Record<Language, string> = { en: 'en-US', fr: 'fr-FR' };

/** Shown in the language selector, in each language's own name. */
export const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', fr: 'Français' };

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/** Time zone for date rendering. `undefined` uses the viewer's own. */
export const TIME_ZONE: string | undefined = undefined;

/** ISO 4217 code for `formatCurrency`. */
export const CURRENCY = 'USD';
