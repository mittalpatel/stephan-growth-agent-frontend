# API Contract

**Read this when:** calling an endpoint, adding a service, or handling an API error.

## Two clients

| Client        | For                                 | Token | Refresh on 401     |
| ------------- | ----------------------------------- | ----- | ------------------ |
| `axiosAuth`   | Anything behind a session           | Yes   | Yes, single-flight |
| `axiosPublic` | Pre-login: reset, invite validation | No    | No                 |

Using `axiosAuth` pre-login sends credentials where none are needed and can start a
refresh loop on a page where nobody is signed in.

## The envelope

```ts
{
  (success, message, data, meta, errors);
}
```

For a list, `data` **is** the array; pagination is in `meta`. Typed as `ApiResponse<T>`
in `src/types/api.ts`. Rationale: [ADR-0005](../adr/0005-response-envelope.md).

## Errors — `applyApiError`

Three shapes, routed automatically:

| `errors`           | Goes to                                 |
| ------------------ | --------------------------------------- |
| `{ field: ["…"] }` | Inline, via RHF `setError`              |
| `{ code: "…" }`    | Inline via `codeFieldMap`, else a toast |
| `null`             | A toast, using `message`                |

Field binding works **only** because Zod field names match the backend serializer's
exactly. That is what removes the mapping table — and why renaming on one side silently
turns an inline message into an anonymous toast.

`applyApiSuccess` prefers the backend's localized `message` over the caller's fallback,
so a dynamic server message reaches the user.

## List params — `src/services/listParams.ts`

Mirrors `common/api/query_params.py`. Columns are comma-joined; **value groups are
pipe-joined**. Swapping the separators produces a request the backend parses without
error and interprets as different filters.

Never send a param blank: `search_by=` is a different request from no search, and it
produces a different cache key on both sides, so an unfiltered list misses the cache
every render.

## `?type=parameters`

The backend returns a list's own filter and sort configuration, and `FilterToolbar`
renders itself from it — so **adding a filter is a backend-only change**.
`default_value` applies only on first load; URL filters always win, or a shared link
would silently re-apply the default over the filters it carried.

## Query hooks

`useAuthQuery` forwards TanStack's `AbortSignal` to axios, cancelling a stale or
unmounted request in flight. Always use it rather than raw `useQuery`, so the auth
header, abort wiring, and error handling stay consistent.

## Service modules own three things

Endpoints, query keys, and param building. No React, no state, no fetching — the hooks
do that. **Export the query-key builder**: the breadcrumb resolver reads the detail
page's cache and can only do so while both call the same function.

Reference: `src/services/widgets.ts`.

## This is a cross-repo contract

`src/__tests__/contracts.test.ts` asserts the envelope, the list params, and the
permission algebra against the backend's generated `contracts/*.json`. When it fails,
fix the mirror — never the JSON, which is generated output.
