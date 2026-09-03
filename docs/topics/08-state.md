# State

**Read this when:** deciding where a piece of state should live.

## The decision tree

| The state is…                                           | Put it in            | Why                                                     |
| ------------------------------------------------------- | -------------------- | ------------------------------------------------------- |
| Data from the server                                    | TanStack Query       | It has an owner elsewhere; you are caching, not storing |
| What this list is showing (page, search, sort, filters) | **The URL**          | Must be linkable, refresh-safe, back-navigable          |
| A personal display preference (table vs grid)           | `useState`           | Not part of what the link points at                     |
| A user setting that should persist                      | `PreferencesContext` | Session value plus an optional saved default            |
| Ephemeral UI (is this popover open)                     | `useState`           | Nothing else cares                                      |
| Cross-cutting, rarely changing (permissions, user)      | Context              | Everything needs it; almost nothing changes it          |

## Server state is not application state

A fetched list is a **cache** of something the server owns. Copying it into `useState`
creates a second source of truth that goes stale silently and needs manual
invalidation — which is the library's whole job.

Key structure matters: `[WIDGETS_LIST_KEY, params]` composes so the cache entry and the
request stay in step automatically. Any URL change that alters the request alters the
key; any change that does not, reuses it.

## URL state

Via `useQueryParams(namespace)`, with every key prefixed (`widgets_page`). See
[ADR-0010](../adr/0010-namespaced-url-params.md).

The test for whether something belongs in the URL: **would you want to send someone this
exact view in a link?** Filters yes; whether you personally prefer cards, no.

## Context is for cross-cutting, low-churn values

`PermissionsContext`, `UserContext`, `PreferencesContext`. Every consumer re-renders when
the value changes, so context holding frequently-changing state is a performance problem
that grows with the tree.

`PreferencesContext` also shows the pattern for a value that is both local and remote:
the session value is instant and ungated, while persisting it as a default is a request
and requires a permission. Conflating those two is the mistake the design exists to
prevent.

## No global store

No Redux, no Zustand, no Jotai. Server state is in the query cache, shareable UI state is
in the URL, and the little that is left is local or context. A global store here would
mostly duplicate the query cache.

## State lives in hooks, not components

`useWidgetsList` owns everything and returns a flat props bag; the components render it.
That is what makes the presenters testable without a network and reusable in a different
context. A component calling `useQuery` or `useMutation` directly is wrong.
