# Locales

English and French, statically typed, chosen per viewer (ADR-0019). **No string a
user can read may originate outside `src/locales/`**, enforced as an ESLint error.
English (`src/locales/en`) is the source of truth; `fr` must match its keys.

## Structure

One namespace per file, assembled in `en/index.ts`.

```
src/locales/
  en/
    common.ts       # common, buttons, pagination, navigation, dateRangePicker
    auth.ts         # sign-in, password reset, signup
    errors.ts       # 404, generic failures, the no-role screen
    header.ts
    legal.ts
    preferences.ts
    userProfile.ts
    dashboard.ts
    widgets.ts      # demo module — removed by `npm run strip-demo`
    index.ts        # assembles the `en` object
  fr/               # same files, translated (machine draft 2026-10-13, needs review)
  index.ts          # exports `t` (read-through view), `Language`, `Translations`
  activeLanguage.ts # getLanguage(), getLocaleTag(), server resolver registry
  serverLanguage.ts # reads the request's `yb-lang` cookie on the server
src/instrumentation.ts   # registers the server resolver at startup
src/config/language.ts   # SUPPORTED_LANGUAGES, LANGUAGE_COOKIE, LOCALE_TAGS, LANGUAGE_NAMES
src/hooks/useLanguage.ts # current language, options, setLanguage (cookie + reload)
src/lib/i18n.ts          # format, plural, and the Intl formatters (active locale)
src/lib/i18n.ts          # format, plural, and the Intl formatters
```

Namespaces are feature-shaped, not component-shaped: two components rendering "Save"
share `buttons.save` rather than each owning a copy that drifts.

`as const` on every namespace is load-bearing. Without it every value widens to
`string`, the derived `Translations` type stops distinguishing keys, and a second
locale could satisfy the type while missing half the catalog.

## Usage

```ts
import { t } from '@/locales';
import { format, plural, formatDate, formatCurrency } from '@/lib/i18n';

t.common.loading;
format(t.common.showingOf, { displayed: 20, total: 137 });
plural(count, t.widgets.list.resultCount);
```

## Never build a string by hand

| Instead of                   | Use                                     |
| ---------------------------- | --------------------------------------- |
| `` `${n} widgets` ``         | `plural(n, t.widgets.list.resultCount)` |
| `` `Showing ${a} of ${b}` `` | `format(t.common.showingOf, { … })`     |
| `date.toLocaleDateString()`  | `formatDate(value)`                     |
| `` `$${cents / 100}` ``      | `formatCurrency(cents)`                 |

A template literal is untranslatable, and `+ 's'` is already wrong at `n === 1`.
`formatCurrency` takes **minor units** (cents) because binary floats cannot represent
most decimal amounts exactly, and money off by a cent is a bug someone must reconcile.

## What the lint rule covers

`no-restricted-syntax` in `eslint.config.mjs`, at **error** severity: JSX text,
`placeholder`, `title`, `alt`, `aria-label`, `aria-placeholder`, and `toast.*()`
arguments. It also rejects em-dashes in visible copy.

Restricting JSX text alone is the common half-measure — it catches `<p>Save</p>` and
misses `aria-label="Close"`, which is how the accessible copy ends up as the only
untranslated copy in the app.

Tests and e2e specs are exempt: their literals are fixtures, and a spec asserting only
on `t.*` could not catch a key pointing at the wrong string, since both sides would
move together.

## How the language is chosen (ADR-0019)

The `yb-lang` cookie holds the viewer's choice. The root layout writes it to
`<html lang>`; in the browser `t` reads that, on the server it reads the request's
cookie. `LanguageSelect` (sign-in/sign-up pages) and the profile menu's Language
submenu set the cookie and reload. Both hide themselves while only one language ships.

**Never read a string at module scope.** `const X = { label: t.a.b }` freezes `label`
in one language for every viewer. Use a getter, read inside the component, or
`generateMetadata()` instead of `export const metadata`. Holding a nested object
(`const copy = t.a.b`) is fine: it stays a live view.

## Adding a key

Add it to the namespace file under `src/locales/en/` and the same key under
`src/locales/fr/`. `tsc` fails until both have it.

## Adding a language

A content-only change. No component, hook, or route is touched:

1. `cp -r src/locales/en src/locales/es`
2. Translate the values, leaving every key exactly as it is.
3. Add `'es'` to `SUPPORTED_LANGUAGES`, `LOCALE_TAGS` and `LANGUAGE_NAMES` in
   `src/config/language.ts`, and to the `translations` map in `src/locales/index.ts`.
4. `npx tsc --noEmit`.

`Translations` is English's shape with values widened to `string`, so a missing, misspelled, or extra key is a **compile
error** — not a blank string discovered in production. That compile-time completeness
is the whole reason this is a typed object literal rather than JSON files or a runtime
lookup. See `docs/adr/0013-static-typed-locales.md`.

The active language also drives every `Intl` formatter (`getLocaleTag()`), the
`Accept-Language` header on both axios clients and NextAuth's backend calls, and
`<html lang>`. Text the backend sends (agent and role names, list sort labels) is
the backend's to translate from that header.
