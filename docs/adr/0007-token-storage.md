# ADR-0007: Access token in memory, refresh token in an httpOnly chunked cookie

**Status:** Accepted

## Decision

| Token       | Stored                                                            | Lifetime        |
| ----------- | ----------------------------------------------------------------- | --------------- |
| Access      | A module-level variable in `axiosAuth`                            | Short           |
| Refresh     | httpOnly, secure, same-site session cookie, chunked at 3800 bytes | Long            |
| Permissions | Not in the token at all — fetched from `me/permissions`           | Cached per user |

## Why not `localStorage`

Any script running on the page can read it. That includes a compromised dependency, and
the npm supply chain is a realistic threat. A token in `localStorage` survives the tab,
so exfiltrating it yields durable access; an in-memory token dies with the page and is
only reachable while the attacker's code is already executing.

## Why the refresh token is httpOnly and not in memory

It has to survive a reload, or every refresh signs the user out. httpOnly keeps it
unreadable from JS, so the XSS that could steal the access token cannot take the
long-lived credential with it.

## Chunking

Browsers cap a cookie near 4KB. The session cookie holds the encoded JWT and can exceed
that — and when it does the cookie is silently truncated: the user appears signed in
until the first request fails to parse. `CHUNK_SIZE = 3800` splits it across numbered
cookies with headroom.

This is also why permissions were removed from the token. They were the largest field
and grew with every new resource.

## Rotation is not optional

SimpleJWT blacklists a refresh token once used. The rotated one must be re-encoded and
**re-chunked** back into the cookie by `/api/auth/refresh`; otherwise the next refresh
presents a blacklisted token and the session ends mid-use.

## Single-flight refresh

A page that fires five requests as the access token expires gets five 401s. Refreshing
per-401 means four of them use an already-rotated, now-blacklisted token. `axiosAuth`
queues the failures in `failedRequestsQueue`, issues exactly one refresh, and replays
the queue.

## Consequences

- A hard reload has no access token and does one refresh before the first request. This
  is the intended cost.
- `session.maxAge` must stay pinned to the backend's refresh lifetime. If the session
  outlives the token, the user appears signed in while everything fails.
