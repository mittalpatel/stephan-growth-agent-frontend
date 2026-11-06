# ADR-0020: Growth Agents colours and typography; supersedes ADR-0018's YB Inspire values

**Status:** Accepted

## Context

The product is now Stephan Growth Agent, and the frontend should match the
colours and typography of https://growth-agents.com/. That site's global design
tokens are electric blue `#1B1AFF` (primary, secondary and accent alike), ink
text `#181B1F`, a cool light surface `#F5F8FE`, grey `#7C878E`, border
`#E7E7E7` and near-black `#101214`. Inter is used for everything: 700 for
headings, 600 for sub-heads, 500 for accents and buttons, 400 for body text.

## Decision

- **Same token names, new values.** `--primary` is the blue with white
  foreground (7.96:1). Secondary, muted and accent surfaces are `#F5F8FE`.
  The border is `#E7E7E7`, and `--brand-surface` is `#101214`.
- **One brand hue.** The site has no second accent colour, so `--brand-accent`
  is a pale blue tint with blue text, not a separate colour.
- **Muted text is darkened.** `#7C878E` measures 3.7:1 on white, below AA, so
  `--muted-foreground` uses `#5F6A71` (5.2:1 on `#F5F8FE`).
- **Focus ring stays neutral**, for the reason ADR-0018 gives: brand colour on
  a surface that common turns into a wash.
- **Typography:** Inter replaces Work Sans (body) and Poppins (display).
  `--font-display` and `--font-heading` point at Inter, so headings get their
  hierarchy from weight. JetBrains Mono is unchanged.
- ADR-0018's accent-only principle still holds. Only the values change.

## Consequences

Only `src/app/globals.css` and `src/app/layout.tsx` change. Components keep
using semantic utilities, so dark mode follows from the `.dark` block.
