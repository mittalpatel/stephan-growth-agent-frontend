# ADR-0005: A response envelope, not raw DRF

**Status:** Accepted

## Decision

Every `/api/v1/*` response is `{success, message, data, meta, errors}`, built by
`ApiResponse` in `common/api/response.py`.

## Why

**One parse path on the client.** Raw DRF returns a bare object on retrieve, a bare
array on list, `{count, next, previous, results}` when paginated, `{"detail": "..."}`
on a framework error, and `{"field": ["..."]}` on a validation error. Five shapes means
five branches at every call site, and the branches are written from memory.

**A localized message travels with the result.** The backend knows the user's
`Accept-Language`; the frontend does not know what happened. Putting `message` in the
envelope means a dynamic server-side message reaches the user instead of being replaced
by a hardcoded client string.

**Errors have a place to be structured.** `errors` distinguishes field-keyed validation
from a domain error code from nothing at all, which is what lets `applyApiError` bind a
message to the right input without a lookup table.

## Costs

- Every response is a few bytes larger and one level deeper. `data` is not the response.
- `drf-spectacular` needs help describing the wrapper.
- Anyone who has used DRF before expects the bare shape and is briefly surprised.

## Consequences

This is **contract #1** with the frontend. It is exported by `make contracts` and
asserted in the frontend's CI, because a change here breaks every screen at once.
