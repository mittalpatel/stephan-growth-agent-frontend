# Infrastructure

**Read this when:** changing the build, CI, or the deploy path.

## Setup

```bash
npm run setup    # Node check, install, .env files with generated secrets, hooks, browsers
npm run dev
```

Idempotent — re-running after a failure repairs rather than restarts. It warns rather
than fails when the backend is unreachable, since setting up the frontend first is a
normal order to do things in.

## Gates

`npm run validate` — tsc, ESLint at `--max-warnings 0`, Prettier, Vitest with coverage
ratchets.

| Hook       | Runs                                        |
| ---------- | ------------------------------------------- |
| pre-commit | Staged secret scan → lint-staged → validate |
| pre-push   | Security scan → coverage → build            |

**Hooks are convenience; CI is the gate.** `git push --no-verify` skips a hook and
nothing skips CI, which is why the workflow deliberately repeats the same checks.

## CI jobs

| Job             | Gate                                                               |
| --------------- | ------------------------------------------------------------------ |
| `validate`      | The above, plus `npm audit`, production build, bundle budget, SBOM |
| `contracts`     | Backend's generated contracts vs the vendored copy                 |
| `secret-scan`   | Gitleaks, full history                                             |
| `security-scan` | Semgrep                                                            |

`contracts` needs the `BACKEND_REPO` variable; without it the job warns and passes, since
an unconfigured template should not be red out of the box.

## Bundle budget

`scripts/check-bundle-size.mjs` compares gzipped shared and total client JS against a
committed baseline with a 5% tolerance. A dependency that quietly adds 200KB fails the
build rather than being noticed a quarter later.

`npm run bundle:update` re-baselines — deliberately explicit, so a regression cannot be
absorbed silently.

## Docker

Three stages: `deps`, `builder`, `runner`. Non-root, health-checked. `output: 'standalone'`
is what makes the runtime stage possible.

**`NEXT_PUBLIC_*` is inlined at build time, not read at runtime.** The backend URL is a
build arg, and an image built for staging cannot be promoted to production. Build once
per environment, or move the value to a runtime-fetched config endpoint. This surprises
people more than anything else on this page.

## Deploy

`deploy.sh`: pull → install → build → restart → poll health → **roll back on failure**.
Everything env-overridable so it can be rehearsed locally. Rehearse it, including the
rollback — that is the part worth having already seen work.

`.github/workflows/deploy.yml` runs it over SSH on push to `staging`. Reaching the host
over a private tunnel rather than a public SSH port is strongly preferable; the workflow
carries a commented Tailscale step, disabled because a template cannot assume a tailnet.
