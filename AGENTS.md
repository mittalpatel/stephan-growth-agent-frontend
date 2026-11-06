# Never access `.env`

Do not `Read`, `cat`, `grep -A`/`-B` its contents, `Edit`, or otherwise open this
repo's `.env`/`.env.local` files for any reason — they hold live secrets (API keys,
NextAuth secret, tokens). This applies even when debugging a config-looking failure:
use `grep -E "^KEY_NAME="` to confirm a variable is _set_ without ever printing its
value, ask the user to check/paste the relevant line themselves, or work from
`.env.example` (safe — placeholder values only) instead. Never quote `.env` contents
back to the user in a message, tool output, or committed file.

# No lint, tests, or build during a task — STRICT

Do not run `tsc --noEmit`, `eslint`, `vitest`, `prettier --check`, `npm run
doc-paths`, `npm run build`, or any other lint/test/build command after every edit or
as a "let me verify" step during a task. Running these repeatedly on every small
change burns credits for no benefit. Only run them once, right before a commit/push,
or when the user explicitly asks you to run them. Make the change, trust it, move on.
This is a strict rule — do not run these checks "just to be safe" mid-task.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Concretely, at Next 16: middleware is `src/proxy.ts`, and `params` and `searchParams`
are Promises that must be awaited. Destructuring `params` directly is the single most
common upgrade mistake, and it fails at runtime rather than at build.

# Context folder — read before working, update before finishing

`context/` holds the technical context for this project (see `context/README.md` for
the index). Before working on a request:

- Identify which doc(s) it touches — the flat docs (`auth.md`, `api.md`,
  `architecture.md`, `components.md`, `layout.md`, `locales.md`, `e2e.md`) for
  cross-cutting concerns, or `context/app/**/page.md` for a specific page.
  - The `app/` subfolder **mirrors** `src/app/` exactly. From any source file,
    navigate to the matching path under `context/app/` for its context doc.
- Read **only** the relevant doc(s) — don't read the whole folder for every request.

Three trees, three lifetimes, and conflating them is how all three rot: `docs/` and
`.claude/skills/` are **rules** (rarely change), `context/` is **current state**
(changes with every feature), `context/changelog.md` is **history** (append-only).

## Context updates are mandatory, not best-effort

After **any** change that touches auth/RBAC, routing or `proxy.ts`, a page's data
flow, shared components, or adds/removes a feature — update the matching `context/`
doc(s) in the same turn, before reporting the task done:

- New/changed permission codes, route-protection rules, or session shape →
  `context/auth.md`.
- New/changed page behavior, hooks, or API contract → the matching
  `context/app/**/page.md`, creating it if the page has none.
- New/changed shared component, endpoint pattern, or locale convention →
  `components.md` / `api.md` / `locales.md`.
- Any non-trivial change → a dated entry at the top of `context/changelog.md`.

A task is not complete until the relevant context file(s) match the code as left —
treat this the same as the tsc/lint/test gate, not a nice-to-have.

# Colors come from globals.css only — never inline

Every colour in the UI resolves to a token defined in `src/app/globals.css` and is
referenced through its semantic Tailwind class: `bg-background`, `text-foreground`,
`text-muted-foreground`, `border-border`, `bg-card`, `bg-primary`,
`text-primary-foreground`, `bg-muted`, `bg-accent`, `text-destructive`, and the
`success` / `warning` / `info` status pairs.

Never use a literal colour anywhere else. No `bg-[#efefef]`, no
`style={{ color: '#...' }}`, no raw hex or rgb in `className` — and **no raw Tailwind
palette classes either**: `bg-white`, `text-gray-500`, and `border-neutral-200` are
just as wrong, because they hardcode one theme. This is what makes dark mode free. A
single literal colour renders correctly in one theme and is unreadable in the other,
and nobody notices until a user screenshots it.

