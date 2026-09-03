/**
 * Auth setup for the seeded `Read Only` role — `widget:view` and
 * `preferences:view`, no write permissions anywhere.
 *
 * Storage state → e2e/.auth/read-only.json
 */
import { test as setup, expect } from '@playwright/test';
import path from 'node:path';

import { signIn } from './helpers';

const authFile = path.join(__dirname, '.auth/read-only.json');

setup('authenticate as read-only user', async ({ page }) => {
  const email = process.env.E2E_READ_ONLY_EMAIL ?? '';
  const password = process.env.E2E_READ_ONLY_PASSWORD ?? '';

  if (!email || !password) {
    throw new Error('E2E_READ_ONLY_EMAIL and E2E_READ_ONLY_PASSWORD must be set');
  }

  await signIn(page, email, password);
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

  await page.context().storageState({ path: authFile });
});
