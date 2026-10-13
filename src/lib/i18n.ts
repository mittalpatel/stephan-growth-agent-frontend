/**
 * Interpolation, pluralization, and locale-aware formatting.
 *
 * Every user-visible string comes from `src/locales`, but a catalog of static
 * strings is not enough on its own: counts need pluralizing, values need
 * substituting, and dates and numbers need formatting in the reader's
 * conventions. Doing any of those by hand at a call site is how a codebase ends
 * up with `` `Showing ${n} items` `` — untranslatable, and wrong in every
 * language where the plural rule is not "add an s".
 *
 * All formatting follows the active language (`getLocaleTag()`), so it
 * switches with the viewer's language like the catalog does.
 */
import { CURRENCY, TIME_ZONE } from '@/config/language';
import { getLocaleTag } from '@/locales/activeLanguage';

/**
 * Substitute `{placeholder}` tokens.
 *
 *   format(t.common.showingOf, { displayed: 20, total: 137 })
 *   // "Showing 20 of 137 items"
 *
 * Numbers are run through `formatNumber` so a thousands separator appears
 * without every call site remembering to ask — the reason a raw template
 * literal is not good enough even for English.
 *
 * An unmatched placeholder is left verbatim rather than replaced with
 * `undefined`: a visible `{total}` in the UI is an obvious bug report, while
 * "Showing 20 of undefined items" reads like a data problem and gets
 * misdiagnosed.
 */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    if (value === undefined) return match;
    return typeof value === 'number' ? formatNumber(value) : value;
  });
}

/**
 * Pick the right plural form for `count`.
 *
 *   plural(n, t.widgets.count)  // { one: '{count} widget', other: '{count} widgets' }
 *
 * Uses `Intl.PluralRules`, not `count === 1`, because the correct set of forms
 * is a property of the language: English has two, Polish four, Arabic six.
 * English needs only `one` and `other` today — but writing this now means
 * adding a language later stays a content change, which is the whole point of
 * the i18n design. Forms absent from a catalog fall back to `other`.
 */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

export function plural(
  count: number,
  forms: PluralForms,
  values: Record<string, string | number> = {}
): string {
  const rule = new Intl.PluralRules(getLocaleTag()).select(count);
  const template = forms[rule] ?? forms.other;
  return format(template, { count, ...values });
}

// `Intl.*` constructors are expensive enough that building one per render shows
// up in a long table. They are immutable, so caching is safe.
const numberFormatters = new Map<string, Intl.NumberFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function numberFormatter(options: Intl.NumberFormatOptions = {}): Intl.NumberFormat {
  const locale = getLocaleTag();
  const key = `${locale}:${JSON.stringify(options)}`;
  let formatter = numberFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatters.set(key, formatter);
  }
  return formatter;
}

function dateFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const locale = getLocaleTag();
  const key = `${locale}:${JSON.stringify(options)}`;
  let formatter = dateFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { timeZone: TIME_ZONE, ...options });
    dateFormatters.set(key, formatter);
  }
  return formatter;
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return numberFormatter(options).format(value);
}

const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB'] as const;

/**
 * A byte count as something a person can read at a glance.
 *
 * The unit suffixes are deliberately not translated: KB/MB/GB are the same
 * symbols across the locales this app targets, and `Intl` has no unit for
 * binary-prefixed bytes to defer to. The *number* still goes through
 * `formatNumber`, so its decimal separator follows the locale.
 */
export function formatFileSize(bytes: number): string {
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < FILE_SIZE_UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  // One decimal below 10 (so "1.4 MB" keeps its precision), none above it
  // (where "847 KB" reads better than "847.3 KB").
  const maximumFractionDigits = unitIndex === 0 || value >= 10 ? 0 : 1;
  return `${formatNumber(value, { maximumFractionDigits })} ${FILE_SIZE_UNITS[unitIndex]}`;
}

/**
 * Format money.
 *
 * Takes a **minor-unit integer** (cents), not a float, because binary floats
 * cannot represent most decimal amounts exactly and money that is off by a cent
 * is a bug someone eventually has to reconcile. Backends here send integers for
 * the same reason.
 */
export function formatCurrency(minorUnits: number, currency: string = CURRENCY): string {
  return numberFormatter({ style: 'currency', currency }).format(minorUnits / 100);
}

/**
 * Parse a value from the API into a `Date`.
 *
 * Returns `null` for anything unparseable so callers render a placeholder
 * instead of the string "Invalid Date", which is what `Intl` produces and what
 * users then screenshot.
 */
function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const DATE_STYLE: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };
const DATE_TIME_STYLE: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };

export function formatDate(
  value: string | number | Date | null | undefined,
  fallback = '—'
): string {
  const date = toDate(value);
  return date ? dateFormatter(DATE_STYLE).format(date) : fallback;
}

const TIME_STYLE: Intl.DateTimeFormatOptions = { timeStyle: 'short' };

/** Time of day only ("5:42 PM"), for a chat message whose day is shown elsewhere. */
export function formatTime(
  value: string | number | Date | null | undefined,
  fallback = '—'
): string {
  const date = toDate(value);
  return date ? dateFormatter(TIME_STYLE).format(date) : fallback;
}

export function formatDateTime(
  value: string | number | Date | null | undefined,
  fallback = '—'
): string {
  const date = toDate(value);
  return date ? dateFormatter(DATE_TIME_STYLE).format(date) : fallback;
}

/**
 * An elapsed span as "45s" / "2m 14s" / "1h 03m", for a run in progress.
 *
 * Distinct from `formatRelativeTime`, which answers "when did this happen"
 * against the clock ("2 minutes ago"). This answers "how long has it been
 * going", where a ticking, unrounded value is the point: a crawl that can run
 * for ten minutes reads as stuck if its only feedback is a spinner, and
 * `Intl.RelativeTimeFormat` collapses to a flat "2 minutes ago" that stops
 * visibly moving.
 *
 * `Intl.NumberFormat` supplies the digits so the numerals localize; the unit
 * letters are ASCII and deliberately not translated here, matching how the
 * rest of this file leaves `Intl` to own grammar rather than hand-rolling it.
 */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const pad = (value: number) =>
    formatNumber(value, { minimumIntegerDigits: 2, useGrouping: false });

  if (seconds < 60) return `${formatNumber(seconds)}s`;
  if (seconds < 3600) return `${formatNumber(Math.floor(seconds / 60))}m ${pad(seconds % 60)}s`;
  return `${formatNumber(Math.floor(seconds / 3600))}h ${pad(Math.floor((seconds % 3600) / 60))}m`;
}

/**
 * "3 days ago" / "in 2 hours".
 *
 * `Intl.RelativeTimeFormat` handles the grammar; the only work here is choosing
 * the largest unit that still yields a number above one.
 */
const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1],
];

export function formatRelativeTime(
  value: string | number | Date | null | undefined,
  fallback = '—'
): string {
  const date = toDate(value);
  if (!date) return fallback;

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(getLocaleTag(), { numeric: 'auto' });

  for (const [unit, secondsPerUnit] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= secondsPerUnit || unit === 'second') {
      return formatter.format(Math.round(seconds / secondsPerUnit), unit);
    }
  }
  return fallback;
}
