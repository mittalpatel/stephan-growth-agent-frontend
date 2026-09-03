# E2E (Playwright)

## Why more than one account

The assertions worth having are the negative ones. A suite that runs only as an admin
can prove the happy path and nothing else; every authorization bug lives in the cases
where a user _should not_ be able to do something.

Three role projects, each with its own storage state:

| Project              | Account                | Asserts                                         |
| -------------------- | ---------------------- | ----------------------------------------------- |
| `chromium`           | Seeded `Admin`         | Full flows work                                 |
| `chromium:read-only` | Seeded `Read Only`     | Pages open **and** write affordances are absent |
| `chromium:no-access` | Valid account, no role | Lands on `/no-role`, every route refuses        |
| `unauthenticated`    | No session             | Guests are redirected off restricted routes     |

Setup projects (`auth.setup*.ts`) sign in once through the real form and save storage
state; the browser projects depend on them. So the login flow is exercised
deliberately in one place rather than incidentally at the start of every spec.

## Layout

```
e2e/
  helpers.ts                        Shared locators and waits
  auth.setup.ts                     Admin       → .auth/user.json
  auth.setup.read-only.ts           Read Only   → .auth/read-only.json
  auth.setup.no-access.ts           No role     → .auth/no-access.json
  authenticated/
    dashboard.spec.ts               Shell, sidebar navigation, dark mode
    preferences.spec.ts             Session vs default, cross-tab sync
    user-profile.spec.ts
    widgets.spec.ts                 The list/detail reference specs
    auth-redirect.spec.ts
  roles/
    read-only.spec.ts
    no-access.spec.ts
  unauthenticated/
    login.spec.ts
    forgot-password.spec.ts
    auth-redirect.spec.ts
```

The storage-state files hold real session tokens. They are written to an
`.auth/` directory under `e2e/` at run time and are gitignored — never commit one.

## Setup

Copy `.env.e2e.example` → `.env.e2e` and fill in the three accounts. `npm run setup`
does the copy. Then `npm run test:e2e`.

## Locator conventions

- **Roles and catalog strings, never CSS classes.** A class is a styling decision that
  changes freely; a role is part of the contract with assistive tech and worth
  protecting. Importing `t` from `src/locales` means rewording a button updates the
  specs automatically instead of breaking them.
- **Scope column checks to `thead`.** The sort `<select>` carries `<option>` elements
  with the same labels, so an unscoped text match passes even when the column is gone.
- **Count rows with `countDataRows`.** Skeletons render row-shaped elements too, so a
  bare `tbody tr` count reports whatever was on screen at that instant.
- **`settle(page)` after anything that refetches.** It must outlast the 400ms search
  debounce plus the request.

## Every spec tolerates an empty dataset

A suite that only passes against seeded data fails on a fresh database, and a suite
that fails on a fresh database gets ignored. Specs needing rows call
`test.skip(await countDataRows(page) === 0, 'no seeded data')`.

## The breadcrumb cache assertion

`widgets.spec.ts` counts detail requests after navigating from the list. The
breadcrumb resolver and `useWidgetDetail` build their query key from the same
`widgetDetailKey`, so the breadcrumb is a cache read. If they drift the count becomes
2 — which is the _only_ visible symptom of that bug, and the reason the assertion
exists.

## URL param namespacing

Every list writes `<namespace>_page`, `<namespace>_sort`, `<namespace>_search_by`, and
so on. The widgets list uses `widgets`. Namespacing is what lets two lists share a
screen without colliding, and specs assert on the namespaced key.
