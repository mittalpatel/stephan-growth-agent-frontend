# UI Design

**Read this when:** building or changing anything visual.

## One component library

shadcn/ui only. Radix appears solely as its transitive dependency inside
`src/components/ui/**`; a direct `radix-ui` import is an ESLint error and
`@base-ui/react` is banned. See [ADR-0014](../adr/0014-shadcn-stock-theme.md).

Add primitives with `npx shadcn@latest add <name>`. `src/components/ui/` is generated
code — excluded from lint and coverage, never hand-edited, since edits are lost on
regeneration.

## Colour

Semantic tokens only:

`bg-background` · `text-foreground` · `text-muted-foreground` · `border-border` ·
`bg-card` · `bg-primary` / `text-primary-foreground` · `bg-muted` · `bg-accent` ·
`text-destructive` · `bg-success` / `bg-warning` / `bg-info` and their `-foreground` pairs
· `bg-brand-accent` / `bg-brand-surface` and their `-foreground` pairs

**Never** a hex, and never a raw Tailwind palette class. `bg-white` and `text-gray-500`
are not hex but hardcode one theme just as firmly. This is the rule that makes dark mode
free: one literal renders correctly in one theme and is unreadable in the other, and
nobody notices until a user screenshots it.

The theme is the original neutral Nexus palette, carrying exactly two colours from the
client's YB Inspire brand ([ADR-0018](../adr/0018-yb-inspire-accent-only.md), which
superseded an earlier full-repalette pass the client asked us to back out of):

| Role          | Token                       | Value                  | Rule                                                                                                    |
| ------------- | --------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Brand fill    | `--primary`                 | Teal `#5EBCB8`         | Foreground is dark, **never white** — 2.24:1, below AA                                                  |
| Rare CTA      | `--brand-accent`            | Jaune `#F5E723`        | Small footprint only: `<Button variant="cta">`, a badge, an eyebrow — never a background or hover state |
| Text on jaune | `--brand-accent-foreground` | Teal profond `#0D4A4E` | The only text colour the brand uses on yellow                                                           |

Everything else — `--background`, `--card`, `--border`, `--muted`, `--accent` (the
hover/active surface), `--ring` (focus), the sidebar chrome — is the pre-existing
neutral palette, deliberately **not** re-tinted toward teal or jaune. `--accent` and
`--ring` in particular fire on nearly every interaction in the app; tinting either one
is what turns "two accent colours" into "the whole UI is green," which is the exact
outcome client review rejected.

To rebrand further, change `--primary` and `--brand-accent` in `globals.css`, in both
the `:root` and `.dark` blocks, and nothing else — restoring ADR-0014's original
one-pair-edit intent, now scoped to two pairs.

The one exception to "tokens only" is `src/app/global-error.tsx`, which renders when the
stylesheet may have failed to load, and says so.

## Scale

- **Spacing:** Tailwind's 4px scale. Pick from it; do not invent values.
- **Radius:** one `--radius` token, everything derives from it.
- **Elevation:** one level, **border-based**. A shadow tuned for a light background
  disappears on a dark one, so the elevation cue has to be the border.
- **Type:** Poppins for headings and metric values (`font-display`), Work Sans for body
  (`font-sans`), JetBrains Mono reserved for numerics (`font-mono`).

## Every state is designed

A list or detail screen has four, and all four ship:

| State     | Requirement                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------- |
| Loading   | A `Skeleton` **shaped like the result**. Never a spinner — a spinner guarantees a layout shift |
| Error     | A message and a **retry**                                                                      |
| Empty     | Distinguish "nothing exists" from "nothing matched" — they need different actions              |
| Populated | The thing itself                                                                               |

An empty state without an action is a dead end. Offering "clear filters" to someone with
no filters set is noise; offering "create one" to someone whose search missed is
misleading.

## Accessibility is part of "elegant"

- Visible focus rings — never `outline: none` without a replacement
- 4.5:1 contrast for body text
- Keyboard-navigable dialogs and menus; escape closes, focus is trapped and restored
- **Never colour alone.** Roughly 1 in 12 men cannot distinguish the red/green pair, so
  the label must carry the meaning too
- Every icon-only control has an `aria-label` — from the catalog, like all text
- Label fields properly; a `placeholder` disappears on focus and is not reliably announced

`eslint-plugin-jsx-a11y` gates at `--max-warnings 0`.

## Motion

Only `src/components/motion/` — page and list transitions. No decorative animation. All
of it honours `prefers-reduced-motion`; the per-item stagger is capped so a long list
does not ripple for seconds.

## Responsive

Design at 375px and 1440px. Tables drop secondary columns before they scroll, and switch
to cards when there is nothing left to drop. Wide content scrolls inside its own
container — the page body never scrolls horizontally.

## Review

**Both themes, every change.** Not "looks fine in light".
