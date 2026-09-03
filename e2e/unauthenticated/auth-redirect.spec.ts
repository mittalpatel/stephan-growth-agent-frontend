import { test, expect } from '@playwright/test';

/**
 * Guests are redirected off restricted routes.
 *
 * Runs under the `unauthenticated` project, which carries no storageState. The
 * redirect comes from `src/proxy.ts` — this is the check that the middleware is
 * actually wired, which a unit test cannot establish.
 */
const RESTRICTED_ROUTES = ['/widgets', '/preferences', '/dashboard', '/user-profile'];

for (const route of RESTRICTED_ROUTES) {
  test(`unauthenticated access to ${route} redirects to /login`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
}

test('the public legal pages stay reachable without a session', async ({ page }) => {
  await page.goto('/legal/privacy-policy');
  await expect(page).not.toHaveURL(/\/login/);
});
