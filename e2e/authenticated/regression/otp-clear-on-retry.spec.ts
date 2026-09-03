/**
 * Regression: retyping into the 6-box OTP input after a failed attempt must
 * never scramble/concatenate with the boxes' old digits.
 *
 * `src/components/ui/otp-input.tsx` documents the original bug in its
 * `maxLength` comment (lines 135-146): each box previously accepted `length`
 * (6) native keystrokes before React's controlled re-render clamped it back
 * down, so retyping into an already-filled box without first backspacing fell
 * into the multi-char/paste-redistribution branch and scrambled the whole
 * sequence — "345122" typed over a previous attempt produced "300451". The
 * fix is `maxLength={1}` per box; this spec guards against it regressing.
 *
 * Exercised via the MFA-enrollment dialog (`MfaEnrollDialog`, on the Security
 * tab of /user-profile) rather than a real MFA challenge: enrollment is
 * reachable by any authenticated seeded account and uses the exact same
 * `OtpInput` component and `length=6` default as the real login-time
 * challenge (`MfaVerifyForm`), so the input-level behavior under test is
 * identical without needing an MFA-enabled account.
 *
 * Runs under the `rbac` Playwright project (logs in for itself).
 */
import { test, expect } from '@playwright/test';

import { t } from '../../../src/locales';
import { loginAsNewContext } from '../../helpers';

const PASSWORD = 'Demo@12345';
const ACCOUNT = 'demo.member@example.com';

async function openOtpBoxes(page: import('@playwright/test').Page) {
  await page.goto('/user-profile');
  await page.getByRole('tab', { name: t.userProfile.tabs.security }).click();
  await page.getByRole('button', { name: t.userProfile.mfa.enableButton }).click();
  await expect(page.getByRole('dialog', { name: t.userProfile.mfa.enrollDialogTitle })).toBeVisible({
    timeout: 15_000,
  });
  return page.locator('input[data-slot="otp-input"]');
}

/**
 * `expect(locator).toHaveValues()` is documented for a multi-match locator,
 * but against this component/Playwright-version combination it throws a
 * "strict mode violation" instead of comparing per-element values (confirmed
 * live — see the run notes in the final report). Reading every box's value
 * directly with `evaluateAll` sidesteps that and asserts the same thing.
 */
async function boxValues(boxes: ReturnType<import('@playwright/test').Page['locator']>) {
  return boxes.evaluateAll((elements) => elements.map((el) => (el as HTMLInputElement).value));
}

test.describe('OTP input: retyping after a wrong attempt does not scramble digits', () => {
  test('typing over already-filled boxes replaces them in place, not scrambled', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, ACCOUNT, PASSWORD);
    try {
      const boxes = await openOtpBoxes(page);

      // Fill all six boxes with a first "wrong" attempt.
      for (let i = 0; i < 6; i++) {
        await boxes.nth(i).pressSequentially('1');
      }
      expect(await boxValues(boxes)).toEqual(['1', '1', '1', '1', '1', '1']);

      // Retype a fresh 6-digit code directly over the filled boxes, exactly
      // as a user who didn't backspace first would — each box's new keystroke
      // must replace its old digit, not append to it (the pre-fix behavior:
      // a filled box's native `maxLength` was 6, not 1, so a second keystroke
      // landed in the multi-char/paste-redistribution branch and scrambled
      // every later box).
      const retry = ['3', '4', '5', '1', '2', '2'];
      for (let i = 0; i < 6; i++) {
        await boxes.nth(i).fill(retry[i]);
      }
      expect(await boxValues(boxes)).toEqual(retry);
    } finally {
      await context.close();
    }
  });

  test('backspace clears the current box, or steps back and clears the previous one', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, ACCOUNT, PASSWORD);
    try {
      const boxes = await openOtpBoxes(page);
      for (const digit of '123456') {
        await boxes.nth('123456'.indexOf(digit)).pressSequentially(digit);
      }
      expect(await boxValues(boxes)).toEqual(['1', '2', '3', '4', '5', '6']);

      // Backspace on a filled box clears just that box (focus stays put).
      await boxes.nth(5).press('Backspace');
      await expect(boxes.nth(5)).toHaveValue('');

      // Backspace again, now on an empty box, steps back and clears box 4
      // (index 4, the box holding '5') — box 3 ('4') is untouched.
      await boxes.nth(5).press('Backspace');
      await expect(boxes.nth(4)).toHaveValue('');
      expect(await boxValues(boxes)).toEqual(['1', '2', '3', '4', '', '']);
    } finally {
      await context.close();
    }
  });

  test('arrow keys navigate between boxes without altering their values', async ({ browser }) => {
    const { context, page } = await loginAsNewContext(browser, ACCOUNT, PASSWORD);
    try {
      const boxes = await openOtpBoxes(page);
      for (const digit of '987654') {
        await boxes.nth('987654'.indexOf(digit)).pressSequentially(digit);
      }
      expect(await boxValues(boxes)).toEqual(['9', '8', '7', '6', '5', '4']);

      await boxes.nth(5).press('ArrowLeft');
      await boxes.nth(4).press('ArrowLeft');
      await expect(boxes.nth(3)).toBeFocused();

      await boxes.nth(3).press('ArrowRight');
      await expect(boxes.nth(4)).toBeFocused();

      // Navigation alone must not mutate any box's value.
      expect(await boxValues(boxes)).toEqual(['9', '8', '7', '6', '5', '4']);
    } finally {
      await context.close();
    }
  });

  test('pasting all 6 digits into any box fills every box left to right', async ({ browser }) => {
    const { context, page } = await loginAsNewContext(browser, ACCOUNT, PASSWORD);
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      const boxes = await openOtpBoxes(page);

      await page.evaluate((text) => navigator.clipboard.writeText(text), '246810');
      // handlePaste (otp-input.tsx:100-113) redistributes starting from the
      // box actually focused when the paste happens — pasting the full code
      // into box 0 is the common case a user hits (paste right after opening
      // the dialog, cursor already in the first box).
      await boxes.nth(0).click();
      await boxes.nth(0).press('Control+V');

      expect(await boxValues(boxes)).toEqual(['2', '4', '6', '8', '1', '0']);
    } finally {
      await context.close();
    }
  });
});
