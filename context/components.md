# Reusable Components

Inventory of `src/components/`. Add a shared component here when you add one; a
component nobody can find gets reimplemented.

`src/components/ui/` holds shadcn primitives. They are **generated code** — excluded
from lint and coverage, added with `npx shadcn@latest add <name>`, never hand-edited
(edits are lost on regeneration). Everything below is ours.

## Typography

`Geist` and `Geist_Mono` via `next/font`, self-hosted, exposed as `--font-sans` and
`--font-mono`. One type scale, Tailwind defaults. No custom faces: a template that
ships licensed fonts ships a licensing problem.

## RHF form primitives — `src/components/common/form/`

`RHFTextField`, `RHFSelectField`, `RHFSwitchField`, plus `fieldStyles.ts`
(`fieldInputCls`, `fieldLabelCls`, `getRhfError`).

Use these inside a `<FormProvider>` rather than wiring controlled inputs per form.
When a field type is missing, add a primitive here instead of inlining a one-off —
that is how forms drift apart visually.

Centralizing the classes means a design change is one edit, not N.

## FilterToolbar

`src/components/common/FilterToolbar.tsx`

The list-page header: title, result count, view toggle, search, filters, reset, sort,
page size, and an optional trailing action.

Renders its filter controls **entirely from the backend's `?type=parameters`
payload**, so adding a filter is a backend-only change. Filter chips show what is
active and remove on click.

Props are a flat bag supplied by the list hook — see `useWidgetsList`. The toolbar
holds no data state of its own beyond the filter popover's open/closed.

## DataTable

`src/components/common/DataTable.tsx`

The single base every data table renders through, so table chrome and the row-entrance
animation live in one place. It owns the card shell, the scroll container, and the
`<table>`; `DataTableBody` wraps `MotionList as="tbody"` and `DataTableRow` wraps
`MotionListItem as="tr"` (staggered, `prefers-reduced-motion` aware).

Each table keeps control of its own `<thead>` and `<td>` cells — those vary too much
(sortable headers, action buttons, badges, responsive columns) to be worth abstracting.

`DataTableRow` takes an optional `onClick` (added for the leads list, Sprint 1
Phase 3 — the first table needing a whole-row click target to open a detail
panel); `MotionListItem` forwards it to the underlying `<tr>`. Omit it for a
table with no row-level action.

```tsx
<DataTable minWidth={720}>
  <thead>
    <tr className={dataTableHeadRow}>
      <th className={dataTableTh}>…</th>
    </tr>
  </thead>
  <DataTableBody>
    {rows.map((row) => (
      <DataTableRow key={row.id}>
        <td className={dataTableTd}>…</td>
      </DataTableRow>
    ))}
  </DataTableBody>
</DataTable>
```

Exports `dataTableTh` / `dataTableTd` / `dataTableHeadRow`. Shell overrides:
`className`, `minWidth`, `tableClassName`, `scrollClassName`.

Reference implementation: `WidgetsTable`. For a cluster of near-identical tables,
build a config-driven layer **on top of** this rather than reimplementing the chrome.

## StatusBadge

Takes an already-translated `label` and an explicit `tone`
(`neutral | success | warning | danger | info`).

The tone is **not** looked up from the status string. That map would live inside the
shared component and accumulate every domain's vocabulary, and it breaks the moment
text is translated, since `t.widgets.status.active` is not the string `'active'`. Each
module maps its own statuses — see the `Record<WidgetStatus, StatusTone>` in
`WidgetsTable`, whose exhaustive type fails the build when a status is added without a
tone.

Renders a small `currentColor` dot before the label. It is `aria-hidden` and purely
decorative, so it carries no information the label does not.

Never rely on colour alone to convey state; the label must say it too.

## PreviewBanner

`src/components/common/PreviewBanner.tsx`. Takes one already-translated `note`.
Renders a dashed-border strip with a "Preview" `Badge` — the visible marker on a
Sprint 1 static-preview page (see `context/app/(restricted)/agents/page.md` and its
siblings for `conversations`/`leads`/`analytics`/`dashboard`): real app layout, inline
mock data, no hook, no service call.

The rule that keeps it meaningful: removing `PreviewBanner` from a page is the same
change that wires that page to a real endpoint, never a separate cleanup pass — a
preview page with the banner already removed is a silent lie about what the numbers
on screen mean.

## EmptyState

`title`, optional `description`, optional `icon`, optional `action`.

The action matters: an empty state without one is a dead end. Distinguish "nothing
exists yet" (action: create one) from "your filters matched nothing" (action: clear
filters) — only the caller knows which, and the wrong one is actively misleading.

## ListPagination

First/previous/numbered/next/last plus page size, with a separate compact mobile
layout. Ellipsis for long ranges, `aria-current="page"` on the active page.

## DateRangePicker

`react-day-picker` in a popover. `date-fns` locale objects are separate from the app
catalog, so swap the `locale` constant when adding a language.

## ConfirmDialog

Used through `useConfirm()` from `ConfirmProvider`, not rendered directly. Labels
default to `t.buttons`; `destructive` switches the action button to the danger
variant.

## RestrictedBreadcrumb

Derives crumbs from the pathname. A UUID segment is resolved to a record name through
`RESOLVERS`, keyed by the parent route segment. The resolver imports its `endpoint`
and `queryKey` from the service so the breadcrumb reads the detail page's cache
instead of refetching. With no resolver registered, a UUID falls back to a shortened
id — correct, just less useful.

## Motion — `src/components/motion/`

Deliberately minimal: page and list transitions only, no decorative animation. All of
it honours `prefers-reduced-motion`.

| Component                       | Use                                                      |
| ------------------------------- | -------------------------------------------------------- |
| `PageTransition`                | Route-level fade/slide                                   |
| `MotionList` / `MotionListItem` | Staggered list entrance; `div`+`article` or `tbody`+`tr` |
| `MotionModal`                   | Dialog enter/exit                                        |
| `MotionPopover`                 | Popover enter/exit                                       |

`tokens.ts` holds the shared durations and easings. The per-item stagger is capped
(`staggerFor`) so a long list does not ripple for seconds.

## Layout — header, sidebar, shell

See [layout.md](layout.md).

## Colour rule

Every component uses semantic tokens only: `bg-background`, `text-foreground`,
`text-muted-foreground`, `border-border`, `bg-card`, `bg-primary`, `bg-muted`,
`bg-accent`, `text-destructive`, the `success`/`warning`/`info` pairs, and
`bg-brand-accent` (the gold highlight, distinct from `bg-accent`, which is the
hover/active surface).

Typography has two faces: `font-display` for headings, dialog and card titles, and
metric values, `font-sans` for everything else. `font-heading` is an alias of
`font-display`, kept because four generated `ui/` primitives reference that name.

No hex, and no raw Tailwind palette classes (`bg-white`, `text-gray-500`) — those
hardcode one theme and silently break the other. Both themes are reviewed before merge.
