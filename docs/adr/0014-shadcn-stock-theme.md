# ADR-0014: shadcn stock neutral theme, no brand palette; `@base-ui/react` removed

**Status:** Accepted. The "stock neutral palette" and "branding is a `--primary`-pair
edit" parts of this decision are superseded by
[ADR-0017](0017-yb-inspire-brand-theme.md), which applies the client's actual brand.
The component-library and colour-token-discipline decisions below are unaffected and
still current.

## Context

The source applications pulled UI from three overlapping places: shadcn primitives,
direct `radix-ui` imports, and `@base-ui/react` — two component systems competing over
the same widgets. `globals.css` carried a brand palette baked into 52 primitives.

## Decision

1. **shadcn/ui is the only source of primitives.** Radix stays as shadcn's transitive
   dependency; direct imports are an ESLint error. `@base-ui/react` is removed.
2. **The theme is shadcn's stock neutral palette, unmodified.** No brand colours, no
   custom accent.
3. **Colour literals appear only in `globals.css`.** Components use semantic tokens.

## Why stock, when branding is obviously wanted eventually

A custom palette is exactly what breaks `npx shadcn@latest add <name>`. Every primitive
added later — today's and next year's — is generated against the stock token names, so
a bespoke theme means hand-editing every new component forever.

Branding a generated app is then one edit: the `--primary` pair, in both the `:root` and
`.dark` blocks. Everything else follows. A neutral default also looks deliberate rather
than half-branded, which a placeholder palette does not.

## Why one component library

Two systems means two focus-ring conventions, two dialog implementations with different
escape-key behaviour, two sets of ARIA decisions, and a per-component judgement call
about which to reach for. The ESLint rule is what keeps the boundary from eroding, since
the pressure to import "just this one" from elsewhere is constant.

## Why no raw Tailwind palette classes either

`bg-white` and `text-gray-500` are not hex, but they hardcode one theme just as firmly.
This is the rule that makes dark mode free: a single literal renders correctly in one
theme and is unreadable in the other, and nobody notices until a user screenshots it.

Status tones (`success`, `warning`, `info`) are therefore tokens in `globals.css` with
both light and dark values, not `bg-emerald-50`.

## The one exception

`src/app/global-error.tsx` renders when the root layout — which imports the stylesheet —
may have failed. It uses literals in an inline `<style>` block with a
`prefers-color-scheme` query, and says so in a comment.

## Consequences

- The baseline ships ~30 primitives, not 52. The CLI adds the rest on demand.
- `src/components/ui/` is generated code: excluded from lint and coverage, never
  hand-edited.
- Every UI change is reviewed in both themes before merge.
