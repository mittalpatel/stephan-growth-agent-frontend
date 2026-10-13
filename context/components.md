# Reusable Components

Inventory of `src/components/`. Add a shared component here when you add one; a
component nobody can find gets reimplemented.

`src/components/ui/` holds shadcn primitives. They are **generated code** — excluded
from lint and coverage, added with `npx shadcn@latest add <name>`, never hand-edited
(edits are lost on regeneration). Everything below is ours.

## Typography

The YB Inspire brand's three families, all self-hosted via `next/font`: Work Sans as
`--font-sans` (body, all UI text), Poppins as `--font-display`/`--font-heading`
(headings, metric values), JetBrains Mono as `--font-mono` (reserved for numerics). This
part of the brand adoption is unaffected by [ADR-0018](../docs/adr/0018-yb-inspire-accent-only.md):
that ADR scaled the _colour_ palette back to accents-only after client review, but
typography wasn't part of that feedback. One type scale, Tailwind defaults otherwise.

## RHF form primitives — `src/components/common/form/`

`RHFTextField`, `RHFTextareaField`, `RHFSelectField`, `RHFSwitchField`, `RHFColorField`,
`RHFStringListField`, `RHFObjectListField`, `RHFCheckboxGroupField`,
`RHFSearchableCheckboxGroupField`, plus `fieldStyles.ts` (`fieldInputCls`,
`fieldLabelCls`, `fieldDescriptionCls`, `getRhfError`).

Use these inside a `<FormProvider>` rather than wiring controlled inputs per form.
When a field type is missing, add a primitive here instead of inlining a one-off —
that is how forms drift apart visually.

Centralizing the classes means a design change is one edit, not N.

Every scalar/select/list primitive takes an optional `description` prop — one line
rendered under the label (`fieldDescriptionCls`), above the input, explaining what
the field actually changes. Distinct from the error message, which renders below the
input. Added for the agent theme/behavior config form (`AgentDraftTab.tsx`), where
most fields' effect isn't obvious from the label alone; use it on any new field where
the same is true, not reflexively on every field.

### The list/group fields

Added 2026-09-14 for the agent qualification rule editor, plus one from
2026-09-18. They differ in what the bound field actually holds, which is the thing
to check before reaching for one:

| Field                             | Value shape                                      | Use for                         |
| --------------------------------- | ------------------------------------------------ | ------------------------------- |
| `RHFStringListField`              | `{ value: string }[]`                            | A repeatable free-text list     |
| `RHFObjectListField`              | the rows' real shape, e.g. `{ field, weight }[]` | A repeatable record             |
| `RHFCheckboxGroupField`           | `string[]`                                       | Any subset of a small fixed set |
| `RHFSearchableCheckboxGroupField` | `string[]`                                       | Any subset of a **large** set   |

`RHFStringListField`'s `{ value }` wrapper is an artifact of `useFieldArray` needing
each row to be an object, and callers convert at the read/submit boundary
(`toRows`/`fromRows` in `useAgentDraftForm`). `RHFObjectListField` needs no such
conversion, because its rows already are objects.

`RHFObjectListField` takes `columns` of `{ key, label, type: 'select' | 'number' }`
and renders per-cell errors under the offending cell, with list-level errors (too
many rows, a duplicate across rows) once at the bottom. The column set is deliberately
two types wide rather than a general table-editor abstraction: extend the union when a
real third case appears, rather than guessing at one now.

`RHFCheckboxGroupField` goes through `Controller`, not `register` — the value is an
array assembled from several inputs, and Radix's checkbox is not a native input to
bind to. Reach for `RHFSelectField` when exactly one value is allowed.

`RHFSearchableCheckboxGroupField` (2026-09-18, added for the agent Languages
picker and its 45 options) is the same binding with the three affordances a long
list needs: a filter input, select-all/deselect-all, and a `max-h-64` scroll area.
The split point is roughly a dozen options — below that, showing every row at once
is the entire value of a checkbox group, so use the plain one. Select-all and
deselect-all act on the **filtered** subset only: with a search box on screen, a
control that silently reaches past what is visible is a footgun. Its copy arrives
through a `copy` prop rather than a locale namespace, so the primitive stays
feature-agnostic the way `RHFSelectField`'s `placeholder` does. The pattern was
proven first, un-extracted, in `KnowledgeTargetsPanel`, which keeps its own local
copy because it is not RHF-bound.

