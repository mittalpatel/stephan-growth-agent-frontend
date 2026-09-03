import { test, expect } from '@playwright/test';

import { t } from '../../src/locales';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders the form', async ({ page }) => {
    await expect(page.getByLabel(t.auth.emailPlaceholder)).toBeVisible();
    await expect(page.getByLabel(t.auth.passwordPlaceholder)).toBeVisible();
    await expect(page.getByRole('button', { name: t.auth.signInButton })).toBeVisible();
  });

  test('shows a validation error on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: t.auth.signInButton }).click();
    await expect(page.getByText(t.auth.validation.email)).toBeVisible();
  });

  test('shows a validation error for a malformed email', async ({ page }) => {
    // The form sets `noValidate`, so the browser does not intercept the submit
    // and Zod is what actually reports the problem — which is the behaviour
    // worth testing, since it is the same path a paste or autofill takes.
    await page.getByLabel(t.auth.emailPlaceholder).fill('plainstring');
    await page.getByLabel(t.auth.passwordPlaceholder).fill('password123');
    await page.getByRole('button', { name: t.auth.signInButton }).click();
    await expect(page.getByText(t.auth.validation.email)).toBeVisible();
  });

  test('shows a validation error for a too-short password', async ({ page }) => {
    await page.getByLabel(t.auth.emailPlaceholder).fill('user@example.com');
    await page.getByLabel(t.auth.passwordPlaceholder).fill('abc');
    await page.getByRole('button', { name: t.auth.signInButton }).click();
    await expect(page.getByText(t.auth.validation.passwordLength)).toBeVisible();
  });

  test('toggles password visibility', async ({ page }) => {
    const input = page.getByLabel(t.auth.passwordPlaceholder);
    await input.fill('mysecret');
    await expect(input).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: t.auth.showPassword }).click();
    await expect(input).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: t.auth.hidePassword }).click();
    await expect(input).toHaveAttribute('type', 'password');
  });

  test('links to the legal pages', async ({ page }) => {
    await expect(page.getByRole('link', { name: t.legal.privacyLinkLabel })).toBeVisible();
    await expect(page.getByRole('link', { name: t.legal.termsLinkLabel })).toBeVisible();
  });

  test('forgot-password link opens the reset flow', async ({ page }) => {
    await page.getByRole('link', { name: t.auth.forgotPassword }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(
      page.getByRole('heading', { name: t.auth.forgotPasswordFlow.title })
    ).toBeVisible();
  });

  test('wrong credentials keep the user on /login', async ({ page }) => {
    await page.getByLabel(t.auth.emailPlaceholder).fill('nobody@example.com');
    await page.getByLabel(t.auth.passwordPlaceholder).fill('definitely-wrong-pass');
    await page.getByRole('button', { name: t.auth.signInButton }).click();

    // `expect` polls, so this synchronizes on observable state rather than a
    // fixed sleep — no arbitrary timeout to tune.
    await expect(page.getByLabel(t.auth.passwordPlaceholder)).toBeVisible();
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
