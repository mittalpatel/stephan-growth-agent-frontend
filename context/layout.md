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
- **Footer** (`border-t`): a plain `Link` to `/organization` showing the org
  name (no dropdown — one user is only ever in one organization, so there is
  nothing to switch between; `OrganizationSwitcher.tsx` was deleted, not
  hidden), then a second, read-only identity card below it (avatar,
  `session.user.full_name`, `usePermissions().role`) — matching the prototype's
  stacked org-box-over-user-card footer. Display-only: `ProfilePopup` in the
  topbar is still the one control that actually signs out or links to the
  profile page. An org-less user's path to `/organization/new` is unaffected —
  `/no-role` carries that link independently of this footer.

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
- **Right**: a trial-status pill → a help icon → `NotificationBell` → a
  persistent "Explore agents" button → `ProfilePopup` (avatar-only trigger;
  see below) — the full right-hand cluster the prototype's topbar has, added
  after a direct reference screenshot asked for it explicitly. Two of these
  are placeholders, not real state, and both are called out in-code:
  - The trial pill's day count (`TRIAL_DAYS_REMAINING` in `HeaderOne.tsx`) is a
    fixed number — there is no trial system in this app yet. Same category of
    stand-in as `DashboardView`'s mock metrics.
  - The help icon's `mailto:` address (`support@ybinspire.com`) is unverified.
    Replace it with the real support inbox before this ships.
  - The "Explore agents" button is real (`/agents`) and renders on every page,
    not only the dashboard.

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
