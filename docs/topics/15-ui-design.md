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
· `bg-brand-accent` / `bg-brand-surface` and their `-foreground` pairs ·
`bg-surface-raised` / `border-surface-raised-border`

**Never** a hex, and never a raw Tailwind palette class. `bg-white` and `text-gray-500`
are not hex but hardcode one theme just as firmly. This is the rule that makes dark mode
free: one literal renders correctly in one theme and is unreadable in the other, and
nobody notices until a user screenshots it.

The palette is the client's brand ([ADR-0017](../adr/0017-yb-inspire-brand-theme.md)),
**dark-first** — dark is the default theme, light a genuine but secondary one:

| Role          | Token                       | Value                  | Rule                                                          |
| ------------- | --------------------------- | ---------------------- | ------------------------------------------------------------- |
| Main ground   | `--background` (dark)       | Bleu petrole `#0A3D51` |                                                               |
| Contrast band | `--brand-surface`           | Bleu nuit `#071F2B`    | Identical in both themes                                      |
| Brand fill    | `--primary` (dark)          | Teal `#5EBCB8`         | Foreground is dark, **never white** — 2.24:1, below AA        |
| Rare CTA      | `--brand-accent`            | Jaune `#F5E723`        | One per screen; use `<Button variant="cta">`, not `--primary` |
| Text on jaune | `--brand-accent-foreground` | Teal profond `#0D4A4E` | The only text colour the brand uses on yellow                 |

Rebranding is **not** a one-token edit any more: it means the full token set in
`globals.css` (`:root`, `.dark`, `@theme inline`) plus, per ADR-0017, the capsule shape
and `cta` variant hand-edited into `src/components/ui/button.tsx` — a shadcn primitive,
so that edit needs to be re-applied after any future `npx shadcn@latest add button`.

The one exception to "tokens only" is `src/app/global-error.tsx`, which renders when the
stylesheet may have failed to load, and says so.

## Scale

- **Spacing:** Tailwind's 4px scale. Pick from it; do not invent values.
- **Radius:** one `--radius` token (14px), everything derives from it — except buttons,
  which are `rounded-full` capsules by design (ADR-0017); the tension between soft-cornered
  cards and hard-round CTAs is deliberate, not an inconsistency.
- **Elevation:** border-based for `--card`, plus a translucent `.surface-raised` utility
  (4% fill, 10% border) for the brand's own in-page card texture. A shadow tuned for a
  light background disappears on a dark one, so the elevation cue has to be the border.
- **Type:** Poppins for headings and metric values (`font-display`), Work Sans for body
  (`font-sans`), JetBrains Mono for labels, CTAs and data (`font-mono`) — the brand's own
  three-family split. CTAs and eyebrow labels use the `.cta-label` utility (mono, 700,
  uppercase, tracked out): the single loudest signal in the brand, and typographic rather
  than chromatic.
- **Focus:** a soft halo, `box-shadow: 0 0 0 1px var(--ring), 0 0 0 6px var(--ring-halo)`,
  not a hard offset ring — still always visible, per Accessibility below.
- **Texture:** `.grid-lines` and `.glow-brand` utilities for the brand's fine technical
  grid and ambient wash, held at single-digit opacity. Structural, not decorative — use
  on a handful of high-value surfaces (auth hero, marketing hero), not everywhere.

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
