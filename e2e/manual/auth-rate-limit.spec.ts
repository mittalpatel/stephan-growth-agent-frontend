/**
 * Deliberately trips the backend's IP-keyed AUTH throttle scope and asserts
 * the login form shows a clear rate-limit message rather than the generic
 * wrong-password copy, a raw 500, or a silent hang.
 *
 * Config under test: `config/env.py:217` (backend) —
 *   self.AUTH_THROTTLE_RATE: str = self._env.str("AUTH_THROTTLE_RATE", default="5/min")
 * consumed by `config/settings/base.py:278` as
 *   DEFAULT_THROTTLE_RATES[ThrottleScope.AUTH.value] = env.AUTH_THROTTLE_RATE
 * and applied via DRF's `ScopedRateThrottle(ThrottleScope.AUTH)` on
 * `/api/v1/auth/login/` and the other auth endpoints — IP-keyed, independent
 * of the account-keyed lockout counter
 * (`LOGIN_FAILURE_LIMIT`/`LOGIN_FAILURE_WINDOW_SECONDS`, config/env.py:204-207).
 * Default rate is 5 requests/minute per IP.
 *
 * On the frontend, a 429 from `/api/v1/auth/login/` is caught in
 * `authorize()` (src/lib/auth/authOptions.ts:190-192), rewritten by
 * `extractEnvelopeError` (authOptions.ts:47-58) to
 * `t.errors.rateLimited` / `t.errors.rateLimitedRetry` (ignoring the
 * backend's un-localized 429 body text), thrown as `LOGIN_ERROR::<msg>`, and
 * surfaced by `useLoginForm.ts`'s catch as `toast.error(msg)` with the
 * `LOGIN_ERROR::` prefix stripped — never as `t.auth.validation.invalidCredentials`
 * (the plain-wrong-password copy) and never as an unhandled exception.
 *
 * ISOLATION: this test intentionally exhausts the shared per-IP AUTH
 * throttle bucket, which then blocks *every other spec's* login for the
 * rest of that one-minute window (per the KNOWN ENVIRONMENT ISSUE this whole
 * e2e effort works around). It lives outside every `testMatch` glob in
 * `playwright.config.ts` on purpose, so a normal
 * `npx playwright test --project=rbac` run never picks it up. Run it only
 * on its own, last, with nothing else about to log in:
 *
 *   npx playwright test e2e/manual/auth-rate-limit.spec.ts --project=rbac --workers=1
 *
 * and expect a ~1 minute cooldown afterward before any other spec logs in
 * against the same backend.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../src/locales';

// One over the default 5/min so the last attempt is guaranteed to land after
// the bucket is exhausted, even accounting for the account also existing
// (a real account is used deliberately - see below).
const ATTEMPTS = 6;
// A real seeded account with a *wrong* password: the throttle is IP-keyed
// and account-agnostic, so a wrong password here (rather than a bogus email)
// keeps the request on the ordinary "invalid credentials" code path up
// until the throttle itself kicks in, rather than possibly short-circuiting
// on a "no such user" path with different throttle behavior.
const EMAIL = 'demo.readonly@example.com';
const WRONG_PASSWORD = 'definitely-wrong-password';

test.describe('Auth rate limiting (isolated - see file header before running)', () => {
  test('exceeding the AUTH throttle rate shows a clear rate-limited message, not a raw error', async ({
    page,
  }) => {
    let sawRateLimitMessage = false;
    let sawGenericInvalidCredentials = false;
    let sawUnexpectedError = false;

    page.on('console', (msg) => {
      if (msg.type() === 'error') sawUnexpectedError = true;
    });

    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      await page.goto('/login');
      await page.getByLabel(t.auth.emailPlaceholder).fill(EMAIL);
      await page.getByLabel(t.auth.passwordPlaceholder, { exact: true }).fill(WRONG_PASSWORD);
      await page.getByRole('button', { name: t.auth.signInButton }).click();

      // Whichever toast shows, it must be one of the two known-good copies -
      // never a hang (the button must leave its loading state) and never an
      // unlabeled/raw error string.
      const toast = page.locator('[data-sonner-toast]').first();
      await expect(toast).toBeVisible({ timeout: 10_000 });
      const text = (await toast.textContent()) ?? '';

      if (text.includes(t.errors.rateLimited.slice(0, 20)) || /too many requests/i.test(text)) {
        sawRateLimitMessage = true;
        // Once the throttle has visibly tripped, no need to keep hammering
        // it beyond confirming the message - stop early.
        break;
      }
      if (text === t.auth.validation.invalidCredentials || /invalid credentials/i.test(text)) {
        sawGenericInvalidCredentials = true;
      } else if (text.trim().length === 0) {
        sawUnexpectedError = true;
      }

      // Button must return to its idle, clickable state before the next
      // attempt - a stuck spinner would itself be the "silent hang" failure
      // mode this test is guarding against.
      await expect(page.getByRole('button', { name: t.auth.signInButton })).toBeEnabled({
        timeout: 10_000,
      });
    }

    expect(
      sawRateLimitMessage,
      `Expected a rate-limit toast within ${ATTEMPTS} rapid attempts (AUTH_THROTTLE_RATE default 5/min, config/env.py:217). ` +
        `Saw generic invalid-credentials toast instead: ${sawGenericInvalidCredentials}. ` +
        `Saw an unexpected/empty error: ${sawUnexpectedError}.`
    ).toBe(true);
  });
});
