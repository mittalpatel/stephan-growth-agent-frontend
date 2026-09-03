/**
 * Preferences — the two-level model.
 *
 * A preference has a session value (instant, local, ungated) and a saved default
 * (persisted, requires `preferences:manage`). These specs cover the distinction
 * and the cross-tab sync, which is the part most likely to break silently.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../src/locales';
import { settle } from '../helpers';

test.describe('Preferences page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/preferences');
  });

  test('renders without redirecting', async ({ page }) => {
    await expect(page).toHaveURL(/\/preferences/);
    await expect(page).not.toHaveURL(/\/login|\/no-role/);
  });

  test('shows the heading and at least one preference', async ({ page }) => {
    await expect(page.getByRole('heading', { name: t.preferences.title })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('switch').first()).toBeVisible({ timeout: 10_000 });
  });

  test('a toggle flips and can be restored', async ({ page }) => {
    const toggle = page.getByRole('switch').first();
    await expect(toggle).toBeVisible({ timeout: 10_000 });

    const before = await toggle.getAttribute('aria-checked');
    await toggle.click();
    await expect(toggle).not.toHaveAttribute('aria-checked', before ?? '');

    // Leave the session as it was found, so spec order cannot matter.
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', before ?? '');
  });

  test('the session value survives navigating away and back', async ({ page }) => {
    const toggle = page.getByRole('switch').first();
    const before = await toggle.getAttribute('aria-checked');
    await toggle.click();
    const flipped = await toggle.getAttribute('aria-checked');

    await page.goto('/widgets');
    await page.goto('/preferences');
    await expect(page.getByRole('switch').first()).toHaveAttribute('aria-checked', flipped ?? '', {
      timeout: 10_000,
    });

    await page.getByRole('switch').first().click();
    await expect(page.getByRole('switch').first()).toHaveAttribute('aria-checked', before ?? '');
  });

  test('a toggle in one tab applies in another without a reload', async ({ page, context }) => {
    // sessionStorage is per-tab, so this only works because of the
    // BroadcastChannel in PreferencesContext. Without it the second tab would
    // keep its stale value until reloaded.
    const toggle = page.getByRole('switch').first();
    await expect(toggle).toBeVisible({ timeout: 10_000 });
    const before = await toggle.getAttribute('aria-checked');

    const second = await context.newPage();
    await second.goto('/preferences');
    await expect(second.getByRole('switch').first()).toBeVisible({ timeout: 10_000 });

    await toggle.click();
    await settle(page);

    await expect(second.getByRole('switch').first()).not.toHaveAttribute(
      'aria-checked',
      before ?? '',
      { timeout: 10_000 }
    );

    await toggle.click();
    await second.close();
  });

  test('the save-as-default checkbox is available to a user who may manage defaults', async ({
    page,
  }) => {
    const checkbox = page.getByRole('checkbox').first();
    await expect(checkbox).toBeVisible({ timeout: 10_000 });
    await expect(checkbox).toBeEnabled();
  });
});
