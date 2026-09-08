# ADR-0018: YB Inspire as accent colours only; supersedes ADR-0017's dark-first, full-repalette approach

**Status:** Accepted

## Context

[ADR-0017](0017-yb-inspire-brand-theme.md) rebranded the app to the full YB Inspire
palette: dark as the default and canonical theme, teal washed through `--accent`,
`--ring`, `--sidebar-accent`, and chart colours, a monospace capsule button shape
replacing the stock shadcn one, and decorative grid-line/glow textures on several
surfaces.

The client reviewed that build against the app they had already seen (the neutral
Nexus theme) and pushed back: they liked how "relaxed" and "clear" the existing UI
already was, and did not want the app to read as "fully green or yellow." Their
request was to keep everything as close to unchanged as possible and let teal/jaune
appear only on "the right forms" — the specific elements meant to carry brand colour —
rather than as a wash across backgrounds, hover states, focus rings, and decorative
texture.

## Decision

**Colour only, and only in two tokens.** `--primary` (teal) and `--brand-accent`
(jaune) are the only tokens that change from the pre-rebrand Nexus theme. Every other
token — `--background`, `--card`, `--border`, `--muted`, `--accent` (the hover/active
surface), `--ring`, `--sidebar` chrome, chart colours 3-5 — reverts to its original
neutral value. This directly undoes ADR-0017's items 1 (dark-first default), 2
(bleeding teal into hover/ring/sidebar-accent/most chart colours), and 6 (soft-halo
focus, `--surface-raised` texture tokens).

Consequently:

- **The default theme is light again** (`ThemeProvider`'s `defaultTheme` back to
  `"light"`). Dark is kept working as a toggle, unchanged from before either rebrand
  pass.
- **`--ring` (focus) stays neutral**, not teal. A focus ring fires on every
  interactive element in the app; tinting it teal reproduces the "everything is
  green" complaint on a much smaller but far more frequent surface than any single
  button.
- **`--accent` (hover/active surface) stays neutral.** It appears in menus, list
  rows, and dropdowns — broad, low-attention surfaces where a saturated accent reads
  as a wash rather than a signal.
- **`button.tsx` reverts to its pre-ADR-0017 shape**: `rounded-lg`, `font-medium`,
  sans body font, hard offset focus ring. This undoes ADR-0017 item 4. The one thing
  kept from that pass is the `cta` variant itself — colour only (`bg-brand-accent`,
  `text-brand-accent-foreground`), same shape as every other button — because a
  single, deliberately rare jaune button is exactly the "right form" the client asked
  for teal/jaune to be reserved to.
- **The decorative texture layer is removed**: `.cta-label`, `.grid-lines`,
  `.glow-brand`, `.band-deep`, `.accent-rule`, `.surface-raised` and their backing
  tokens (`--ring-halo`, `--surface-raised`/`-border`, `--ease-brand`) are deleted from
  `globals.css`, and their call sites in `AuthHeroShell`, `LandingPage`, and
  `PageHeader` revert to their original markup.
- **Fonts are unaffected by this ADR.** The client's feedback was about colour and
  visual weight, not typography; Work Sans / Poppins / JetBrains Mono (ADR-0017 item 7) stay.
- **`--primary`'s foreground stays dark (bleu nuit), not white**, in both themes. This
  part of ADR-0017 is unchanged and is not up for revision: white on this teal is
  2.24:1, below AA, regardless of how sparingly the teal itself is used.

## What this means concretely

Teal now appears only where `--primary` is the button/control fill (submit buttons,
`sidebar-primary` for the active nav item) and wherever a chart's primary data series
uses `--chart-1`. Jaune appears only via the `cta` Button variant, the small icon badge
next to the app name, and the `PageHeader` eyebrow text. Everything else — page
backgrounds, cards, borders, hover states, focus rings, the sidebar's own chrome — is
the same neutral palette the client had already approved before any of this started.

## Consequences

- `src/components/ui/button.tsx` no longer needs re-diffing for a capsule shape after
  a future `npx shadcn@latest add button` — only the `cta` variant (a plain colour
  addition, easy to re-add) needs to survive regeneration.
- A future request to lean further into the brand (the capsule buttons, the
  dark-first ground, the technical grid texture) is not a bug fix — it is a return to
  ADR-0017's approach, and should be scoped as its own decision with the client rather
  than assumed.
- ADR-0017 stays on record with its "Status" line pointing here, per this repo's ADR
  policy of superseding rather than editing: the reasoning that turned out to be
  wrong (reading the brand system as license to saturate the whole UI) is still worth
  keeping visible.
