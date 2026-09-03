/**
 * Auth setup for the full-access role (the seeded `Admin`).
 *
 * Runs once as its own project; the browser projects depend on it and reuse the
 * saved storage state, so the login flow is exercised deliberately here rather
 * than incidentally at the start of every spec.
 *
 * Storage state → e2e/.auth/user.json (gitignored — it holds a real session).
 */
import { test as setup, expect } from '@playwright/test';
import path from 'node:path';

import { signIn } from './helpers';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate as admin', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL ?? '';
  const password = process.env.E2E_TEST_PASSWORD ?? '';

  if (!email || !password) {
    throw new Error('E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set — see .env.e2e.example');
  }

  await signIn(page, email, password);

  // Landing anywhere inside the restricted area is enough; asserting a specific
  // route would couple this to whichever page happens to be first in the nav.
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  await expect(page).not.toHaveURL(/\/no-role/, { timeout: 15_000 });

  await page.context().storageState({ path: authFile });
});
