# Layout

## LayoutWrapper

`src/components/layout/LayoutWrapper.tsx`

```
┌─────────────────────────────────────────────────────┐
│  HeaderOne (h-14, full width, bg #0d1117)           │
├──────────────┬──────────────────────────────────────┤
│              │  RestrictedBreadcrumb (white bar)    │
│  Sidebar     ├──────────────────────────────────────┤
│  (w-56)      │  <main> (bg #F3F4F6, p-6, scrollable)│
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

## HeaderOne

`src/components/header/HeaderOne.tsx`

- Background: `#0d1117`
- Height: `h-14`
- **Left** (`w-44`): the app wordmark from `t.common.appName`, links to `DEFAULT_LANDING`. A template that ships a placeholder logo gets a placeholder logo in production — swap this for your own `<Image>` when you brand the app
- **Center** (`flex-1`): Page title in `text-brand-gold` + subtitle in `text-neutral-400`, sourced from `getPageMeta(pathname)` in `src/lib/pageMeta.ts`
- **Right** (`w-44`): `NotificationPopup` → vertical separator (`bg-white/20`) → `ProfilePopup`

## Sidebar

`src/components/sidebar/Sidebar.tsx`

- Background: `#0d1117`, width `w-56`
- Section labels: `#4B5563`, tiny uppercase
- Item text default: `#8892A4`
- Hover / active background: `#1c2333`
- Active text: white
- Groups auto-expand when any child is the active route
- Child items indented with `pl-10`

Nav items defined in `src/constants/navItems.ts`. Two sections: **MAIN** and **WORKSPACE**.

## ProfilePopup

`src/components/header/ProfilePopup.tsx`

- Square `#374151` avatar showing up to 4 initials from `full_name` (e.g. "S2X5")
- Name in white 13px + role in `#8892A4` stacked beside avatar
- Dropdown: Profile link, Sign Out (with BroadcastChannel logout)

## RestrictedBreadcrumb

`src/components/common/RestrictedBreadcrumb.tsx`

- Renders a white bar below the header: `← Atrás  >  Segment  >  Current Page`
- Auto-generates crumb items from `usePathname()` segments
- Uses `SEGMENT_LABELS` map to translate URL slugs to display names
- Hidden on root-level paths (only 1 segment)
- "← Atrás" calls `router.back()`

## pageMeta

`src/lib/pageMeta.ts`

Maps pathnames to `{ title, subtitle }` displayed in the header center.
Add new entries here when adding new pages.
