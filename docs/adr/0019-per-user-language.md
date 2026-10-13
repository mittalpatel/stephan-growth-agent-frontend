# ADR-0019: Per-user language through a read-through catalog

**Status:** Accepted. Extends [ADR-0013](0013-static-typed-locales.md), which still holds.

## Context

Client review (06 Oct 2026) asked for a French/English selector. Until then `t` was one
English object chosen at build time. It is imported by 227 files, and about 210 reads
happen outside any React component: zod schemas, `apiError`, NextAuth callbacks, page
metadata, module-level constants such as `NAV_ITEMS`. On the server, one process renders
many viewers, so a module-level "current language" would leak one viewer's language into
another's page.

## Decision

- The viewer's language lives in the `yb-lang` cookie (`LANGUAGE_COOKIE`).
- `t` is a read-through view over the typed catalogs (`src/locales/index.ts`). Every read
  resolves the active language through `getLanguage()`; nested objects come back as
  views, so `const copy = t.agents.detail` at module scope still works.
- `getLanguage()` reads `<html lang>` in the browser (the root layout writes it from the
  cookie) and, on the server, the current request's cookie through a resolver registered
  in `src/instrumentation.ts` (`src/locales/serverLanguage.ts`).
- Switching language sets the cookie and reloads the page.
- Catalogs stay static and typed. `Translations` is English's shape with values widened to
  `string`, so a missing or extra key in another language is still a compile error.

## Why not a `useT()` hook and context

It is the conventional answer, but it only works inside React. Schemas, API error
mapping, NextAuth and metadata would each need their own way to get the language, and
all 227 call sites would change. The read-through view needs no call-site change.

## Why not `/fr/...` routes

Every route and link would move under a `[lang]` segment, and the text problem above
would remain. Not worth it for a second language.

## Consequences and rules

- **Never read a string at module scope.** `const X = { label: t.a.b }` freezes `label`
  in whatever language loaded the module. Use a getter (`get label() { return t.a.b; }`),
  read inside the component, or `generateMetadata()` instead of `export const metadata`.
  Holding a nested object (`const copy = t.a`) is fine.
- Zod messages built at module scope are the known exception: they are only shown in the
  browser, which loads the module in the viewer's language.
- `serverLanguage.ts` reads Next's internal `workUnitAsyncStorage` (the store `cookies()`
  uses), because `cookies()` is async-only and catalog reads are synchronous. It is
  confined to that file and fails safe: if a Next upgrade moves it, the server renders
  the default language rather than throwing. Re-check it on every Next upgrade.
- Verified: 40 concurrent requests alternating English and French cookies, 0 rendered in
  the wrong language; no hydration mismatches across 26 pages in French.
- Text that comes from the backend (agent names, role names, sort labels from
  `?type=parameters`) is not covered. The frontend sends `Accept-Language`, so the backend
  can translate it.
