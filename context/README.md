# Project Context

**Current state** — what exists in this codebase right now. Updated with every
change. Not to be confused with the other two trees:

| Tree                        | Holds                                     | Changes          |
| --------------------------- | ----------------------------------------- | ---------------- |
| `docs/` + `.claude/skills/` | Rules — how this codebase is built        | Rarely           |
| **`context/`**              | **Current state — what exists right now** | **Every change** |
| `context/changelog.md`      | History — what changed and when           | Append-only      |

Read **only** the doc(s) your request touches. Reading the whole folder for every
request does not scale and wastes the window.

## Structure

`app/` **mirrors** `src/app/` exactly. From any source file, navigate to the matching
path under `context/app/` to find its doc.

```
context/
  app/                                  ← mirrors src/app/
    layout.md                           ← src/app/layout.tsx
    legal/page.md
    (public)/
      layout.md
      login/page.md
      forgot-password/page.md
      signup/page.md
      signup/create/page.md
    (restricted)/
      layout.md
      dashboard/page.md
      no-role/page.md
      preferences/page.md
      user-profile/page.md
      widgets/page.md                   ← the demo module's worked example
      widgets/[widgetId]/page.md

  architecture.md   Stack, folder structure, conventions
  auth.md           NextAuth, session shape, token refresh, RBAC, proxy.ts
  api.md            Axios clients, the envelope, list params, query patterns
  components.md     Shared component inventory
  layout.md         Header, Sidebar, Breadcrumb, LayoutWrapper
  locales.md        Catalog structure, adding keys, adding a language
  e2e.md            Playwright projects, role accounts, locator conventions
  deployment.md     Docker, CI gates, deploy and rollback
  changelog.md      Running log, most recent first
```

## Flat reference docs

| File                               | Covers                                                         |
| ---------------------------------- | -------------------------------------------------------------- |
| [architecture.md](architecture.md) | Stack, folder structure, conventions                           |
| [auth.md](auth.md)                 | NextAuth, session shape, token refresh, RBAC, route protection |
| [api.md](api.md)                   | Axios clients, response envelope, list-param contract          |
| [components.md](components.md)     | Shared components and when to use each                         |
| [layout.md](layout.md)             | Header, Sidebar, Breadcrumb, LayoutWrapper                     |
| [locales.md](locales.md)           | Catalog structure, adding keys, adding a language              |
| [e2e.md](e2e.md)                   | Playwright projects, role accounts, locator conventions        |
| [deployment.md](deployment.md)     | Docker, CI gates, deploy and rollback                          |
| [changelog.md](changelog.md)       | Running log of significant changes                             |

## Page docs

| File                                                                                         | Covers                                                               |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [app/layout.md](app/layout.md)                                                               | Root layout — providers, fonts, metadata                             |
| [app/(public)/layout.md](<app/(public)/layout.md>)                                           | Public layout — redirect when already signed in                      |
| [app/(public)/login/page.md](<app/(public)/login/page.md>)                                   | Login — form, validation, sign-in flow                               |
| [app/(public)/forgot-password/page.md](<app/(public)/forgot-password/page.md>)               | Three-step password reset                                            |
| [app/(public)/signup/page.md](<app/(public)/signup/page.md>)                                 | Invite-only account activation                                       |
| [app/(public)/signup/create/page.md](<app/(public)/signup/create/page.md>)                   | Public self-signup — opt-in, email-verified via OTP                  |
| [app/(restricted)/layout.md](<app/(restricted)/layout.md>)                                   | Restricted layout — auth guard, provider stack                       |
| [app/(restricted)/dashboard/page.md](<app/(restricted)/dashboard/page.md>)                   | Dashboard — the default landing route                                |
| [app/(restricted)/no-role/page.md](<app/(restricted)/no-role/page.md>)                       | Shown when a valid account has no permissions                        |
| [app/(restricted)/preferences/page.md](<app/(restricted)/preferences/page.md>)               | Preferences — the registry, session vs saved default, cross-tab sync |
| [app/(restricted)/user-profile/page.md](<app/(restricted)/user-profile/page.md>)             | Profile and password, incl. the external-IdP case                    |
| [app/(restricted)/widgets/page.md](<app/(restricted)/widgets/page.md>)                       | **The list-page reference implementation**                           |
| [app/(restricted)/widgets/[widgetId]/page.md](<app/(restricted)/widgets/[widgetId]/page.md>) | **The detail-page reference implementation**                         |

> The two `widgets` docs describe the demo module. `npm run strip-demo` deletes them
> along with the code. Read them first when building your own first module — they are
> the worked example the rest of the conventions refer to.
