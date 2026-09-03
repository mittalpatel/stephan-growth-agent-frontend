/**
 * The read-only role.
 *
 * The seeded `Read Only` role holds `widget:view` and `preferences:view` and
 * nothing else. What matters here is the *pair* of assertions: the page opens,
 * and the write affordances are absent. Testing only the first would pass for a
 * role that could also delete everything.
 *
 * Runs under the 'chromium:read-only' project.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../src/locales';
import { expectNoAuthRedirect } from '../helpers';

test.describe('Read-only: granted pages', () => {
  test('can open the widgets list', async ({ page }) => {
    await page.goto('/widgets');
    await expect(page).toHaveURL(/\/widgets/);
    await expectNoAuthRedirect(page);
  });

  test('the widgets list renders, empty dataset or not', async ({ page }) => {
    await page.goto('/widgets');
    await expect(page.locator('table').or(page.getByText(t.widgets.list.emptyTitle))).toBeVisible({
      timeout: 15_000,
    });
  });

  test('can open preferences', async ({ page }) => {
    await page.goto('/preferences');
    await expect(page).toHaveURL(/\/preferences/);
    await expectNoAuthRedirect(page);
  });
});

test.describe('Read-only: withheld affordances', () => {
  test('no create button on the widgets list', async ({ page }) => {
    await page.goto('/widgets');
    await expect(page.getByRole('button', { name: t.widgets.actions.create })).toHaveCount(0);
  });

  test('can change a preference for the session but not save it as a default', async ({ page }) => {
    await page.goto('/preferences');

    // The session toggle is ungated on purpose — a read-only user may still
    // change how their own screen behaves right now.
    await expect(page.getByRole('switch').first()).toBeEnabled();

    // Persisting it is what requires `preferences:manage`.
    await expect(page.getByRole('checkbox').first()).toBeDisabled();
    await expect(page.getByText(t.preferences.noPermission).first()).toBeVisible();
  });
});
