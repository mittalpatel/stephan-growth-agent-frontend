# Organization API Keys

**Source:** `src/app/(restricted)/organization/api-keys/page.tsx`

List, create, and revoke API keys (service tokens) for the active organization.
Mirrors `organization/audit/` for the list half (URL-backed filters, pagination,
never-cached reads) and `organization/members/` for the mutation half (local
`pendingKeyId`/`ConfirmDialog` revoke pattern).

## File map

```
src/app/(restricted)/organization/api-keys/
  page.tsx                     # Server: metadata + Suspense boundary
  hooks/
    useOrganizationApiKeys.ts  # List state + revoke — flat props bag
  components/
    ApiKeysView.tsx            # Orchestrates loading/error/empty/populated
    ApiKeysSkeleton.tsx        # Loading shape
    CreateApiKeyDialog.tsx     # Create form; hands the response to the parent
    RevealSecretDialog.tsx     # One-time secret display

src/services/apiKeys.ts        # Endpoints, query keys, param building, DTOs
```

## The one-time secret — where it lives and where it must never go

`ApiKeyCreateResponse.secret` exists in exactly one place at a time as it moves
through the UI: the resolved value of `CreateApiKeyDialog`'s `useAuthMutation`
call, then `ApiKeysView`'s local `revealedKey` state, then `RevealSecretDialog`'s
`secret` prop. It is **never**:

- put in a TanStack query key or cache entry — there is no query for it, only a
  mutation, and the mutation result is not cached by default;
- put in the URL — no `router.push`/`searchParams` touches it;
- read back from any GET — `ApiKeyDetail`/`ApiKeyRow` (the shapes every list/detail
  fetch returns) do not have a `secret` field at all, only `ApiKeyCreateResponse`
  does, and that type is returned by nothing else.

If a future change needs the secret to survive a re-render some other way (e.g.
surviving a parent remount), do not reach for `sessionStorage` or a global —
that just relocates the same problem. Keep it in the component tree's state and
accept that closing the reveal dialog is genuinely the end of its lifetime,
matching the backend guarantee that nothing but the hash is stored.

## Why there is no route handler for create

`context/auth.md`'s "credentials go through a same-origin route handler" rule is
scoped to session token pairs (`ORGANIZATION_SWITCH_ROUTE`,
`IMPERSONATION_START_ROUTE`) — it exists so a **refresh token** never reaches
browser JS. An API key secret is not a session credential, is never written to
the session cookie, and the whole point of the create response is to display it
in the browser — a route handler could not "hide" it even in principle. Create
goes through the ordinary `/api/backend` proxy like any other mutation.

## Permission picker

`CreateApiKeyDialog` reuses `PermissionTransferList` (the same component the role
editor uses), but pre-filters its `catalog` prop to `isGrantable(code)` from
`usePermissionCatalog()` before it ever reaches the list — see that component's
docstring. The role editor shows the full catalog with non-grantable codes
greyed out (useful there, since seeing the whole catalog matters); here the goal
is narrower: offer nothing the backend's `RBACService.assert_within_ceiling`
would then reject with a 400.

## Status

Complete. `src/services/__tests__/apiKeys.test.ts` covers endpoint/query-key
shape per the `src/services/**` coverage ratchet.
