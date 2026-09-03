# Phase 2 auth-hardening journey

One continuous Playwright spec (`phase2-auth-journey.spec.ts`) that walks a
brand-new account through everything built in Phase 2 of the framework
roadmap: public signup + email verification, enabling MFA, the login
challenge (TOTP and backup-code paths, including a wrong code and a reused
backup code), the self-service session list and revoke, the new-device login
alert, and password breach/reuse rejection on change-password.

It drives the real backend, not mocks. Screenshots (one per milestone) land in
`artifacts/screenshots/`, and every run — not just failures — is also
recorded as a full video + trace under `artifacts/test-results/` (see the
`journey` project in `playwright.config.ts`).

## One prerequisite: the backend must use its console email backend

This spec reads the signup-verification OTP and the new-device-alert email
back out of the backend's own log, not a real inbox — there is no test
mailbox in this stack, and the backend's `.env` has real Gmail SMTP
credentials configured. Running this suite against real SMTP would either
send email nobody can read back programmatically, or actually deliver to
whatever address the test happens to use.

Before running this spec, start the backend (and its Celery worker — signup
OTPs and the new-device alert both dispatch through `NotificationDispatcher`,
which sends via a Celery task, not inline) with `EMAIL_HOST_USER` unset so
Django's own fallback in `config/settings/local.py` picks the console email
backend instead of SMTP:

```bash
cd ../enterprise-backend-template
source venv/bin/activate
EMAIL_HOST_USER= AUTH_THROTTLE_RATE=100/min python manage.py runserver 0.0.0.0:8000 --noreload &
EMAIL_HOST_USER= celery -A config worker -l info --logfile logs/celery_worker.log &
```

`AUTH_THROTTLE_RATE` is the second override worth calling out: the backend's
`/login/` endpoint is IP-throttled at `5/min` by default (`ThrottleScope.AUTH`,
account-independent). One real user never hits that; one browser driving
signup → MFA challenge → a wrong-code retry → a backup-code retry → a second
device → a third device inside under a minute does — this journey makes more
than five `/login/` calls total. Raise the rate for local/CI e2e runs rather
than spacing the spec out with artificial waits.

That's the log file `e2e/journey/helpers/mailbox.ts` tails by default
(`../enterprise-backend-template/logs/celery_worker.log`, relative to this
frontend repo's root). Point `E2E_BACKEND_LOG_PATH` at a different path if
your backend checkout lives somewhere else, or if you're capturing that
process's stdout to a different file yourself.

Also confirm `PUBLIC_SIGNUP_ENABLED=true` in the backend's `.env` — this spec
signs up through `/signup/create`, which 404s otherwise.

## Running it

```bash
npx playwright test --project=journey --workers=1
```

`--workers=1` matters once there is more than one spec here: they all drive one
backend and read one shared mailbox log, and running them concurrently starves
them of their own timeouts rather than finding real bugs.

This project holds three specs:

| Spec                             | What it covers                                        |
| -------------------------------- | ----------------------------------------------------- |
| `phase2-auth-journey.spec.ts`    | The whole Phase 2 story as one user                   |
| `sessions-signout.spec.ts`       | Signing out **this** device from Active Sessions      |
| `sessions-signout-other.spec.ts` | Signing out **another** device (two browser contexts) |

None depends on the `setup` project or any seeded account — each creates its own
via public signup (`signUpFreshAccount` in `helpers/actions.ts`), so they are
safe to run repeatedly without colliding with a previous run's account. An
earlier version of the session specs did use a hand-made login, and broke the
moment it was cleaned up; if you add a spec here, have it sign up too.
Nothing deletes that account afterward; it's a disposable row in whatever
database the backend under test points at, the same way the manual `curl`
smoke tests during this feature's development left disposable users behind
before being cleaned up by hand.

## What it does not cover

- **HIBP breach checking** is off by default (`HIBP_ENABLED=False`) and this
  spec doesn't require flipping it — it exercises Django's always-on
  `CommonPasswordValidator` instead (a common password is refused in every
  environment). See the backend's `changelog/2026-08-25.md` for how the HIBP
  path itself was verified live, against the real `api.pwnedpasswords.com`.
- **MFA disable and recovery-code regeneration** aren't part of this journey
  — they're each already covered by backend security-property tests
  (`apps/users/tests/test_mfa_security_properties.py`) and aren't
  distinguishing UI behavior worth re-proving here.
- Every edge case already has backend test coverage
  (`apps/users/tests/test_*`) — this spec is the golden path plus the
  handful of inline-error cases (wrong OTP, reused backup code, common
  password, reused password) visible enough in the UI to be worth a real
  browser confirming them, not a re-implementation of that test suite.