This theme is **no longer** shadcn's stock neutral palette. It carries the
Growth Agents brand (growth-agents.com): `--primary` is electric blue `#1B1AFF`,
the secondary/muted/`--accent` surfaces are the cool light `#F5F8FE`, text is ink
`#181B1F`, borders are `#E7E7E7`, and `--brand-accent` is a pale blue tint (the
brand has one hue). `--ring` stays neutral. Typography is Inter for body and
headings, with JetBrains Mono for numerics; Poppins 500 (`font-accent`) is
reserved for short card titles on the marketing pages, which also use the
site's looser rhythm (1.75 body line height). The app UI keeps its denser scale.
Brand colour still appears only on the elements it accents, not washed across the
UI. See
[ADR-0020](docs/adr/0020-growth-agents-theme.md), which replaces the YB Inspire
values of [ADR-0018](docs/adr/0018-yb-inspire-accent-only.md) and keeps its
accent-only principle. The token _names_ are still stock, which is what keeps every
future `npx shadcn@latest add …` matching automatically.

Changing `--primary` and `--brand-accent` in `globals.css` (both `:root` and `.dark`
blocks), and nothing else, is the way to rebrand further. Do not hand-edit
`src/components/ui/**` to restyle a primitive, even for something as small as swapping
a ring for a border, because that directory is generated and the edit is lost on the
next regeneration. If a primitive genuinely cannot be themed through tokens, raise it
rather than patching it in place.

Two token pairs exist beyond the stock set: `--brand-accent` / `--brand-accent-foreground`
(the brand highlight, reachable only through the `cta` Button variant, a small badge, or
an eyebrow label — never a background or a hover state, and separate from shadcn's
`--accent`, which is the ordinary hover/active surface and stays neutral) and
`--brand-surface` / `--brand-surface-foreground` (a full-bleed brand panel that stays the
same colour in both themes, unlike a control fill). Adding a token means adding it in
three places: `:root`, `.dark`, and `@theme inline`.

**Always pair `--primary` with `text-primary-foreground`, never `text-white`.** White
happens to pass on the light-mode blue, but dark mode lightens `--primary` and its
foreground turns dark, so a hardcoded `text-white` breaks one theme.

The one sanctioned exception is `src/app/global-error.tsx`, which renders when the
root layout (and therefore the stylesheet) may have failed to load. It says so.

**Every UI change is reviewed in both themes before merge.** Not "looks fine in
light" — both.

# Work like a senior frontend engineer — non-negotiable

Approach every change the way a senior engineer would: think about the shape of the
codebase, not just making the symptom go away. Match existing conventions, choose the
reusable solution over the one-off, and **never extend a bad pattern just because it
is already there** — fix it, or flag it. Redundant or dead code (fallbacks that
contradict the types, unused branches, copy-paste, a control wired to nothing) is a
defect, not a style nit.

## One component library: shadcn/ui

- **shadcn/ui is the only source of UI primitives.** Radix is permitted solely as
  shadcn's transitive dependency inside `src/components/ui/**`. A direct
  `import … from 'radix-ui'` in app code is an ESLint error, and `@base-ui/react` is
  banned outright. The template inherited three overlapping component systems fighting
  over the same widgets; it now has one, and the lint rule is what keeps it that way.
- **Add primitives with the CLI** (`npx shadcn@latest add <name>`), never by hand.
  `src/components/ui/` stays generated code — it is excluded from lint and coverage,
  and hand-edits there are lost on the next regeneration.
- Keep `cva` + `cn` for variants. A variant belongs on the primitive, not as a
  one-off `className` override at each call site.
- Icons: `lucide-react` only. Motion: only the existing `components/motion/`
  transitions; no decorative animation.

## No hardcoded user-facing strings — anywhere

Every string a user can read comes from `src/locales/en`. This is an ESLint **error**,
not a warning, and it covers JSX text, `placeholder`, `title`, `alt`, `aria-label`,
and `toast.*()` arguments. An `aria-label` is as user-facing as a heading; leaving it
in English while the rest is translated is how the accessible copy silently becomes
the untranslated copy.

Adding a language must stay a content-only change: `cp -r src/locales/en src/locales/xx`,
translate the values, add the code to the `Language` union. `Translations` is derived
from English via `typeof en`, so a missing or misspelled key is a compile error rather
than a blank string found in production.

