/**
 * Regression: editing only the last name on /user-profile and saving must not
 * blank out the first name once the page is reloaded.
 *
 * `PersonalInfoForm` (src/app/(restricted)/user-profile/components/PersonalInfoForm.tsx)
 * submits both `first_name` and `last_name` from one React Hook Form instance
 * (`useProfileForm`), so a correct implementation always resubmits the
 * untouched field's current value alongside the edited one. This guards
 * against a regression where only the changed field is sent (e.g. a dirty-
 * fields-only diff) and the backend interprets the missing field as "clear it".
 *
 * Runs under the `rbac` Playwright project (logs in for itself, and mutates
 * its own account's profile — isolated from the shared `chromium` storage
 * state's account so it cannot corrupt other authenticated specs).
 */
import { test, expect } from '@playwright/test';

import { t } from '../../../src/locales';
import { loginAsNewContext } from '../../helpers';

const PASSWORD = 'Demo@12345';
// Read-only-role account: lowest blast radius if this test ever leaves the
// name mutated (nothing else in the suite depends on this account's name).
const ACCOUNT = 'demo.readonly@example.com';
const ORIGINAL_FIRST_NAME = 'Riley';
const ORIGINAL_LAST_NAME = 'Reader';

test.describe('Profile: partial edit does not blank the untouched field', () => {
  test.afterEach(async ({ browser }) => {
    // Restore the seeded name regardless of pass/fail, so a re-run (or the
    // next spec run) starts from the documented seed state again.
    const { context, page } = await loginAsNewContext(browser, ACCOUNT, PASSWORD);
    try {
      await page.goto('/user-profile');
      const firstNameInput = page.getByLabel(t.userProfile.firstNameLabel);
      const lastNameInput = page.getByLabel(t.userProfile.lastNameLabel);
      await firstNameInput.fill(ORIGINAL_FIRST_NAME);
      await lastNameInput.fill(ORIGINAL_LAST_NAME);
      await page.getByRole('button', { name: t.userProfile.saveButton }).click();
      await expect(page.getByText(t.userProfile.localProfileSuccess)).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await context.close();
    }
  });

  test('editing only the last name preserves the first name after save and reload', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, ACCOUNT, PASSWORD);
    try {
      await page.goto('/user-profile');

      const firstNameInput = page.getByLabel(t.userProfile.firstNameLabel);
      const lastNameInput = page.getByLabel(t.userProfile.lastNameLabel);
      await expect(firstNameInput).toHaveValue(ORIGINAL_FIRST_NAME);

      // Touch only the last name field.
      const newLastName = `Reader${Date.now()}`;
      await lastNameInput.fill(newLastName);
      await page.getByRole('button', { name: t.userProfile.saveButton }).click();
      await expect(page.getByText(t.userProfile.localProfileSuccess)).toBeVisible({
        timeout: 10_000,
      });

      // Reload from the server rather than trusting client-side form state,
      // since the bug this guards against is specifically a server-side blank.
      await page.reload();
      await expect(page.getByLabel(t.userProfile.firstNameLabel)).toHaveValue(
        ORIGINAL_FIRST_NAME,
        { timeout: 10_000 }
      );
      await expect(page.getByLabel(t.userProfile.lastNameLabel)).toHaveValue(newLastName);
    } finally {
      await context.close();
    }
  });
});
