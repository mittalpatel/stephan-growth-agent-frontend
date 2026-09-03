/**
 * The translation catalog.
 *
 * Static, typed, and English-only today. Nothing in the app renders a string
 * that does not come from here — see `AGENTS.md` and the `no-restricted-syntax`
 * rule in `eslint.config.mjs`, which fails the build on literal JSX text.
 *
 * ## Adding a second language
 *
 * It is a content-only change. No component, hook, or route is touched:
 *
 *   1. `cp -r src/locales/en src/locales/es`
 *   2. Translate the values (leave every key exactly as it is).
 *   3. Add `'es'` to `Language` and to the `translations` map below.
 *   4. `npx tsc --noEmit` — the `Translations` type is derived from English, so
 *      a missing, misspelled, or extra key is a compile error, not a blank
 *      string discovered in production.
 *
 * That last point is the whole reason this is a typed object literal rather
 * than JSON files or a runtime lookup: at English-only, compile-time
 * completeness is worth more than the editability a DB-backed system would buy.
 * See `docs/adr/0013-static-typed-locales.md`.
 */
import { DEFAULT_LANGUAGE } from '@/config/language';

import { en } from './en';

/** Every locale the app ships. Grows by one entry per language added. */
export type Language = 'en';

/**
 * The shape every locale must satisfy, derived from English.
 *
 * A new locale is declared `const es: Translations = { ... }`, which makes the
 * compiler enforce parity. The old approach — a runtime test comparing flattened
 * key lists — only caught the mismatch after someone remembered to run it.
 */
export type Translations = typeof en;

export const translations: Record<Language, Translations> = { en };

export const currentLocale: Language = DEFAULT_LANGUAGE;

/** The active catalog. Import this: `import { t } from '@/locales'`. */
export const t: Translations = translations[DEFAULT_LANGUAGE];
