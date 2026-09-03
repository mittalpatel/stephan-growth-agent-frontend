/**
 * Shared step helpers for the Phase 2 auth-hardening journey spec, kept
 * separate from `e2e/helpers.ts` since they're specific to this one long
 * story (signup → MFA → sessions → password policy) rather than reusable
 * across the whole suite.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';

import { t } from '../../../src/locales';
import { signIn } from '../../helpers';
import { mailboxCheckpoint, waitForOtp } from './mailbox';

const SCREENSHOT_DIR = path.join(__dirname, '..', 'artifacts', 'screenshots');
mkdirSync(SCREENSHOT_DIR, { recursive: true });

let screenshotCounter = 0;

/** A numbered, named screenshot — the narrative record of the whole run,
 * distinct from Playwright's own per-test video/trace (see playwright.config.ts's
 * `journey` project, which records those for every run, not just failures). */
export async function shot(page: Page, name: string): Promise<void> {
  screenshotCounter += 1;
  const fileName = `${String(screenshotCounter).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, fileName), fullPage: true });
}

/** Sign in with just credentials — lands on the dashboard for an account
 * with no MFA, or on /login/otp for one that has it enabled. Thin re-export
 * of the shared `signIn` so every step in this journey reads as one
 * vocabulary; kept as its own name here since "with password" is the
 * meaningful contrast against the MFA-challenge steps that follow it. */
export const loginWithPassword = signIn;

/** Enter a TOTP code on /login/otp. */
export async function submitOtpCode(page: Page, code: string) {
  await page.getByLabel(t.auth.mfaFlow.codeLabel).fill(code);
  await page.getByRole('button', { name: t.auth.mfaFlow.verifyButton }).click();
}

/** Switch from /login/otp to /login/backup-code via the in-page link, the
 * way a user who can't reach their authenticator app actually would. */
export async function switchToBackupCode(page: Page) {
  await page.getByRole('link', { name: t.auth.mfaFlow.useBackupCode }).click();
  await expect(page).toHaveURL(/\/login\/backup-code/, { timeout: 10_000 });
}

/** Enter a recovery code on /login/backup-code. */
export async function submitBackupCode(page: Page, code: string) {
  await page.getByLabel(t.auth.mfaFlow.backupCodeLabel).fill(code);
  await page.getByRole('button', { name: t.auth.mfaFlow.verifyButton }).click();
}

/** Sign out through the real header menu — `fullName` disambiguates the
 * profile-menu trigger button, since it carries no aria-label of its own. */
export async function signOutThroughHeader(page: Page, fullName: string) {
  // A plain string `name` filter does a case-insensitive substring match
  // against the accessible name — no regex needed to disambiguate the
  // profile-menu trigger, which has no aria-label of its own but does
  // render the signed-in user's full name as visible text.
  await page.getByRole('button', { name: fullName }).click();
  await page.getByRole('menuitem', { name: t.header.signOut }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
}

/** Assert the page landed somewhere inside the authenticated app, not on an
 * auth wall.
 *
 * Deliberately does NOT exclude `/no-role` the way
 * `e2e/helpers.ts:expectNoAuthRedirect` does for other specs: this journey's
 * account is created via public self-signup, and in a multi-tenant backend
 * (`MULTI_TENANT_ENABLED=true` — this dev environment's own setting) that
 * path explicitly leaves the account with no organization or role (see
 * `AuthService.register_public`'s docstring) rather than auto-joining it to
 * one. `/no-role` here means "authenticated, no org yet," not "not signed
 * in" — the two are easy to conflate since both bounce away from the
 * requested page, but only `/login` (and its OTP/backup-code steps) and
 * `/signup` mean the credential/MFA step itself failed, which is the only
 * thing each step in this journey is actually checking. */
export async function expectAuthenticated(page: Page) {
  await expect(page).not.toHaveURL(/\/login|\/signup/, { timeout: 15_000 });
}

/** Create and verify a brand-new account through the real public-signup UI.
 *
 * Session specs need a working account but shouldn't depend on one existing in
 * the developer's database — a hand-seeded login is exactly the kind of hidden
 * prerequisite that makes a suite fail for the next person (and did: an earlier
 * version of these specs broke the moment its account was cleaned up). Signing
 * up for real also keeps them honest about the flow they build on.
 *
 * Requires the backend's console email backend, like every other spec in this
 * folder — see README.md.
 */
export async function signUpFreshAccount(
  page: Page,
  labelPrefix: string
): Promise<{ email: string; password: string; fullName: string }> {
  const email = `e2e-${labelPrefix}-${Date.now()}@example.com`;
  const password = 'Journey1Signup';
  const firstName = 'Session';
  const lastName = 'Probe';

  const signup = t.auth.publicSignupFlow;
  await page.goto('/signup/create');
  await page.getByLabel(signup.firstNameLabel).fill(firstName);
  await page.getByLabel(signup.lastNameLabel).fill(lastName);
  await page.getByLabel(signup.emailLabel).fill(email);
  await page.getByLabel(signup.passwordLabel, { exact: true }).fill(password);
  await page.getByLabel(signup.confirmPasswordLabel).fill(password);

  const checkpoint = mailboxCheckpoint();
  await page.getByRole('button', { name: signup.createAccountButton }).click();
  await expect(page.getByLabel(signup.otpLabel)).toBeVisible({ timeout: 15_000 });

  const otp = await waitForOtp({
    to: email,
    subjectContains: 'Verify your email',
    since: checkpoint,
  });
  await page.getByLabel(signup.otpLabel).fill(otp);
  await page.getByRole('button', { name: signup.verifyCodeButton }).click();
  await expectAuthenticated(page);

  return { email, password, fullName: `${firstName} ${lastName}` };
}
