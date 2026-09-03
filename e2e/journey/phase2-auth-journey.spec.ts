/**
 * Phase 2 auth-hardening, end to end, as one continuous new-user story:
 * public signup + email verification → enable MFA (QR/manual-entry secret,
 * recovery codes) → MFA login challenge (TOTP and backup-code paths,
 * including a wrong code and a reused backup code) → self-service session
 * list + revoke → the new-device login alert → password breach/reuse
 * rejection on change-password.
 *
 * Runs against the real backend, not mocks — the two pieces with no UI-only
 * substitute (the signup verification email and the MFA authenticator app)
 * are read back the way a person would: the OTP from the account's actual
 * email (via the backend's console email backend — see README.md in this
 * folder) and the TOTP code computed from the same secret the enrollment
 * dialog shows for manual entry (`helpers/totp.ts`), not a mocked backend
 * response. Everything else is driven exactly like a normal user would.
 *
 * One test, `test.step`-per-stage: it's a single account walking through a
 * single continuous session across many pages, and splitting it into
 * independent `test()`s would mean re-deriving that state (a fresh signup, a
 * fresh MFA secret) for each one — this *is* the "like a normal user" journey
 * the request asked for, not a suite of isolated unit-style checks.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../src/locales';
import {
  expectAuthenticated,
  loginWithPassword,
  shot,
  signOutThroughHeader,
  submitBackupCode,
  submitOtpCode,
  switchToBackupCode,
} from './helpers/actions';
import { assertNoEmail, mailboxCheckpoint, waitForEmail, waitForOtp } from './helpers/mailbox';
import { currentTotp } from './helpers/totp';

test.describe.configure({ mode: 'serial' });

const RUN_ID = Date.now();
const EMAIL = `e2e-journey-${RUN_ID}@example.com`;
const FIRST_NAME = 'Journey';
const LAST_NAME = 'Tester';
const FULL_NAME = `${FIRST_NAME} ${LAST_NAME}`;
const SIGNUP_PASSWORD = 'Journey1Signup';
const CHANGED_PASSWORD = 'Sturdy9Vector';
const COMMON_PASSWORD = 'Password123';

// A per-run monotonic counter guarantees every TOTP verification in this
// journey lands on a distinct 30-second counter window, regardless of how
// fast or slow the browser actually runs each step — see totp.ts's docstring
// on why the same window twice would be rejected as a replay by django_otp,
// independent of whether the code is otherwise numerically correct.
let totpWindow = 0;
function nextTotp(secret: string): string {
  totpWindow += 1;
  return currentTotp(secret, totpWindow);
}

test('Phase 2 auth hardening: signup through password policy, as one user', async ({
  page,
  browser,
}) => {
  test.setTimeout(150_000);

  let mfaSecret = '';
  const recoveryCodes: string[] = [];

  await test.step('Public signup', async () => {
    await page.goto('/signup/create');
    await expect(page.getByRole('heading', { name: t.auth.publicSignupFlow.title })).toBeVisible();

    await page.getByLabel(t.auth.publicSignupFlow.firstNameLabel).fill(FIRST_NAME);
    await page.getByLabel(t.auth.publicSignupFlow.lastNameLabel).fill(LAST_NAME);
    await page.getByLabel(t.auth.publicSignupFlow.emailLabel).fill(EMAIL);
    await page
      .getByLabel(t.auth.publicSignupFlow.passwordLabel, { exact: true })
      .fill(SIGNUP_PASSWORD);
    await page.getByLabel(t.auth.publicSignupFlow.confirmPasswordLabel).fill(SIGNUP_PASSWORD);
    await shot(page, 'signup-details-filled');

    const checkpoint = mailboxCheckpoint();
    await page.getByRole('button', { name: t.auth.publicSignupFlow.createAccountButton }).click();

    await expect(page.getByLabel(t.auth.publicSignupFlow.otpLabel)).toBeVisible({
      timeout: 15_000,
    });
    await shot(page, 'signup-otp-step');

    const otp = await waitForOtp({
      to: EMAIL,
      subjectContains: 'Verify your email',
      since: checkpoint,
    });
    await page.getByLabel(t.auth.publicSignupFlow.otpLabel).fill(otp);
    await page.getByRole('button', { name: t.auth.publicSignupFlow.verifyCodeButton }).click();

    await expectAuthenticated(page);
    await shot(page, 'signup-verified-landed-authenticated');
  });

  await test.step('Enable MFA', async () => {
    await page.goto('/user-profile');
    await expect(page.getByRole('heading', { name: t.userProfile.title }).first()).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole('button', { name: t.userProfile.mfa.enableButton }).click();

    const dialog = page.getByRole('dialog', { name: t.userProfile.mfa.enrollDialogTitle });
    await expect(dialog).toBeVisible();
    // The manual-entry secret is a base32 string in a <code> block — the
    // same value the QR code's provisioning URI encodes (see
    // apps/users/services/mfa_service.py:MfaService.enroll). Reading it here
    // exercises the exact "can't scan? enter this key manually" path the
    // dialog's own copy documents, rather than parsing the QR image.
    mfaSecret = (await dialog.locator('code').first().textContent())?.trim() ?? '';
    expect(mfaSecret.length).toBeGreaterThan(10);
    await shot(page, 'mfa-enroll-qr-and-secret');

    await page.getByLabel(t.userProfile.mfa.codeLabel).fill(nextTotp(mfaSecret));
    await page.getByRole('button', { name: t.userProfile.mfa.confirmButton }).click();

    const codesDialog = page.getByRole('dialog', {
      name: t.userProfile.mfa.recoveryCodesDialogTitle,
    });
    await expect(codesDialog).toBeVisible({ timeout: 10_000 });
    // Read each code's own <span> rather than regexing the dialog's whole
    // textContent: the grid renders codes as adjacent <span> elements with no
    // separating whitespace in the flattened text, so a `\b`-bounded regex
    // over the concatenated string only reliably finds one match — `\b`
    // never fires between two word characters, and both a code's own last
    // character and the next code's first character are always in [a-z2-7].
    const spanTexts = await codesDialog.locator('span').allTextContents();
    const matches = spanTexts.map((s) => s.trim()).filter((s) => /^[a-z2-7]{8}$/.test(s));
    recoveryCodes.push(...matches);
    expect(recoveryCodes.length).toBeGreaterThanOrEqual(2);
    await shot(page, 'mfa-recovery-codes-revealed');

    await codesDialog.getByRole('button', { name: t.userProfile.mfa.recoveryCodesDone }).click();
    // exact:true — a still-visible success toast ("Two-factor authentication
    // is now enabled.") also contains "enabled" as a case-insensitive
    // substring, which a loose match would ambiguously match too.
    await expect(page.getByText(t.userProfile.mfa.statusEnabled, { exact: true })).toBeVisible();
  });

  await test.step('Sign out, then log back in and satisfy the MFA challenge', async () => {
    await signOutThroughHeader(page, FULL_NAME);

    await loginWithPassword(page, EMAIL, SIGNUP_PASSWORD);
    await expect(page).toHaveURL(/\/login\/otp/, { timeout: 10_000 });
    await shot(page, 'mfa-challenge-otp-step');

    await submitOtpCode(page, nextTotp(mfaSecret));
    await expectAuthenticated(page);
    await shot(page, 'mfa-challenge-passed');
  });

  await test.step('A wrong OTP shows an inline error without bouncing to /login', async () => {
    await signOutThroughHeader(page, FULL_NAME);
    await loginWithPassword(page, EMAIL, SIGNUP_PASSWORD);
    await expect(page).toHaveURL(/\/login\/otp/, { timeout: 10_000 });

    await submitOtpCode(page, '000000');
    await expect(page.getByText(t.auth.mfaFlow.codeInvalid)).toBeVisible({ timeout: 10_000 });
    // Still on the challenge step, not bounced back to re-enter credentials —
    // the whole point of the MFA_RETRY/MFA_FATAL split documented in
    // authOptions.ts.
    await expect(page).toHaveURL(/\/login\/otp/, { timeout: 10_000 });
    await shot(page, 'mfa-wrong-code-inline-error');
  });

  await test.step('Recovery code login, then that same code is refused on reuse', async () => {
    const firstCode = recoveryCodes[0];
    const secondCode = recoveryCodes[1];

    await switchToBackupCode(page);
    await shot(page, 'mfa-backup-code-step');
    await submitBackupCode(page, firstCode);
    await expectAuthenticated(page);
    await shot(page, 'mfa-backup-code-login-succeeded');

    await signOutThroughHeader(page, FULL_NAME);
    await loginWithPassword(page, EMAIL, SIGNUP_PASSWORD);
    await expect(page).toHaveURL(/\/login\/otp/, { timeout: 10_000 });
    await switchToBackupCode(page);

    // Reusing the same code: django_otp deletes a StaticToken the moment it
    // is used (security property A2), so this must be refused exactly like
    // any other wrong code — not succeed a second time.
    await submitBackupCode(page, firstCode);
    await expect(page.getByText(t.auth.mfaFlow.backupCodeInvalid)).toBeVisible({
      timeout: 10_000,
    });
    await shot(page, 'mfa-backup-code-reuse-refused');

    // A fresh, never-used code from the same batch still works, so the
    // journey can continue authenticated.
    await submitBackupCode(page, secondCode);
    await expectAuthenticated(page);
  });

  await test.step('Active Sessions lists this device, and revoking another session works', async () => {
    await page.goto('/user-profile');
    await expect(page.getByText(t.userProfile.sessions.sectionTitle)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(t.userProfile.sessions.currentBadge)).toBeVisible();
    await shot(page, 'sessions-list-this-device');

    // A second, independent browser context is a second real device from
    // the backend's point of view — its own cookies, its own login.
    const otherContext = await browser.newContext({ userAgent: 'E2E-Journey-SecondDevice/1.0' });
    const otherPage = await otherContext.newPage();
    await loginWithPassword(otherPage, EMAIL, SIGNUP_PASSWORD);
    await expect(otherPage).toHaveURL(/\/login\/otp/, { timeout: 10_000 });
    await submitOtpCode(otherPage, nextTotp(mfaSecret));
    await expectAuthenticated(otherPage);

    await page.reload();
    await expect(page.getByText(t.userProfile.sessions.sectionTitle)).toBeVisible();
    const rows = page.locator('li', { hasText: t.userProfile.sessions.revokeButton });
    await expect(rows).toHaveCount(2, { timeout: 10_000 });

    // Revoke whichever row is NOT flagged as this device — that's the
    // second context's session.
    const otherRow = rows.filter({ hasNotText: t.userProfile.sessions.currentBadge }).first();
    await otherRow.getByRole('button', { name: t.userProfile.sessions.revokeButton }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await shot(page, 'sessions-revoke-confirm-dialog');
    await page.getByRole('dialog').getByRole('button', { name: t.buttons.confirm }).click();

    await expect(rows).toHaveCount(1, { timeout: 10_000 });
    await shot(page, 'sessions-after-revoke');

    await otherContext.close();
  });

  await test.step('A login from a new device triggers the new-device alert; a repeat from the same one does not', async () => {
    const newDeviceContext = await browser.newContext({
      userAgent: 'E2E-Journey-NewDeviceAlertCheck/1.0',
    });
    const newDevicePage = await newDeviceContext.newPage();

    const checkpoint = mailboxCheckpoint();
    await loginWithPassword(newDevicePage, EMAIL, SIGNUP_PASSWORD);
    await expect(newDevicePage).toHaveURL(/\/login\/otp/, { timeout: 10_000 });
    await submitOtpCode(newDevicePage, nextTotp(mfaSecret));
    await expectAuthenticated(newDevicePage);
    await shot(newDevicePage, 'new-device-login-succeeded');

    await waitForEmail({
      to: EMAIL,
      subjectContains: 'New sign-in to your account',
      since: checkpoint,
    });

    // Logging out and back in from the SAME (now-familiar) device/browser
    // context must not repeat the alert.
    await signOutThroughHeader(newDevicePage, FULL_NAME);
    const repeatCheckpoint = mailboxCheckpoint();
    await loginWithPassword(newDevicePage, EMAIL, SIGNUP_PASSWORD);
    await expect(newDevicePage).toHaveURL(/\/login\/otp/, { timeout: 10_000 });
    await submitOtpCode(newDevicePage, nextTotp(mfaSecret));
    await expectAuthenticated(newDevicePage);

    await assertNoEmail({
      to: EMAIL,
      subjectContains: 'New sign-in to your account',
      since: repeatCheckpoint,
    });

    await newDeviceContext.close();
  });

  await test.step('Password policy: a common password is refused, a strong one succeeds, reuse is refused', async () => {
    await page.goto('/user-profile');
    await expect(page.getByRole('heading', { name: t.userProfile.title }).first()).toBeVisible();

    await page.getByLabel(t.userProfile.currentPasswordLabel).fill(SIGNUP_PASSWORD);
    await page.getByLabel(t.userProfile.newPasswordLabel, { exact: true }).fill(COMMON_PASSWORD);
    await page.getByLabel(t.userProfile.confirmPasswordLabel).fill(COMMON_PASSWORD);
    await page.getByRole('button', { name: t.userProfile.changePasswordButton }).click();

    // Django's built-in CommonPasswordValidator is always active regardless
    // of HIBP_ENABLED — this is the one password-policy rejection guaranteed
    // to fire in every environment, including one with HIBP off (the
    // default). The exact wording is the backend's own, untranslated by this
    // frontend's catalog, since it's Django's message, not ours.
    await expect(page.getByText('This password is too common.')).toBeVisible({ timeout: 10_000 });
    await shot(page, 'password-change-common-password-refused');

    await page.getByLabel(t.userProfile.newPasswordLabel, { exact: true }).fill(CHANGED_PASSWORD);
    await page.getByLabel(t.userProfile.confirmPasswordLabel).fill(CHANGED_PASSWORD);
    await page.getByRole('button', { name: t.userProfile.changePasswordButton }).click();
    await expect(page.getByText(t.userProfile.localPasswordSuccess)).toBeVisible({
      timeout: 10_000,
    });
    await shot(page, 'password-change-succeeded');

    // Reusing the original signup password — no longer the *current* one,
    // so the client-side "must differ from current" check doesn't catch
    // this; only the backend's history table does (Slice E).
    await page.getByLabel(t.userProfile.currentPasswordLabel).fill(CHANGED_PASSWORD);
    await page.getByLabel(t.userProfile.newPasswordLabel, { exact: true }).fill(SIGNUP_PASSWORD);
    await page.getByLabel(t.userProfile.confirmPasswordLabel).fill(SIGNUP_PASSWORD);
    await page.getByRole('button', { name: t.userProfile.changePasswordButton }).click();

    await expect(
      page.getByText(
        "You've used this password before. Please choose a password you haven't used recently."
      )
    ).toBeVisible({ timeout: 10_000 });
    await shot(page, 'password-change-reuse-refused');
  });
});
