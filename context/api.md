# API

## Two axios clients

| Client                      | Use for                                      | Calls                              | Refreshes on 401 |
| --------------------------- | -------------------------------------------- | ---------------------------------- | ---------------- |
| `src/client/axiosAuth.ts`   | Everything behind a session                  | Same-origin `/api/backend/*` proxy | Yes              |
| `src/client/axiosPublic.ts` | Pre-login: password reset, invite validation | The backend origin directly        | No               |

`axiosAuth` does **not** attach an `Authorization` header itself — see
`context/auth.md`'s "the browser never calls the backend directly" section. It calls
`src/app/api/backend/[...path]/route.ts`, which reads the access token server-side
from the JWT cookie and attaches it there, so the token never exists anywhere client
JS can read it. `axiosPublic` still calls the backend origin directly because it
never carries a token to begin with.

Using `axiosAuth` for a pre-login endpoint would send credentials where none are
needed and can start a refresh loop on a page where nobody is signed in.
`src/client/__tests__/axiosPublic.test.ts` asserts the public client registers no
interceptors at all, because the absence is the whole point.

Both send `Accept-Language` from `DEFAULT_LANGUAGE`, so backend messages come back
translated.

## The envelope

Every `/api/v1/*` endpoint answers with the same shape:

```ts
{
  (success, message, data, meta, errors);
}
```

- `data` — the payload. For a list this is the array itself, **not** `data.results`;
  pagination lives in `meta`.
- `meta` — `{ count, total_pages, current_page, page_size, next, previous }`.
- `errors` — see below.

Typed as `ApiResponse<T>` in `src/types/api.ts`. This is the frontend half of
`common/api/response.py` and is asserted against the backend's generated contract in
`src/__tests__/contracts.test.ts`.

## Error handling — `src/lib/apiError.ts`

`errors` arrives in one of three shapes, and `applyApiError` routes each to the right
surface so call sites do not re-implement the parsing:

| Shape             | Example                        | Goes to                                 |
| ----------------- | ------------------------------ | --------------------------------------- |
| Field-keyed       | `{ quantity: ["Too large."] }` | Inline, via RHF `setError`              |
| Domain code       | `{ code: "wrong_password" }`   | Inline via `codeFieldMap`, else a toast |
| Null / form-level | `errors: null`                 | A toast, using `message`                |

Field-keyed binding only works because **Zod schema field names match the backend
serializer field names exactly**. That is why there is no code-to-field mapping table.

A 429 carries `Retry-After`; the backend CORS-exposes it, and `rateLimitMessage`
renders a countdown. If the header is not exposed the browser hides it from JS and the
message degrades to a generic toast — `contracts.test.ts` asserts the exposure.

`applyApiSuccess` is the mirror: it prefers the backend's localized `message` over the
caller's fallback, so a dynamic server message reaches the user instead of being
thrown away.

## Query hooks

| Hook                              | For                                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `useAuthQuery(key, url, options)` | Reads. Forwards TanStack's `AbortSignal` to axios, so a stale or unmounted request is cancelled in flight |
| `useAuthMutation(options)`        | Writes. Caller passes `{ url, body, method }`                                                             |
| `useAuthMutationWithStatus`       | When the caller must branch on status or read a response header                                           |

## List contract — `src/services/listParams.ts`

The param names the backend expects. Mirrors `common/api/query_params.py`:

| Key                      | Param                                                                         |
| ------------------------ | ----------------------------------------------------------------------------- |
| `page` / `pageSize`      | `page`, `page_size`                                                           |
| `search` / `searchValue` | `search` (columns, comma-joined), `search_by` (the term)                      |
| `filter` / `filterValue` | `filter` (columns, comma-joined), `filter_by` (value groups, **pipe**-joined) |
| `sort` / `sortDirection` | `sort`, `sort_direction`                                                      |

Columns and value groups use **different separators**. Swapping them produces a
request the backend parses without error and interprets as entirely different filters.

Never send a param blank. `search_by=` is a different request from no search at all —
it produces a different cache key on both sides, so an unfiltered list misses the
cache on every render. `buildWidgetListParams` omits rather than blanks.

## `?type=parameters`

A list endpoint returns its own filter and sort configuration:

```ts
{ filters: FilterConfig[], search_fields: FieldConfig[], sort_fields: FieldConfig[],
  default_sort?: { field, direction } }
```

`FilterToolbar` renders itself entirely from this, so **adding a filter is a
backend-only change**. `default_value` applies only on first load — URL filters always
win, or a shared link would silently re-apply the default over the filters it carried.

Field names here have drifted before (`display_name`/`allow_multiple` on the frontend
versus `label`/`type` on the wire) and rendered blank headings while both sides
compiled. Hence the contract test.

Not every filter a `?type=parameters` response lists rides the generic
`filter`/`filter_by` contract above. `has_escalation` on `/conversations/` (backend
2026-09-16, the first `"boolean"`-typed filter in this codebase) is read as its own
top-level query param server-side, so the frontend sends it the same way — see
`context/app/(restricted)/conversations/page.md`'s "List/detail/toolbar" section for
how that's threaded through `useQueryParams`'s ad-hoc param pair rather than
`buildListParams`.

## Reference implementation

`src/services/projects.ts` plus `src/app/(restricted)/projects/hooks/useProjectsList.ts`.
A service module owns endpoints, query keys, and param building — no React, no state,
no fetching. Export the query-key builder: the breadcrumb resolver reads the detail
page's cache and can only do so while both sides call the same function.

## Backend cache bypass

After a browser reload, `axiosAuth` tags GETs with `Cache-Control: no-cache` for a
short window (`src/lib/backendCache.ts`) so a refresh returns current data rather than
the backend's Redis copy. It is deliberately not sent on every request — that would
defeat the backend cache for everyone.