## NativeSelect

`src/components/common/NativeSelect.tsx`

A native `<select>` wearing the shadcn `Select` trigger's chrome: same border,
radius, focus ring and a chevron. Used by `FilterToolbar` (page size, sort),
`ListPagination` (page size), `RHFSelectField` and `RHFObjectListField`, which is
every select in the app that is not the Radix one.

Deliberately still native rather than Radix: it keeps RHF's `register()` ref
spreading straight through, keeps native keyboard behaviour, and keeps the platform
picker on mobile, which beats a custom listbox on a phone. Only the chrome changed,
so the controls that adopted it behave exactly as they did before.

The chevron is a real element, not a background image, because a data-URI SVG cannot
follow `currentColor` and this has to read in both themes. Pass `containerClassName`
for the wrapper (e.g. `w-full` in a form) and `className` for the select itself.

## FilterToolbar

`src/components/common/FilterToolbar.tsx`

The list-page header: optional title, result count, view toggle, search, filters,
reset, sort, page size, and an optional trailing action.

`title` is optional (2026-09-21). A page that already names itself in its
`PageHeader` omits it, so the name is not printed twice and the page has one h1;
the toolbar's own heading is an h2. Only a list with no page header of its own
(projects, agent knowledge) still passes a title.

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

## Markdown

`src/components/common/Markdown.tsx` (added 2026-09-11). Renders a markdown
string via `react-markdown` + `remark-gfm` — for backend-supplied markdown
that isn't a locale string (an agent's test-ask `answer`, a knowledge
citation `excerpt`), never for `t.*` copy, which stays plain JSX text.

No `dangerouslySetInnerHTML`: the library maps its parsed AST to React
elements itself, which is what makes it safe to point at crawled-page or
model-generated text with no separate sanitizer step. Links always render
with `target="_blank" rel="noopener noreferrer"`, since this content only
ever links to citation sources, not this app's own routes.

## MessageTime

`src/components/common/MessageTime.tsx` (added 2026-09-15). The send time
under a chat bubble: time of day via `formatTime()`, full date and time in
`title` and `dateTime`. The caller passes the text colour because it depends on
the bubble's fill. Used by the conversation transcript (`created_at` on every
visitor, AI, operator and system message) and the agent Test tab (`askedAt` /
`answeredAt`, recorded client-side since the test endpoint returns no
timestamp). Not shown in `WidgetPreview`, which mirrors the live `widget.js`,
and that bundle shows no times.

## ConversationTranscript

`src/components/common/ConversationTranscript.tsx` (extracted 2026-09-16). One
conversation's full transcript: system turns as dividers, visitor/AI/operator
bubbles with role-specific fills, markdown on the agent side only, citations
with `page_number`, `MessageTime` on every turn, a "load earlier messages"
control at the top of the scroll region, and auto-scroll that follows new turns
only while the reader is already pinned to the bottom.

It is a **pure presenter** — it takes transcript state (`TranscriptState`, the
return of `useTranscriptQuery`) rather than fetching, because two differently
authorized endpoints serve the same rows: `GET /conversations/{id}/messages/`
(`conversation:view`, via `useConversationMessages`) and
`GET /leads/{id}/conversation/messages/` (`lead:view`, via
`useLeadConversationMessages`). It previously lived inside
`ConversationsListView` as a module-private function that called its own hook,
which both blocked reuse and broke the hook/presenter split.

`className` overrides the default `flex-1` fill on whichever state branch
renders. The conversations pane owns its own height and keeps the fill; the
lead detail sheet is already scrolling, so it passes a bounded `max-h-80`
instead.

## PageHeader

`src/components/common/PageHeader.tsx`. `{ eyebrow?, title, description?, actions? }`
— the title/description/actions row every list and settings page renders at its top.
Extracted from Dashboard's original inline markup once other pages drifted
toward stock shadcn `font-semibold` headings instead of reusing it.

The scale matches the `ai-agents-platform` reference: a 28px `font-display` title,
a 15px description, and the left column capped at `max-w-2xl` so a description on a
wide screen keeps a readable measure. `eyebrow` is the small uppercase kicker in
`--brand-accent` — that token was declared in `globals.css` for exactly this and had
no caller until the agents marketplace needed one.

