/**
 * API Keys: the raw secret is shown exactly once (reopening the list/dialog
 * never re-reveals it), and revoking a key immediately invalidates a real API
 * call made with it.
 *
 * `services/apiKeys.ts`'s header comment states the contract under test: "The
 * raw secret returned by `create` is never cached... must never be written
 * into a query key, the TanStack cache, or the URL." `RevealSecretDialog`
 * holds it only in local component state passed down from the mutation
 * response. The revoke check hits the real backend directly with the raw
 * `X-API-Key` header (apps/apikeys/authentication.py:34-76), which enforces
 * revocation at request-authentication time, not via a background sweep.
 *
 * Uses the DEBUG-only `seed_demo_users` fixtures (Demo Org). Runs under the
 * `rbac` Playwright project — logs in for itself.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../../src/locales';
import { loginAsNewContext } from '../../helpers';

const PASSWORD = 'Demo@12345';
const DEMO_ADMIN = 'demo.admin@example.com';
const BACKEND_URL = process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://localhost:8000';

test.describe('API keys: secret reveal-once and revoke-invalidates', () => {
  test('the raw secret is shown once and never reappears on reopen', async ({ browser }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_ADMIN, PASSWORD);
    try {
      await page.goto('/organization/api-keys');
      const keyName = `e2e-key-${Date.now()}`;

      await page.getByRole('button', { name: t.organizations.apiKeys.create.trigger }).click();
      const createDialog = page.getByRole('dialog', { name: t.organizations.apiKeys.create.title });
      await createDialog.getByLabel(t.organizations.apiKeys.create.nameLabel).fill(keyName);

      // Grant at least one permission — the form requires it (see
      // `permissionsRequired` in the locale catalog / useCreateApiKeyForm's schema).
      await page.getByRole('button', { name: t.organizations.roles.grantAction }).first().click();

      await createDialog
        .getByRole('button', { name: t.organizations.apiKeys.create.submit })
        .click();

      const revealDialog = page.getByRole('dialog', { name: t.organizations.apiKeys.reveal.title });
      await expect(revealDialog).toBeVisible({ timeout: 10_000 });
      const secretLocator = revealDialog.locator('code');
      const secret = (await secretLocator.textContent())?.trim() ?? '';
      expect(secret.length).toBeGreaterThan(10);

      await revealDialog.getByRole('button', { name: t.organizations.apiKeys.reveal.done }).click();
      await expect(revealDialog).toBeHidden();

      // The secret must not be findable anywhere on the page after dismissal
      // (list row shows only the non-secret `prefix`, never the full secret).
      await expect(page.getByText(secret, { exact: true })).toHaveCount(0);

      // Reopening the create dialog again (a fresh key) must not resurrect the
      // previous secret either — there is no "show again" affordance anywhere,
      // per RevealSecretDialog's own doc comment.
      await expect(
        page.getByRole('button', { name: t.organizations.apiKeys.create.trigger })
      ).toBeVisible();
      await expect(page.getByText(secret, { exact: true })).toHaveCount(0);

      // Cleanup: revoke the key created for this test.
      const row = page.locator('tr', { has: page.getByText(keyName) });
      await row.getByRole('button', { name: t.organizations.apiKeys.revoke }).click();
      await page.getByRole('button', { name: t.buttons.confirm }).click();
      // Scoped to this key's own row. Page-wide, this matches every revoked key
      // left behind by earlier runs (each run creates one and never deletes it),
      // so it fails on a strict-mode violation once more than one exists —
      // reporting as "the badge is missing" when in fact there were nine.
      await expect(row.getByText(t.organizations.apiKeys.status.revoked)).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await context.close();
    }
  });

  test('revoking a key immediately invalidates real API calls made with it', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_ADMIN, PASSWORD);
    try {
      await page.goto('/organization/api-keys');
      const keyName = `e2e-revoke-${Date.now()}`;

      await page.getByRole('button', { name: t.organizations.apiKeys.create.trigger }).click();
      const createDialog = page.getByRole('dialog', { name: t.organizations.apiKeys.create.title });
      await createDialog.getByLabel(t.organizations.apiKeys.create.nameLabel).fill(keyName);
      await page.getByRole('button', { name: t.organizations.roles.grantAction }).first().click();
      await createDialog
        .getByRole('button', { name: t.organizations.apiKeys.create.submit })
        .click();

      const revealDialog = page.getByRole('dialog', { name: t.organizations.apiKeys.reveal.title });
      await expect(revealDialog).toBeVisible({ timeout: 10_000 });
      const secret = (await revealDialog.locator('code').textContent())?.trim() ?? '';
      expect(secret).toBeTruthy();
      await revealDialog.getByRole('button', { name: t.organizations.apiKeys.reveal.done }).click();

      // Direct-to-backend request carrying the raw key (see
      // apps/apikeys/authentication.py's `X-API-Key` header contract). Before
      // revoking, the key authenticates (never a 401 for "invalid/revoked
      // key" — whatever it returns is an authorization/business outcome, not
      // an authentication failure).
      const beforeRes = await page.request.get(`${BACKEND_URL}/api/v1/projects/`, {
        headers: { 'X-Api-Key': secret },
      });
      expect(beforeRes.status()).not.toBe(401);

      const row = page.locator('tr', { has: page.getByText(keyName) });
      await row.getByRole('button', { name: t.organizations.apiKeys.revoke }).click();
      await page.getByRole('button', { name: t.buttons.confirm }).click();
      // Scoped to this key's own row. Page-wide, this matches every revoked key
      // left behind by earlier runs (each run creates one and never deletes it),
      // so it fails on a strict-mode violation once more than one exists —
      // reporting as "the badge is missing" when in fact there were nine.
      await expect(row.getByText(t.organizations.apiKeys.status.revoked)).toBeVisible({
        timeout: 10_000,
      });

      // Same request, same raw key, after revocation: must now be rejected at
      // authentication time — `ApiKeyAuthentication.authenticate` checks
      // `key.is_revoked` on every request (apps/apikeys/authentication.py:75-76),
      // not via a periodic sweep, so this must be immediate.
      const afterRes = await page.request.get(`${BACKEND_URL}/api/v1/projects/`, {
        headers: { 'X-Api-Key': secret },
      });
      expect(afterRes.status()).toBe(401);
    } finally {
      await context.close();
    }
  });
});
