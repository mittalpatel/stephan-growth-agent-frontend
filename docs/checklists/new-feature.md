# New Feature Checklist

In order. Copy `src/app/(restricted)/projects/` as the starting point.

## 1. Contract first

- [ ] Read the backend serializer. DTO field names in `src/types/` match it **exactly** —
      `snake_case`, no rename layer
- [ ] Confirm the permission codes exist in the backend's registry

## 2. Service module

- [ ] `src/services/<feature>.ts` — endpoints, query keys, param building
- [ ] **Export the detail query-key builder** if a breadcrumb or anything else will read
      that cache entry
- [ ] Params built from `LIST_PARAM`, never literal strings
- [ ] Empty values omitted, not sent blank

## 3. Locale namespace

- [ ] `src/locales/en/<feature>.ts`, `as const`, exported from `en/index.ts`
- [ ] Sub-objects by concern: list / columns / detail / form / validation / actions /
      toast
- [ ] Plural forms as objects, not `+ 's'`

## 4. Hook

- [ ] `use<Feature>List.ts` owns **all** state and returns a flat props bag
- [ ] `useQueryParams('<namespace>')` — URL is the source of truth
- [ ] Query key mirrors the request params
- [ ] `placeholderData` so paging does not flash empty

## 5. Components

- [ ] Pure presenters. No `useQuery`, no request bodies, no error mapping
- [ ] All four states: loading skeleton **shaped like the result**, error with retry,
      empty (both variants), populated
- [ ] Semantic tokens only — no hex, no `bg-white`, no `text-gray-*`
- [ ] Every string from the catalog, including `aria-label` and `placeholder`
- [ ] Status tone mapped in the module as an exhaustive `Record`

## 6. Route

- [ ] `page.tsx` is a server component: metadata from the catalog, `Suspense` boundary
- [ ] `params` awaited on any dynamic route
- [ ] Registered in `ROUTE_PERMISSIONS`, `NAV_ITEMS`, `ENABLED_HREFS`, and the proxy's
      `ENABLED_PREFIXES` **and** `matcher`

## 7. Forms, if any

- [ ] Zod schema in `src/lib/schemas/`, field names matching the serializer
- [ ] `.trim()` in the schema, not on submit
- [ ] Built from `src/components/common/form/` inside a `FormProvider`
- [ ] `applyApiError` wired with `setError` and `fields`

## 8. Tests

- [ ] Service tests for param building
- [ ] Component tests querying by **role**, asserting translated output
- [ ] E2E: search/filter/sort round-trip through the URL, detail navigation, and the
      read-only role seeing no write affordances

## 9. Finish

- [ ] `npm run validate` green
- [ ] `context/app/**/page.md` written at the mirrored path
- [ ] `context/changelog.md` entry added
- [ ] Reviewed at 375px and 1440px, in **both** themes