Formatting goes through `src/lib/i18n.ts` — `format()`, `plural()`, `formatNumber()`,
`formatCurrency()`, `formatDate()`. Never build a user-visible string with a template
literal or `+ 's'`: `` `${n} items` `` is untranslatable and already wrong for `n === 1`.

## No em-dash in user-facing text

Never use an em-dash (`—`) in text a user can see: metadata, toasts, labels,
placeholders, or any locale string. It reads as AI-generated. Rephrase rather than
substituting another separator (`·`, `-`, and friends are the same tic in a different
costume): split the sentence, use a colon, or reword so the connector is unnecessary.
This is about visible copy, not code comments.

## Forms: always Zod + React Hook Form

Every form — new or touched — uses **React Hook Form with a Zod schema** through
`@hookform/resolvers/zod`. No `useState`-per-field, no ad-hoc `validate()` functions,
no `.trim()` on submit (put `.trim()` in the schema, or `'   '` passes a `min(1)` check
and posts an empty value).

- Schemas live in `src/lib/schemas/*`, typed via `z.infer`. **Field names must match
  the backend serializer's field names exactly** so backend field errors bind inline
  through `applyApiError({ setError, fields })` with no mapping table. See
  `src/lib/schemas/project.ts`.
- Build fields from the shared primitives in `src/components/common/form/` inside a
  `<FormProvider>`. Add a new primitive there when a field type is missing rather than
  inlining a one-off.
- Client validation is a courtesy. The backend enforces all of it again plus the rules
  a client cannot know. A green form is never authorization.

## Business logic and UI must be separated — always

Data fetching, mutations, request/response mapping, and side effects live in a
**custom hook**; the component is a **pure presenter** that renders what the hook
returns. A component that calls `useMutation`, builds a request body, or maps API
errors inline is wrong — extract it to `use<Feature>.ts`. See
`src/app/(restricted)/projects/hooks/useProjectsList.ts`, which returns a flat props bag,
and the components under `projects/components/` that consume it.

This is a hard rule, enforced the same as the tsc/lint/test gate.

## URL state, not component state

Page, search, sort, and filters belong in the URL via `useQueryParams`, namespaced per
list (`projects_page`, `projects_sort`). A filtered list is then linkable, survives a
refresh, and restores on back-navigation — none of which is true of `useState`. The
namespace is what lets two lists coexist on one screen without colliding.

The exception is a personal display preference, such as table-versus-grid view. That
is not part of what the link points at, and putting it in the URL imposes your layout
on whoever you send it to.

## Every state is designed, not incidental

A list or detail screen has four states, and all four are built before it ships:
loading (a `Skeleton` **shaped like the result**, never a spinner — a spinner
guarantees a layout shift), error (with a retry), empty (distinguishing "nothing
exists" from "nothing matched your filters", since they need different actions), and
populated. Accessibility is part of this: visible focus rings, 4.5:1 contrast,
keyboard-navigable dialogs, and never colour as the only signal.

## The cross-repo contract

`src/services/listParams.ts`, `src/lib/apiError.ts`, and `src/lib/helper.ts` mirror
backend files and are **not local decisions**. `src/__tests__/contracts.test.ts`
asserts them against the backend's generated `contracts/*.json`. When it fails, fix
the mirror — never edit the JSON, which is generated output.

## The demo module

The `projects` slice is a complete worked example, removed by `npm run strip-demo`.
If you reference it from shared code, register the removal in `scripts/strip-demo.mjs`
in the same turn, and keep tests independent of it — a test asserting on `/projects`
fails after the strip for a reason unrelated to what it was testing. Run
`make strip-demo` in the backend too.

## No co-author trailer on commits

Never add a `Co-Authored-By` line, or any AI-attribution trailer, to a commit message.
Commits should look like any other commit in this repo.

## Commit/push must be thin

When asked to commit and push, run `git add` / `git commit` / `git push`. Don't read
files, re-verify diffs, or run tsc/lint/tests first unless asked — the pre-commit and
pre-push hooks already do that. Only stop to investigate if a hook actually fails.