A page whose
title sits beside a badge or an inline back-link needs its own markup instead (see
`AgentDetailView`/`RoleEditorForm`) — `PageHeader` covers the plain title+description
case, not every header shape.

## MetricCard

`src/components/common/MetricCard.tsx`. `{ label, value, delta?, deltaDirection?,
sublabel?, isLoading? }` — the headline-number card on the dashboard, analytics, and
an agent's Overview tab.

`value` arrives already formatted, because only the caller knows whether the number
is a count, a percentage or a currency. `isLoading` renders a skeleton the size of
the value rather than of the whole card, so nothing jumps when the number lands.

The delta always ships an arrow alongside its colour. Colour on its own would make
up-versus-down invisible to a colour-blind reader.

Before this existed the same card was inlined three times and had already drifted:
the dashboard used a sentence-case `text-sm` label, analytics a `text-xs` one, and
the agent Overview tab an uppercase tracked one.

## WorkflowDiagram

`src/components/common/WorkflowDiagram.tsx`. `{ steps, label }` — a numbered
left-to-right pipeline, used for an agent's "How it works".

Renders as an `<ol>` with the dashed connectors as `aria-hidden` spans between
items, so a screen reader hears an ordered list of steps and nothing else. It
scrolls inside its own box: nine steps never fit on a phone, and letting the page
scroll sideways instead breaks every other screen.

## EmptyState

`title`, optional `description`, optional `icon`, optional `action`.

The action matters: an empty state without one is a dead end. Distinguish "nothing
exists yet" (action: create one) from "your filters matched nothing" (action: clear
filters) — only the caller knows which, and the wrong one is actively misleading.

## Dropzone

Drag-and-drop file input with a click-to-browse fallback, a preview chip for the
chosen file (name plus `formatFileSize`) and an optional clear button. Takes `file`
and `onFileSelected` — it is deliberately uncontrolled beyond that, because a picked
`File` is not a form value and does not belong in RHF.

Two things it does that a hand-rolled one usually gets wrong, and the reasons to keep
using this rather than writing another:

- **`accept` is enforced on drop, not just in the picker.** A drag bypasses the file
  dialog's filtering entirely, so without the check a wrong-type file is accepted
  client-side and only rejected after the upload has left.
- **`dragleave` is filtered by `relatedTarget`.** That event bubbles from every child,
  so dragging across the icon or the label otherwise flips the highlight off and on.

Copy defaults to `t.common.dropzone.*`; `hint`/`activeHint`/`rejectedMessage` override
it where a feature has more specific wording ("Drag a PDF here").

It lives here rather than in the feature that first needed it: the original was private
to `ProjectFilesSection`, inside the `projects` demo slice, so `npm run strip-demo`
would have deleted the copy a real feature depends on.

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

## RealtimeProvider

`src/providers/RealtimeProvider.tsx`, mounted by `LayoutWrapper`. Owns the single
realtime socket (connection logic stays in `src/hooks/useRealtimeSocket.ts`) and
exposes `useRealtime()` → `{ send, subscribe }`. `send` is best effort: a no-op unless
the socket is open, never throws. `subscribe(listener)` returns its unsubscribe and
receives only the event types in `src/types/realtime.ts`; unknown types are dropped so
the backend can ship new ones first. `session_revoked` and `notification` are still
handled inside the hook, not through subscribers, because they must fire regardless.
Do not open a second socket for a feature; subscribe here instead.

## RestrictedBreadcrumb

Derives crumbs from the pathname. A UUID segment is resolved to a record name through
`RESOLVERS`, keyed by the parent route segment. The resolver imports its `endpoint`
and `queryKey` from the service so the breadcrumb reads the detail page's cache
instead of refetching. With no resolver registered, a UUID falls back to a shortened
id — correct, just less useful. Other segments use the sidebar's own label
(`NAV_ITEMS`), then an agent type's name, then title-casing, so crumbs follow
the viewer's language.

## LanguageSelect

`src/components/common/LanguageSelect.tsx`, on the signed-out pages
(`AuthHeroShell`). Driven by `useLanguage`; renders nothing while one language ships.
The signed-in equivalent is the Language submenu in `ProfilePopup`.

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
