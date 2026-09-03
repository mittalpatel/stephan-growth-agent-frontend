# Locales

English only, statically typed. **No string a user can read may originate outside
`src/locales/en`** — enforced as an ESLint error, not a convention.

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
  index.ts          # exports `t`, `Language`, `Translations`
src/config/language.ts   # DEFAULT_LANGUAGE, LOCALE_TAG, TIME_ZONE, CURRENCY
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

## Adding a key

Add it to the namespace file under `src/locales/en/`. That is the whole procedure —
there is one language, so there is no parity step.

## Adding a language

A content-only change. No component, hook, or route is touched:

1. `cp -r src/locales/en src/locales/es`
2. Translate the values, leaving every key exactly as it is.
3. Add `'es'` to the `Language` union and to the `translations` map in
   `src/locales/index.ts`.
4. `npx tsc --noEmit`.

`Translations` is `typeof en`, so a missing, misspelled, or extra key is a **compile
error** — not a blank string discovered in production. That compile-time completeness
is the whole reason this is a typed object literal rather than JSON files or a runtime
lookup. See `docs/adr/0013-static-typed-locales.md`.

To switch the active language, change `DEFAULT_LANGUAGE` in `src/config/language.ts`.
It also seeds `LOCALE_TAG` (used by every `Intl` formatter), the `Accept-Language`
header on both axios clients, and `<html lang>`.
