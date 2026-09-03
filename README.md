# Enterprise Frontend Template

Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui, talking to the
[enterprise backend template](../enterprise-backend-template). Ships authentication,
dynamic RBAC, a typed i18n catalog, and one removable demo module that demonstrates
every convention at once.

## Quickstart

```bash
npm run setup     # Node check, install, .env files with generated secrets, hooks, browsers
npm run dev       # http://localhost:3000
```

`npm run setup` is idempotent — re-running after a failure repairs rather than restarts.
It warns rather than fails when the backend is unreachable, since setting up the frontend
first is a normal order to do things in.

## What you get

|             |                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**    | NextAuth v4 credentials; access token in memory, refresh in an httpOnly chunked cookie, single-flight refresh                      |
| **RBAC**    | `{resource}:{action}` codes mirroring the backend, fail-closed guards, three client-side layers that are explicitly _not_ security |
| **Data**    | TanStack Query wrappers, the shared response envelope, a list-param contract asserted against the backend in CI                    |
| **i18n**    | English-only typed catalog; adding a language is content-only and a missing key is a compile error                                 |
| **UI**      | shadcn/ui only, stock neutral theme, light and dark first-class                                                                    |
| **Testing** | Vitest with directory coverage ratchets, Playwright across four role projects                                                      |
| **Infra**   | Multi-stage Dockerfile, CI, bundle budget, deploy with automatic rollback                                                          |

## The demo module

`src/app/(restricted)/widgets/` is a complete list-and-detail feature. Read it first —
it is the worked example every convention refers to. Remove it with:

```bash
npm run strip-demo     # and `make strip-demo` in the backend
```

## Commands

| Command                      | Does                                                  |
| ---------------------------- | ----------------------------------------------------- |
| `npm run validate`           | tsc, ESLint, Prettier, doc paths, tests with coverage |
| `npm run test:e2e`           | Playwright, all role projects                         |
| `npm run bundle:build-check` | Production build plus the bundle budget               |
| `npm run doc-paths`          | Verify every path cited in docs and skills exists     |
| `npm run strip-demo`         | Remove the demo module                                |

## Where the documentation lives

Three trees, three lifetimes. Conflating them is how all three rot.

| Tree                   | Holds                     | Read                      |
| ---------------------- | ------------------------- | ------------------------- |
| `AGENTS.md`            | The rules. Non-negotiable | Always                    |
| `docs/INDEX.md`        | Topics, ADRs, checklists  | The topic in play         |
| `context/`             | What exists right now     | The area you are touching |
| `context/changelog.md` | History                   | When you need it          |

`.claude/skills/` carries the same rules as operating instructions, loaded by topic.

## Before you ship

- Replace the placeholder legal copy in `src/locales/en/legal.ts` — it is an outline,
  not a policy.
- Replace the wordmark in `src/components/header/HeaderOne.tsx` and the app name in
  `src/locales/en/common.ts`.
- Brand by editing the `--primary` pair in `src/app/globals.css`, in both the `:root`
  and `.dark` blocks. Nothing else.
- Work through `docs/checklists/pre-release.md`.
