# ADR-0001: TanStack Query, not SWR

**Status:** Accepted

## Decision

TanStack Query v5 for all server state, wrapped by `useAuthQuery` / `useAuthMutation`.

## Why

**Mutations are first-class.** SWR is excellent at reads and leaves writes largely to
the caller. This application is full of writes that must invalidate specific caches,
and having one library own both sides means invalidation is a key selector rather than
a bespoke callback per mutation.

**Query keys are structured.** An array key composes naturally with request params, so
the cache entry and the request stay in step automatically — which is what makes
`[WIDGETS_LIST_KEY, params]` correct by construction.

**`AbortSignal` forwarding.** The query function receives a signal that is aborted when
the key changes or the component unmounts. `useAuthQuery` passes it to axios, so a stale
request is cancelled in flight rather than resolving against a gone consumer.

**Devtools.** Being able to see the cache is worth a great deal when debugging a stale
read.

## Rejected: SWR

Lighter, and the read ergonomics are comparable. The mutation and invalidation story is
thinner, and this application's difficulty is concentrated there.

## Rejected: RTK Query

Would mean adopting Redux Toolkit for its cache layer alone. No other part of the app
wants a global store.

## Consequences

- Server state lives in the query cache. Component state is for genuinely local UI, and
  URL state (see ADR-0010) is for anything that should survive a refresh.
- Every query goes through `useAuthQuery`/`useAuthMutation`, not raw `useQuery`, so the
  auth header, the abort wiring, and the error envelope stay consistent.
