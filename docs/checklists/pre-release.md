# Pre-Release Checklist

## Gates

- [ ] `npm run validate` green on the release commit
- [ ] CI green, including the jobs the hooks skip (Semgrep, Gitleaks, `npm audit`)
- [ ] `npm run bundle:build-check` within budget — and if the baseline was raised, that
      was deliberate

## Contract

- [ ] `contracts/*.json` current against the backend being deployed
- [ ] Backend deploying first if the change depends on a new endpoint or field

## Configuration

- [ ] Every new env var in `.env.example` and set in the target environment
- [ ] **No secret carries a `NEXT_PUBLIC_` prefix**
- [ ] `NEXT_PUBLIC_BACKEND_API` correct for the target — it is baked in at build time, so
      an image built for another environment is wrong
- [ ] Backend CORS allow-list includes this origin

## Browser

- [ ] Smoke-tested at 375px and 1440px, in both themes
- [ ] Sign in, sign out, and token refresh all work against the target backend
- [ ] A read-only account sees no write affordances

## E2E

- [ ] `npx playwright test` passes for all role projects against staging

## Legal and content

- [ ] Placeholder legal copy replaced — the template ships an outline, not a policy
- [ ] No placeholder branding left in metadata, the header wordmark, or the copyright line

## Rollback

- [ ] Previous build deployable
- [ ] Rollback rehearsed at least once
