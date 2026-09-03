# Layout

## LayoutWrapper

`src/components/layout/LayoutWrapper.tsx`

A full-height sidebar rail beside a content column, modeled on the
`ai-agents-platform` prototype's shell — not the header-spans-everything layout
this replaced. The page scrolls as a whole; the sidebar and topbar are each
`sticky`, not fixed-viewport-height panels with their own internal scroll region.

```
┌────────────┬────────────────────────────────────────┐
│  Sidebar   │  HeaderOne (topbar, sticky, h-16)       │
│  (w-64,    ├────────────────────────────────────────┤
│  sticky,   │  RestrictedBreadcrumb                   │
│  h-screen  ├────────────────────────────────────────┤
│  on lg+)   │  <main> (max-w-[1400px] mx-auto, px-4…) │
│            │                                          │
└────────────┴────────────────────────────────────────┘
```

On mobile the sidebar is a `fixed` overlay drawer, toggled by the topbar's
hamburger button, closed by its own close button or the backdrop.

## Sidebar

`src/components/sidebar/Sidebar.tsx`

- `w-64`, `bg-sidebar`, `border-r`. `lg:sticky lg:top-0 lg:h-screen` on desktop so
  it stays pinned while the content column scrolls past it; a `fixed` overlay
  drawer below `lg`.
- **Header** (`h-16`, `border-b`): the brand mark — an icon tile
  (`bg-brand-accent`) plus `t.common.appName` — replacing the old header-bar
  wordmark. This is the one place the brand mark renders; `HeaderOne` no longer
  has one.
- **Nav** (`flex-1 overflow-y-auto`): sections from `NAV_ITEMS` grouped by
  `section` (Main / Workspace / Platform), each a flat list of pill rows —
  `bg-primary/10 text-primary` when active, `text-muted-foreground` otherwise. A
  row with `children` (only `Organization`, currently) expands into an indented
  sub-list instead of navigating.
- **Footer** (`border-t`): `OrganizationSwitcher`, moved here from the top of the
  nav to mirror the prototype's org-switcher-at-the-bottom placement.

Nav items defined in `src/constants/navItems.ts`; visibility gated by
`ENABLED_HREFS` (kill switch) and `requiredFunction`/`hasFunctional` (permission).
See `auth.md`'s three-layers-of-route-protection table — this file only decides
what's visible, never what's reachable.

## HeaderOne (topbar)

`src/components/header/HeaderOne.tsx`

A topbar sticky to the content column, not the whole page — it does not span
above the sidebar.

- **Left**: mobile hamburger, then the organization name (small, muted) stacked
  over the current page's title/subtitle from `getPageMeta(pathname)`
  (`src/lib/pageMeta.ts`). No wordmark here — see Sidebar above.
- **Right**: `NotificationBell` → `ProfilePopup`.

Deliberately does **not** include the prototype's search input, trial-plan pill,
or help-center button — none of those map to anything real in this app yet, and
a control wired to nothing is a defect (`AGENTS.md`), not a style match worth
making. Add them if and when they have something to do.

## ProfilePopup

`src/components/header/ProfilePopup.tsx`

- Avatar showing up to 4 initials from `full_name`, name + role stacked beside it
- Dropdown: Profile link, Sign Out (with `BroadcastChannel` logout)

## RestrictedBreadcrumb

`src/components/common/RestrictedBreadcrumb.tsx`

- A bar below the topbar: a "Back" button (`router.back()`), then
  `Segment › Segment › Current page` built from `usePathname()`'s segments
- `SEGMENT_LABELS` maps a URL slug to its display name when title-casing the
  segment would be wrong; a dynamic-segment resolver registry (see the file's own
  comments) turns a UUID into the record's name by reading the detail page's
  query cache
- Renders on every restricted route with at least one path segment, including
  `/dashboard` — there is currently no path-depth threshold that hides it

## pageMeta

`src/lib/pageMeta.ts`

Derives `{ title, subtitle }` for the topbar from `NAV_ITEMS` automatically —
title = the nav item's own label, subtitle = its child's label when the route is
a child. A route reachable only outside the sidebar (a user-menu link, a direct
link) needs a manual entry in this file's `EXTRA` map instead.
