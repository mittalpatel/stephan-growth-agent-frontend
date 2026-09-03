import { test, expect } from '@playwright/test';

test.describe('Auth redirect', () => {
  test('authenticated user is redirected away from /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
