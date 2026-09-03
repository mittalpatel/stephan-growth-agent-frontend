# No Role

**Source:** `src/app/(restricted)/no-role/page.tsx`

Where a user lands when they authenticate successfully and have no permissions at all.

This is the case most apps get wrong. Authentication succeeded, so bouncing them back
to `/login` is both wrong and confusing — they will simply sign in again and loop.
`getDefaultRoute()` in `src/lib/helper.ts` returns `NO_ROLE_ROUTE` for an empty
permission list precisely to break that cycle.

The page states the situation, tells the user to contact an administrator, and offers a
session refresh for the case where a role was just assigned and the cached permission
set is stale. Copy lives under `t.errors.noRole`.

`e2e/roles/no-access.spec.ts` covers it with a real account that has no role.
