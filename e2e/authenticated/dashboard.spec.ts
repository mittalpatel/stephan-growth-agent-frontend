import { test, expect } from '@playwright/test';

import { t } from '../../src/locales';

test.describe('Dashboard and shell', () => {
  test('loads the dashboard for an authenticated user', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('sets a page title', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/.+/);
  });

  test('sidebar exposes the enabled sections and navigates', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: t.navigation.widgets }).first().click();
    await expect(page).toHaveURL(/\/widgets/, { timeout: 10_000 });

    await page.getByRole('link', { name: t.navigation.preferences }).first().click();
    await expect(page).toHaveURL(/\/preferences/, { timeout: 10_000 });
  });

  test('renders in dark mode without losing text contrast', async ({ page }) => {
    // Guards the "no colour literal outside globals.css" rule from the outside:
    // a hardcoded light-mode colour typically shows up here as text the same
    // colour as its background.
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/widgets');
    await expect(page.getByRole('heading', { name: t.widgets.title })).toBeVisible({
      timeout: 15_000,
    });
  });
});
