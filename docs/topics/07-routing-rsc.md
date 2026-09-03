# Routing & Server Components

**Read this when:** adding a route, or deciding whether something is a server or client
component.

## This is Next 16

Read `node_modules/next/dist/docs/` before writing routing code. Two differences bite
immediately:

- Middleware is **`src/proxy.ts`**, not `middleware.ts`.
- **`params` and `searchParams` are Promises** and must be awaited. Destructuring
  directly is the most common upgrade mistake and fails at runtime, not at build.

```tsx
export default async function Page({
  params,
}: Readonly<{ params: Promise<{ widgetId: string }> }>) {
  const { widgetId } = await params;
}
```

## Route groups

| Group          | Contains                       | Guard                                     |
| -------------- | ------------------------------ | ----------------------------------------- |
| `(public)`     | Login, forgot-password, signup | Redirects **away** if already signed in   |
| `(restricted)` | Everything authenticated       | Auth guard + provider stack in its layout |

Parentheses mean the segment does not appear in the URL — the grouping is for shared
layouts and guards, not paths.

## Server by default, client where needed

A page is a server component: metadata, awaiting params, and handing off. It becomes a
client island at the first `'use client'`, so push that boundary **down**, not up. A
`'use client'` on a layout makes everything below it client-rendered.

## Colocation

```
widgets/
  page.tsx                    Server: metadata + Suspense
  hooks/useWidgetsList.ts     'use client' — all state
  components/                 Presenters
  [widgetId]/
```

Route-specific code lives with the route. It moves to `src/components/common/` when a
second route actually needs it — not in anticipation.

## The Suspense boundary is required

Any component reading `useSearchParams` must sit inside one, or Next opts the whole
route out of static rendering and the build warns. Its fallback should be the page's
skeleton, so the boundary is also the loading state.

## proxy.ts

Runs on the edge, before the page:

- Blocks `x-middleware-subrequest` (CVE-2025-29927), which allowed middleware to be
  bypassed entirely
- Coarse `getToken` check — presence of a session, not authorization
- Security headers
- `ENABLED_PREFIXES` kill switch

**A route missing from `matcher` is not protected** — the middleware never runs for it.
Keep the array in step with the routes.

## Three layers, none of them security

| Layer                         | Decides               |
| ----------------------------- | --------------------- |
| `ENABLED_PREFIXES` (proxy)    | Is the page on at all |
| `ENABLED_HREFS` / `NAV_ITEMS` | Is the link visible   |
| `ROUTE_PERMISSIONS`           | May this user open it |

All three are UX. The backend refuses the requests independently, and it is the only
thing protecting the data.

## Metadata

From the catalog, never a literal:

```tsx
export const metadata: Metadata = { title: t.widgets.title };
```
