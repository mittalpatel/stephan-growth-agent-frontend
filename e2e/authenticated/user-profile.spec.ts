import { test, expect } from '@playwright/test';

import { t } from '../../src/locales';
import { expectNoAuthRedirect } from '../helpers';

test.describe('User profile', () => {
  test('opens for any authenticated user', async ({ page }) => {
    await page.goto('/user-profile');
    await expect(page).toHaveURL(/\/user-profile/);
    await expectNoAuthRedirect(page);
  });

  test('shows the profile heading', async ({ page }) => {
    await page.goto('/user-profile');
    await expect(page.getByRole('heading', { name: t.userProfile.title }).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
