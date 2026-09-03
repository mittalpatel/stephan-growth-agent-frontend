# ADR-0011: Two repositories, not a monorepo

**Status:** Accepted

## Decision

The backend and frontend are separate repositories with separate CI, versioning, and
deploys. The shared API surface is enforced by a generated contract rather than a shared
package.

## Why

They deploy independently and on different cadences. A monorepo makes that possible but
not automatic — you end up with path filters in CI to avoid rebuilding everything, which
is most of the coordination cost of two repos plus the tooling of one.

The teams and the toolchains are disjoint: Python and Node, pip and npm, pytest and
Vitest. A single repo means every developer installs both, and every CI run either
builds both or is filtered.

## The real cost, stated plainly

**The API contract is duplicated, and duplicated things drift.** This is not a
hypothetical: it happened twice, and both times both repos compiled.

- `limit` was renamed to `page_size` on the backend. The frontend kept sending `limit`,
  the backend ignored it and used its default, and every list silently paged at the
  wrong size.
- `build_parameters_config()` emitted `label`/`type`; the frontend declared
  `display_name`/`allow_multiple`. Filter headings rendered blank.

Each was found by reading code, months later.

## The mitigation, which is the load-bearing part of this decision

`make contracts` exports the envelope, the list params, and the permission codes plus
their algebra to `contracts/*.json`. The frontend vendors that output and asserts its own
constants against it in CI (`src/__tests__/contracts.test.ts`), and a drift job compares
the vendored copy against the backend's current one.

**This ADR is only defensible while that job exists.** Without it, two repos means the
contract is enforced by memory.

## When to revisit

A fourth application sharing the same API. At that point a published
`packages/contracts` (npm + pip from one source) beats generate-and-assert, and the
monorepo argument becomes genuinely strong.
