# ADR-0013: Static typed catalogs, not runtime or DB-served translations

**Status:** Accepted

## Decision

`src/locales/en/` is a set of `as const` TypeScript objects. `Translations` is derived
as `typeof en`, and any additional locale must satisfy that type.

## Why not JSON files or a runtime lookup

**Compile-time completeness is worth more than editability at English-only.** With
`Translations = typeof en`, a second locale that misses a key, misspells one, or adds an
extra fails `tsc`. With JSON, the same mistake ships and surfaces as a blank string —
usually on a screen nobody on the team looks at, in a language nobody on the team reads.

`t.widgets.list.emptyTitle` also autocompletes and rename-refactors, which a string-keyed
`t('widgets.list.emptyTitle')` does not.

## Why not a DB-backed translation service

The argument for one is letting non-developers edit copy without a deploy. That is a
real benefit, and it is not yet worth its cost here: a service, a cache, a fallback path
for when it is unavailable, and the loss of every guarantee above.

Nothing about this decision blocks it later. The swap happens behind the same `t`
interface — `t` becomes a proxy over fetched data, and no call site changes. Revisit
when someone outside the team actually needs to edit copy.

## `as const` is load-bearing

Without it every value widens to `string`, `Translations` stops distinguishing keys, and
a locale missing half the catalog satisfies the type. The guarantee this ADR is about
disappears silently.

## Adding a language

`cp -r src/locales/en src/locales/es` → translate the values → add `'es'` to the
`Language` union and the `translations` map → `tsc`. No component, hook, or route
changes. That property is the acceptance criterion for this decision, and the reason
`format()`, `plural()`, and the `Intl` helpers exist rather than template literals.
