/**
 * The single switch for the app's language and locale-dependent formatting.
 *
 * Everything reads from here — `<html lang>`, the `Accept-Language` header on
 * both axios clients, and every `Intl.*` formatter. Changing this one constant
 * changes the whole app, which is what makes adding a locale a content-only job.
 */
import type { Language } from '@/locales';

/** The active UI language. */
export const DEFAULT_LANGUAGE: Language = 'en';

/**
 * BCP-47 tag passed to `Intl.*`.
 *
 * Deliberately separate from `DEFAULT_LANGUAGE`: language and region are not the
 * same choice. English UI with European date and number formatting is a normal
 * requirement, and conflating the two makes it unexpressible.
 */
export const LOCALE_TAG = 'en-US';

/** Time zone for date rendering. `undefined` uses the viewer's own. */
export const TIME_ZONE: string | undefined = undefined;

/** ISO 4217 code for `formatCurrency`. */
export const CURRENCY = 'USD';
