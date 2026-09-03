# Testing

**Read this when:** adding a hook, a service, or a user-visible behaviour.

## Two layers

| Layer | Tool                     | Covers                                                 |
| ----- | ------------------------ | ------------------------------------------------------ |
| Unit  | Vitest + Testing Library | Hooks, services, pure logic, component behaviour       |
| E2E   | Playwright               | Auth, RBAC, and whether it actually works in a browser |

## Coverage ratchets, not a global target

Floors on `src/services/**`, `src/lib/**`, and `src/client/**`, set just under the
measured value and raised as coverage improves. Presentational components are
deliberately ungated.

A single global number on a frontend is dominated by JSX, and the easiest way to raise it
is to render components and assert nothing — worse than no target, because those tests
cost maintenance and catch nothing. See
[ADR-0009](../adr/0009-coverage-policy.md).

## Query by role, not by class

```tsx
screen.getByRole('button', { name: t.auth.signInButton });
```

A class is a styling decision that changes freely; a role is part of the contract with
assistive technology. Asserting on the accessible name also asserts the element _has_
one — so an unlabelled control fails the test rather than shipping.

Import strings from `src/locales` so rewording updates the tests instead of breaking
them.

## Test the behaviour, not the implementation

Assert what a user observes: the button is disabled, the message appears, the request was
made. Not that a particular internal state variable changed. The second kind of test
fails on every refactor while catching nothing.

## Tests must survive `strip-demo`

A test asserting on `/widgets` fails after the demo is removed, for a reason unrelated to
what it was testing. The `pageMeta` and `helper` specs deliberately use `/preferences`
instead. Keep shared-code tests independent of the demo module.

## E2E: more than one account

Three role projects — full access, read-only, and a valid account with no role. The
assertions worth having are the negative ones; a suite that runs only as an admin proves
the happy path and nothing else.

Every spec tolerates an empty dataset. A suite that only passes against seeded data fails
on a fresh database, and then gets ignored.

Details: `context/e2e.md`.

## What only E2E can catch

- Middleware actually being wired (`matcher` coverage)
- The refresh rotation surviving a real 401
- URL state surviving a real reload
- The breadcrumb reading the cache rather than refetching — asserted by counting requests,
  since that bug has no other visible symptom

## Gates

`npm run validate` — tsc, ESLint at `--max-warnings 0`, Prettier, Vitest with coverage.
Run by the pre-push hook and repeated unbypassably in CI.
