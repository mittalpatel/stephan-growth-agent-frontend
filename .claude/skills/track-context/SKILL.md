---
name: track-context
description: Updates the project context files after any code change. Use this automatically after every edit session, file change, feature addition, bug fix, or refactor. Triggered by phrases like "update context", "save context", "log this change", or at the end of any implementation task.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# track-context skill

After making code changes in this project, update the relevant context files in `context/` to reflect what changed. Keep every entry **short** — one to three lines max per item. No prose, no padding.

## Page map — which file to update

| What changed                                             | Context file              |
| -------------------------------------------------------- | ------------------------- |
| Auth, session, NextAuth, RBAC, middleware                | `context/auth.md`         |
| Axios client, API endpoints, fetch patterns, services    | `context/api.md`          |
| Any reusable component in `src/components/`              | `context/components.md`   |
| Header, Sidebar, Breadcrumb, LayoutWrapper, layout files | `context/layout.md`       |
| A page's data flow, hooks, or components                 | `context/app/**/page.md`  |
| Locale keys, translation files, `src/locales/`           | `context/locales.md`      |
| Stack, folder structure, conventions, providers, config  | `context/architecture.md` |
| Playwright projects, roles, locator conventions          | `context/e2e.md`          |
| Docker, CI gates, deploy                                 | `context/deployment.md`   |
| Anything else / cross-cutting                            | `context/changelog.md`    |

When a change touches multiple areas, update each relevant file.

## Step-by-step

1. Run `git diff HEAD~1 HEAD --stat` (or `git diff --stat` if uncommitted) to see which files changed.
2. For each changed file, identify the matching context page from the table above.
3. Read the target context file.
4. Append or update a concise entry. Use this format at the bottom of the relevant section:

```
- <filename or feature>: <one-line description of what changed and why> (<date YYYY-MM-DD>)
```

5. Always append a one-liner to `context/changelog.md` too:

```
- YYYY-MM-DD: <short summary of the session's changes>
```

## Rules

- Max 3 lines per entry. If it needs more, it belongs in the main docs, not here.
- No full code blocks in context files — use inline code only (`MyComponent`, `useWidgets`, etc.).
- Do not delete existing entries. Append or edit in-place if updating a stale fact.
- Do not reformat or rewrite sections you're not changing.
- If a file doesn't have a matching section yet, add a minimal one.
