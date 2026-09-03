/**
 * A user with a valid account and no role.
 *
 * They must land on `/no-role` with an explanation, and every restricted route
 * must refuse them. This is a UX assertion only — `ROUTE_PERMISSIONS` decides
 * what to render, and the backend independently refuses the API calls. A test
 * that passes here proves the client agrees with the server; it does not prove
 * the server is safe, which is what the backend's own permission tests are for.
 *
 * Runs under the 'chromium:no-access' project.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../src/locales';

const RESTRICTED_ROUTES = ['/widgets', '/widgets/00000000-0000-4000-8000-000000000000'];

test.describe('No-access role', () => {
  test('lands on /no-role with an explanation, not a broken page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/no-role/, { timeout: 15_000 });
    await expect(page.getByText(t.errors.noRole.title)).toBeVisible();
  });

  for (const route of RESTRICTED_ROUTES) {
    test(`redirects away from ${route}`, async ({ page }) => {
      await page.goto(route);
      // Compare the pathname rather than building a RegExp from the route — a
      // constructed pattern would need escaping, and `toHaveURL` accepts a
      // predicate, so there is no reason to build one.
      await expect(page).toHaveURL((url) => url.pathname !== route, { timeout: 15_000 });
      await expect(page).not.toHaveURL(/\/login/);
    });
  }

  test('the sidebar offers no links the user cannot use', async ({ page }) => {
    await page.goto('/no-role');
    await expect(page.getByRole('link', { name: t.navigation.widgets })).toHaveCount(0);
  });
});
