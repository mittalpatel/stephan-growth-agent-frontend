# ADR-0009: One coverage policy — 90% backend floor, directory ratchets on the frontend

**Status:** Accepted

## Decision

- **Backend:** a single global floor, `--cov-fail-under=90`, enforced in CI.
- **Frontend:** per-directory ratchets on the business-logic paths (`src/services/**`,
  `src/lib/**`, `src/client/**`), set just under the measured value. Presentational
  components are deliberately ungated.

## Why the two differ

Almost all backend code is logic worth testing, so one number is meaningful.

On the frontend, most of the line count is JSX. A single global number there is
dominated by markup, and the easiest way to raise it is to render components and assert
nothing. That is worse than no target: it produces tests that cost maintenance and catch
nothing. Ratcheting the directories that hold the logic targets the coverage where it
means something.

## Why a ratchet rather than a fixed target

A fixed target gets set once and either blocks work or is quietly lowered. A ratchet is
set at the current measured value and can only go up: new untested logic in a gated
directory fails the build, and improving coverage locks the improvement in.

## What the numbers do not mean

90% line coverage says 90% of lines executed during the test run. It says nothing about
whether the assertions were meaningful. Which is why `CLAUDE.md` separately requires
edge cases by name — not-found, forbidden, boundary values, idempotency, and every
documented business rule — because those are what coverage cannot measure.

## Consequences

- Lowering a ratchet requires deliberately editing `vitest.config.ts`, which shows up in
  review.
- The backend floor is global, so a well-tested module can mask a poorly-tested one.
  Accepted; the per-app test requirements in `CLAUDE.md` are the real control.
