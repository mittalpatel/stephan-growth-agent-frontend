/**
 * Auth setup for a user with a valid account but no role assigned.
 *
 * This is the case most apps get wrong — the user authenticates successfully and
 * then has access to nothing. They must land on `/no-role`, not on a broken
 * dashboard and not back at the login form.
 *
 * Storage state → e2e/.auth/no-access.json
 */
import { test as setup, expect } from '@playwright/test';
import path from 'node:path';

import { signIn } from './helpers';

const authFile = path.join(__dirname, '.auth/no-access.json');

setup('authenticate as no-access user', async ({ page }) => {
  const email = process.env.E2E_NO_ACCESS_EMAIL ?? '';
  const password = process.env.E2E_NO_ACCESS_PASSWORD ?? '';

  if (!email || !password) {
    throw new Error('E2E_NO_ACCESS_EMAIL and E2E_NO_ACCESS_PASSWORD must be set');
  }

  await signIn(page, email, password);

  // Authentication must succeed — it is authorization that fails for this user.
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

  await page.context().storageState({ path: authFile });
});
