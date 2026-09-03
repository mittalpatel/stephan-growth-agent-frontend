/**
 * Signing out a *different* device from the Active Sessions list.
 *
 * The harder half of the feature, and the half that was broken longest: revoking
 * a session blacklists its refresh token, but the other device's access token
 * stays cryptographically valid until it expires. Until the backend started
 * checking revocation at authentication time, "Sign out" on another device did
 * nothing observable there for up to an hour — which is precisely the case the
 * feature exists for (the laptop you left somewhere).
 *
 * Two real browser contexts, so these are genuinely two devices as far as the
 * backend's session list is concerned.
 *
 * The bounce used to depend entirely on `useSessions.ts`'s 10s poll (hence the
 * old 45s assertion timeout below). `useRealtimeSocket` now pushes a
 * `session_revoked` event over a WebSocket the instant the backend blacklists
 * the token, so the second device discovers it within about a second — the
 * timeout stays generous (CI jitter, ticket round-trip) but is no longer sized
 * around a polling interval.
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';

import { t } from '../../src/locales';
import { shot, signUpFreshAccount } from './helpers/actions';

const copy = t.userProfile.sessions;

const OTHER_DEVICE_UA = 'E2E-OtherDevice-ToBeSignedOut/1.0';

test.describe.configure({ mode: 'serial' });

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(t.auth.emailPlaceholder).fill(email);
  await page.getByLabel(t.auth.passwordPlaceholder, { exact: true }).fill(password);
  await page.getByRole('button', { name: t.auth.signInButton }).click();
  await expect(page).not.toHaveURL(/\/login|\/signup/, { timeout: 20_000 });
}

test('Active Sessions: signing out another device really ends it there', async ({ browser }) => {
  test.setTimeout(150_000);

  let otherContext: BrowserContext | undefined;

  try {
    otherContext = await browser.newContext({ userAgent: OTHER_DEVICE_UA });
    const otherDevice = await otherContext.newPage();

    // Signing up leaves this device authenticated, so it is already the
    // "second device" — no separate sign-in, which would only stall on a login
    // form that an authenticated context never renders. The *first* device
    // below signs in fresh in its own context, making these two genuinely
    // distinct sessions as far as the backend's list is concerned.
    const account = await test.step('a second device creates the account', async () => {
      const created = await signUpFreshAccount(otherDevice, 'other');
      // It can reach a protected page — the state we expect it to lose.
      await otherDevice.goto('/user-profile');
      await expect(otherDevice).not.toHaveURL(/\/login/, { timeout: 20_000 });
      await shot(otherDevice, 'other-01-second-device-signed-in');
      return created;
    });

    const primaryContext = await browser.newContext();
    const primary = await primaryContext.newPage();

    await test.step('the first device signs the second one out', async () => {
      await signIn(primary, account.email, account.password);
      await primary.goto('/user-profile');

      const otherRow = primary.locator('li', { hasText: OTHER_DEVICE_UA });
      await expect(otherRow).toHaveCount(1, { timeout: 20_000 });
      await shot(primary, 'other-02-both-sessions-listed');

      await otherRow.getByRole('button', { name: copy.revokeButton }).click();
      await primary.getByRole('button', { name: t.buttons.confirm }).click();

      // The row goes, and the signing-out device is of course unaffected.
      await expect(otherRow).toHaveCount(0, { timeout: 20_000 });
      await expect(primary).not.toHaveURL(/\/login/);
      await shot(primary, 'other-03-row-gone-primary-unaffected');
    });

    await test.step('the second device is bounced to /login on its own', async () => {
      // No reload, and no wait for the sessions list's own poll: the realtime
      // socket pushes the revocation and `useRealtimeSocket` calls `signOut()`
      // directly. This is the assertion that failed for as long as the access
      // token outlived the revocation.
      await expect(otherDevice).toHaveURL(/\/login/, { timeout: 8_000 });
      await shot(otherDevice, 'other-04-second-device-bounced');
    });

    await test.step('and it cannot reopen a protected page', async () => {
      await otherDevice.goto('/user-profile');
      await expect(otherDevice).toHaveURL(/\/login/, { timeout: 20_000 });
      await shot(otherDevice, 'other-05-second-device-locked-out');
    });

    await primaryContext.close();
  } finally {
    await otherContext?.close();
  }
});
