/**
 * Forgot-password flow — step 1 (email) only.
 *
 * The reset requires a real 6-digit code delivered to the account's inbox, so
 * the OTP and new-password steps can't complete in an automated run. We cover
 * the email step's UI + validation and the transition behavior after submit,
 * without ever attempting to enter a code.
 *
 * Every string comes from `src/locales` rather than being typed literally, per
 * this repo's own convention (`AGENTS.md`). The previous version of this file
 * hardcoded *Spanish* copy ("restablece tu contraseña", "Correo electrónico")
 * against an app whose only catalog is English and whose `DEFAULT_LANGUAGE` is
 * `'en'` — almost certainly carried over from one of the two source apps this
 * template was extracted from. Every assertion in it failed, and it runs in
 * the default `unauthenticated` project, so the suite was red before anyone
 * changed a line of product code.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../src/locales';

const copy = t.auth.forgotPasswordFlow;

test.describe('Forgot-password page (step 1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test('renders the email step with heading and field', async ({ page }) => {
    // `AuthHeroShell` renders its `title` as a real <h1>, so this is a genuine
    // heading role (unlike the shadcn `CardTitle` <div>s used elsewhere).
    await expect(page.getByRole('heading', { name: copy.title })).toBeVisible();
    await expect(page.getByLabel(copy.emailLabel)).toBeVisible();
    await expect(page.getByRole('button', { name: copy.sendCodeButton })).toBeVisible();
  });

  test('empty submit shows the required-email validation', async ({ page }) => {
    // The form is `noValidate`, so the browser does not block submit and the
    // zod resolver's message is what renders — no need to rewrite the input
    // type to defeat HTML5 validation the way this test used to.
    await page.getByRole('button', { name: copy.sendCodeButton }).click();
    await expect(page.getByText(t.auth.validation.email)).toBeVisible();
  });

  test('malformed email shows the format validation', async ({ page }) => {
    await page.getByLabel(copy.emailLabel).fill('not-an-email');
    await page.getByRole('button', { name: copy.sendCodeButton }).click();
    await expect(page.getByText(t.auth.validation.email)).toBeVisible();
  });

  test('back-to-login link returns to /login', async ({ page }) => {
    await page.getByRole('link', { name: copy.backToLogin }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('submitting a valid email does not crash the page', async ({ page }) => {
    await page.getByLabel(copy.emailLabel).fill('e2e-unknown@example.com');
    await page.getByRole('button', { name: copy.sendCodeButton }).click();
    // The backend answers the same way whether or not the account exists (it
    // must not confirm which addresses are registered), so this asserts the
    // page stayed functional rather than which step it advanced to. Never
    // enters an OTP.
    await expect(page.getByRole('heading', { name: copy.title })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});
