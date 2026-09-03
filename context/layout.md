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
  nav to mirror the prototype's org-switcher-at-the-bottom placement, then a
  second, read-only identity card below it (avatar, `session.user.full_name`,
  `usePermissions().role`) — matching the prototype's stacked org-card-over-
  user-card footer. Display-only: `ProfilePopup` in the topbar is still the one
  control that actually signs out or links to the profile page.

There is deliberately no collapsed/icon-only rail mode. One was built, then
removed the same session on direct feedback — see `context/changelog.md`,
2026-09-03, if it's ever worth reconsidering.

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
- **Middle**: `QuickNavSearch` (`hidden md:flex`) — a real jump-to-page search,
  not a decorative input: typing a nav item's label and pressing Enter routes
  to it. Only matches destinations `ENABLED_HREFS`/`hasFunctional` would already
  show in the sidebar, so it can never send someone somewhere `PermissionGuard`
  would immediately bounce them back out of.
- **Right**: `NotificationBell` → `ProfilePopup` (avatar-only trigger; see below).

Deliberately does **not** include the prototype's trial-plan pill or help-center
button — neither maps to anything real in this app (there is no trial system),
and a control wired to nothing is a defect (`AGENTS.md`), not a style match
worth making. Add them if and when they have something to do.

## ProfilePopup

`src/components/header/ProfilePopup.tsx`

The topbar trigger is avatar-only (a bare circle with initials) — no inline
name/role/chevron. `Sidebar`'s footer card (above) already shows name and role
at full size, so repeating them here was pure duplication and read as wider and
busier than the prototype's own single-avatar topbar corner. The dropdown
content (name, email, profile link, sign out) is unchanged.

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
