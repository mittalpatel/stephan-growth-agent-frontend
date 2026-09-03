/**
 * The "Sign out" button in Active Sessions, exercised the way the bug report
 * described it: on a session that has already rotated its refresh token, which
 * is what every real session older than one access-token lifetime looks like.
 *
 * Before the fix the button was inert on your own device — `is_current` was
 * false for every row once rotation had happened, so the page never cleared the
 * local auth cookie and the user stayed signed in.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../src/locales';
import { shot, signUpFreshAccount } from './helpers/actions';

const copy = t.userProfile.sessions;

test.describe.configure({ mode: 'serial' });

test('Active Sessions: signing out the current device really signs you out', async ({ page }) => {
  test.setTimeout(120_000);

  await test.step('sign up and land authenticated', async () => {
    await signUpFreshAccount(page, 'signout');
    await shot(page, 'signout-01-signed-in');
  });

  await test.step('force a refresh-token rotation, as an hour-old session would have', async () => {
    // Hitting the same same-origin route axiosAuth's 401 handler uses, so the
    // session cookie is rewritten with the rotated token exactly as in real use.
    const status = await page.evaluate(async () => {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      return res.status;
    });
    expect(status).toBe(200);
  });

  await test.step('the rotated session still shows as "This device"', async () => {
    await page.goto('/user-profile');
    const currentRow = page.locator('li', { hasText: copy.currentBadge });
    await expect(currentRow).toHaveCount(1, { timeout: 20_000 });
    await shot(page, 'signout-02-current-badge-after-rotation');
  });

  await test.step('signing it out returns to /login and stays there', async () => {
    const currentRow = page.locator('li', { hasText: copy.currentBadge });
    await currentRow.getByRole('button', { name: copy.revokeButton }).click();
    await page.getByRole('button', { name: t.buttons.confirm }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 25_000 });
    await shot(page, 'signout-03-back-at-login');

    // The real test of "signed out": the protected page must not open again.
    await page.goto('/user-profile');
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
    await shot(page, 'signout-04-protected-page-refuses');
  });
});
