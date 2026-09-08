# ADR-0017: YB Inspire brand theme, dark-first; supersedes the stock-neutral part of ADR-0014

**Status:** Accepted

## Context

The client (YB Inspire, https://ybinspire.com) delivered `YB_Inspire_Brandbook_v1.0.pdf`.
ADR-0014 deliberately shipped shadcn's stock neutral palette so a generated app looked
deliberate rather than half-branded, with branding left as a documented future edit to
the `--primary` pair. That future arrived: this ADR is that edit, done for real, plus
what the palette-only plan in ADR-0014 didn't anticipate needing.

The brand's own palette (extracted from the brandbook, cross-checked against the
reference site's shipped stylesheet) is dark-first: bleu petrole `#0A3D51` is the main
ground, not a shade of white. Reading the brandbook alone would have produced a
palette-accurate but tonally wrong theme — the site's actual stylesheet is what shows
that most of the identity is typographic and structural (monospace capsule CTAs, a soft
focus halo, translucent surfaces) rather than purely chromatic.

## Decision

1. **Dark is the default and canonical theme**, not light. `ThemeProvider`'s
   `defaultTheme` is `"dark"`; light is kept as a genuine, working secondary expression
   (`:root` in `globals.css`), matching the brand's own "bleu petrole + teal sur blanc"
   logo variant, but every dark-vs-light judgement call in the palette favours the dark
   block being canonical and the light block being derived from it, reversing ADR-0014's
   original relationship.
2. **Teal is `--primary`, jaune is not.** The brandbook is explicit that the yellow CTA
   "reste visible mais rare" and calls stacking yellow buttons a mistake. `--primary`
   fills every ordinary button in the app, so it has to be the workhorse colour (teal),
   with jaune reachable only through a new, deliberately non-default `cta` button variant.
3. **`--primary-foreground` is dark, not white**, in both themes where `--primary` is
   teal. White on teal is 2.24:1 contrast — the brandbook names this exact pairing as
   "a eviter" (p.15) — so the foreground is bleu nuit at 7.5:1+ instead.
4. **`src/components/ui/button.tsx` is hand-edited**, not wrapped. AGENTS.md forbids
   restyling a shadcn primitive in place and asks that a genuine exception be raised
   rather than patched around; a monospace, fully-rounded capsule shape is not
   expressible as a call-site `className` override without fighting the primitive's own
   `rounded-lg`/`font-medium` base classes at every call site, and AGENTS.md's own rule
   is that "a variant belongs on the primitive, not a one-off `className` override at
   each call site". The alternative — a `BrandButton` wrapper — would leave every
   existing `<Button>` call site off-brand and creates the two-competing-primitives
   problem ADR-0014 removed `@base-ui/react` to avoid. **Consequence:** a future
   `npx shadcn@latest add button` will overwrite this file and needs the capsule shape,
   the `font-mono`/uppercase/tracking base classes, and the `cta` variant re-applied.
5. **Two new token pairs**: `--surface-raised`/`--surface-raised-border` (the reference
   site's white-4%-fill-on-10%-border card recipe, additive to `--card`'s solid
   treatment rather than replacing it, since a popover floating over an unknown surface
   needs to be opaque) and `--ring-halo` (the soft focus bloom colour). Added in all
   three required places per the existing rule: `:root`, `.dark`, `@theme inline`.
6. **Focus indicator changes shape**: from a hard offset ring to the reference site's
   soft `box-shadow: 0 0 0 1px var(--ring), 0 0 0 6px var(--ring-halo)`. The 1px edge is
   kept underneath the halo specifically so the indicator survives high-contrast modes
   and surfaces where the halo alone would be too faint — visible focus is non-negotiable
   regardless of which brand supplies the colour.
7. **Fonts move to the brand's own three-family split**: Work Sans (body, replacing
   Inter), Poppins (display/headings, replacing Manrope), JetBrains Mono (labels, CTAs,
   data — unchanged as a family, but now also gains weight 700 for the capsule CTAs).

## What ADR-0014 got right and keeps

- shadcn/ui as the only primitive source, `@base-ui/react` banned, direct `radix-ui`
  imports an ESLint error: unaffected by this decision.
- Colour literals confined to `globals.css`, semantic token names over raw Tailwind
  palette classes: unaffected, and this ADR's own review found and fixed several
  pre-existing violations (`text-white` on `bg-primary`, `bg-black/*` scrims, a
  `bg-brand` class that pointed at a token which never existed) that were latent under
  the old navy `--primary` and became visible failures once `--primary` became teal
  (`text-white` on teal is exactly the forbidden 2.24:1 pairing).
- `src/app/global-error.tsx`'s literal-colour exception: unchanged, still the one
  sanctioned exception, still because the stylesheet it would otherwise depend on may
  not have loaded.
- "Every UI change is reviewed in both themes before merge": unchanged as a rule: this
  ADR is what makes dark the theme reviewed by default rather than the one reviewed
  second.

## What is explicitly out of scope here

- **No logo swap.** The brandbook (p.13) forbids reconstructing the wordmark from a
  raster or a font, and the client has not supplied the licensed SVG. The app's existing
  `--brand-accent` icon mark keeps its shape and takes the new palette.
- **No runtime per-organization theming.** `BrandSettings.color_primary`/
  `color_secondary` are stored today but nothing writes them into CSS variables; making
  that live is a separate feature from applying the client's own brand to the app shell.
- **No custom cursor, no scroll-triggered animation.** The reference site hides the
  native cursor and drives GSAP ScrollTrigger choreography. That is marketing-site
  theatre: wrong for an enterprise app, in conflict with the "no decorative animation"
  rule, and `cursor: none` is an accessibility regression on its own.

## Consequences

- Rebranding is no longer "the `--primary` pair, and only that pair" as ADR-0014 stated —
  it is the full token set plus `button.tsx`'s `cva`, because a capsule CTA shape cannot
  live in tokens alone. Any future rebrand needs to budget for that primitive edit too.
- `button.tsx` needs re-diffing after every `npx shadcn@latest add button` regeneration;
  there is no tooling enforcement of this yet, only this ADR and the comment in the file
  itself.
- Every UI review from here on treats **dark** as the primary theme to check, with light
  as the secondary pass, the reverse of the ADR-0014-era default.
