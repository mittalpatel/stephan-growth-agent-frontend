# Auth & RBAC

**Read this when:** gating a control or a route, or touching tokens, sessions, or
permissions.

## Token storage

| Token       | Where                    | Why                                                                                         |
| ----------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| Access      | In memory (`axiosAuth`)  | Never `localStorage` — anything on the page can read it, including a compromised dependency |
| Refresh     | httpOnly, chunked cookie | Must survive reload; unreadable from JS                                                     |
| Permissions | Fetched, held in context | Removed from the JWT to stay under the 4KB cookie limit                                     |

Full reasoning, including the chunking and single-flight refresh:
[ADR-0007](../adr/0007-token-storage.md).

## Permission codes

`{resource}:{action}`. `manage` subsumes view/create/update/delete but **not** `execute`
or `export` — editing a record, running an operation on it, and bulk-extracting the table
are different kinds of authority.

`src/lib/helper.ts` must stay bit-identical to `common/constants/permissions.py`;
`src/__tests__/contracts.test.ts` asserts it against the generated contract.

## Gating a control

```tsx
const { can } = usePermissions();
{
  can('widget', 'export') && <ExportButton />;
}
```

Use the **precise action**, not a coarse read/write helper. A delete button gated on
"write" appears for someone who may only create.

`PermissionGuard` fails closed once permissions have loaded.

## Gating a route

`ROUTE_PERMISSIONS` in `src/constants/roles.ts`, resolved by longest matching prefix so a
child can require a narrower permission than its parent.

## None of this is security

Three client-side layers decide what to _render_:

| Layer                         | Decides               |
| ----------------------------- | --------------------- |
| `ENABLED_PREFIXES` (proxy)    | Is the page on at all |
| `ENABLED_HREFS` / `NAV_ITEMS` | Is the link visible   |
| `ROUTE_PERMISSIONS`           | May this user open it |

**The backend refuses the requests independently and is the only thing protecting the
data.** A route missing here is a bad experience; a backend view missing its permission
declaration is a vulnerability.

## Permissions are fetched, not claimed

`getMyPermissions.ts` is `import 'server-only'` with `cache: 'no-store'`. The no-store is
a security requirement: the response is per-user and differentiated only by the
Authorization header, so caching it in Next's URL-keyed Data Cache could serve one user's
permissions to another.

## No role at all

An authenticated user with no permissions goes to `/no-role`, not back to `/login` —
authentication succeeded, so bouncing them to the login form just loops.

## Sign-out

Clears the in-memory token, the cookie, and the preference session, and broadcasts on the
`auth` channel so other tabs sign out too.

## Open redirects

`safeRedirect` rejects absolute and protocol-relative URLs. `callbackUrl` comes from the
query string; unchecked, it hands an attacker a link that looks like your domain.
