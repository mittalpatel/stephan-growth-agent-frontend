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
- **Header** (`h-16`, `border-b`): the brand mark (`BrandMark`) plus the organization's
  white-label `display_name`, from `useOrgBranding`. With neither a custom logo nor a
  custom name (`isPlatformBrand`), it shows the YB Inspire wordmark (`PlatformLogo`,
  light or dark artwork by theme, from `public/brand/`) instead. This is the
  one place the brand mark renders in the shell; `HeaderOne` has none.
  `useOrgBranding` (`src/app/(restricted)/hooks/useOrgBranding.ts`) reads
  `GET /settings/brand/summary/`, open to any member (display name, logo, favicon,
  both colors and the backend-computed readable `on_color_primary`); the Brand tab
  invalidates that key on save. With no logo, the tile takes the organization's
  primary color and readable text color (`orgAccentStyle`, an inline override of the
  `--brand-accent` token pair on that one element, the same sanctioned exception as
  `RHFColorField`, since the value is tenant data). A logo that fails to load falls
  back to the tile. The restricted layout's `generateMetadata` (server-only
  `getOrgBrandSummary`) sets both the tab title, overriding the root
  `%s | YB Inspire` template, and `icons`, so the organization's favicon is in the
  first HTML. The platform icon is declared as root `metadata.icons` pointing at
  `public/favicon.ico` (`PLATFORM_FAVICON_HREF`), NOT through Next's favicon file
  convention in the app root: that convention emits on every route and cannot be
  overridden per segment, so it left two icon links and Chrome kept the `.ico`. `LayoutWrapper`'s effect keeps the
  tab in step live, once `isBrandLoaded` is true so a slow read cannot flash the wrong
  icon: it detaches every other icon link and appends one, falling back to
  `PLATFORM_FAVICON_HREF` when the favicon is cleared — restoring the displaced link
  is wrong there, since that link is the server-rendered organization icon that just
  stopped being correct.
  Beyond the mark, org colors are NOT applied anywhere else in the dashboard.
- **Signed-out pages** (`/`, `/login`, forgot-password, signup): branded by hostname,
  but **inert unless `CUSTOM_DOMAINS_ENABLED` is on**, which it is not by default.
  `getPublicBranding()` returns `null` immediately when the flag is off, so these pages
  stay platform-branded with no backend call on first paint. The rest of this paragraph
  describes what happens once the flag is turned on.
  `getPublicBranding()` (server-only, `cache()`d per request) sends the request Host
  to the unauthenticated `GET /public/branding/?host=` (outside `/api/v1/`), which
  answers only for a domain that passed DNS verification; anything else, including
  the platform's own host, is `null` and the pages stay platform-branded. The
  `(public)` layout passes it to `PublicBrandingProvider` (read by `AuthHeroShell`)
  and `/` hands it to `LandingPage` as a prop; both resolve it through
  `resolvePublicBranding`. Name, logo, copyright line, favicon and tab title change;
  the auth hero panel takes the org color via `orgSurfaceStyle`, which also inverts
  the accent pair so marks on it stay visible. `BrandMark` is the shared tile;
  `PlatformLogo` replaces tile and name when `isPlatformBrand` (always the dark
  artwork on the auth hero panel).
- **Nav** (`flex-1 overflow-y-auto`): sections from `NAV_ITEMS` grouped by
  `section` (Main / Workspace / Platform), each a flat list of pill rows —
  `bg-primary/10 text-primary` when active, `text-muted-foreground` otherwise. A
  row with `children` (only `Organization`, currently) expands into an indented
  sub-list instead of navigating.
- **Footer** (`border-t`): a plain `Link` to `/guide` (the public setup guide,
  see `context/app/guide/page.md`) above the organization card, not a
  `NAV_ITEMS` entry — it's a public page outside `(restricted)` with no
  permission gate and no pathname-active state to track, so it doesn't belong
  in the permission-filtered nav list. Below it, a plain `Link` to
  `/organization` showing the org name (no dropdown — one user is only ever in
  one organization, so there is nothing to switch between;
  `OrganizationSwitcher.tsx` was deleted, not hidden), then a second,
  read-only identity card below it (avatar, `session.user.full_name`,
  `usePermissions().role`) — matching the prototype's stacked
  org-box-over-user-card footer. Display-only: `ProfilePopup` in the topbar is
  still the one control that actually signs out or links to the profile page.
  An org-less user's path to `/organization/new` is unaffected — `/no-role`
  carries that link independently of this footer.

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
  - The help icon's `mailto:` address is `hello@growth-agents.com`, the contact
    address growth-agents.com lists. Confirm it is the inbox support should use.
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

## KnowledgeProcessingBar

`src/app/(restricted)/components/KnowledgeProcessingBar.tsx`, rendered by
`LayoutWrapper` directly under the breadcrumb on every restricted page. Shows
a one-line "Reading <source>…" status while any knowledge source is `pending`
or `processing`, and renders nothing otherwise. Driven by
`useKnowledgeProcessing` (`app/(restricted)/hooks/`), which shares the
org-wide sources query key with `useAllKnowledgeSources`, polls every 10s
only while something is in progress, and toasts each source as it becomes
`ready` or `failed`. Added 2026-10-07 because users could close the
add-website dialog with no sign the crawl was still running.

Reworked 2026-10-13: each source (up to three, then "N more") shows the step it
is on (website: finding pages, choose pages, reading pages, ready; PDF: waiting,
reading, ready), with a ticking elapsed time from the oldest running source
(`useElapsedSeconds`), the usual duration, and "View progress" to the first
agent's Knowledge tab (`useAgentOptions`). There is no percentage bar: the API
reports a status, not progress.

Since 2026-10-13 the stage and counts come from the backend's `progress` on each list
row (no more frontend guessing from `discovered-urls`). "Choose pages" appears only for a
website waiting on the user, with a "Choose them now" link to its pages; such a source
does not drive the spinner or the clock, and when it is the only one in progress the bar
reads "Your pages are ready to choose" with no spinner. A fill bar shows only while
reading, the one stage with a real total. The clock counts from `updated_at`, so a
source chosen late counts from the choice.
