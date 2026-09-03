/**
 * Organization Settings (`/organization`, `OrganizationSettingsView.tsx`):
 * the danger-zone delete control is Owner-only, ordinary name/detail editing
 * is shared by Owner and Admin, and the gating is real RBAC enforcement, not
 * just a hidden button.
 *
 * `OrganizationSettingsView.tsx` gates two independent things on two
 * independent permission codes, both read from `usePermissions()`:
 *   - `canManage = can('organization', 'manage')` guards the name field
 *     being enabled and the Save button rendering at all (lines 22, 42, 54).
 *   - `canDelete = can('organization', 'delete')` guards the entire danger
 *     zone `<section>` rendering (lines 23, 63).
 * `apps/rbac/seed_data.py` seeds the Admin role with `organization:manage`
 * but deliberately withholds `organization:delete` / `:billing` / `:transfer`
 * (see that file's module docstring) - Admin should see and use the name
 * field, but never the danger zone.
 *
 * The danger zone now also has a "Transfer ownership" control
 * (`useTransferOwnershipForm.ts`), gated on `canTransfer = can('organization',
 * 'transfer')` — Owner-only, same as delete. `organization:billing` remains
 * seed-data-only with no view and no UI behind it in this build; that one is
 * still an intentional gap, not something this spec covers.
 *
 * The API-level check hits the real backend delete route directly as Admin
 * (bypassing the UI entirely) and asserts 403, per
 * `OrganizationDetailView.method_permissions["DELETE"] = [Perm.ORGANIZATION_DELETE]`
 * (apps/organizations/api/v1/views/organizations.py:109) - proving the block
 * is enforced server-side, not merely UI-hidden. It never actually deletes
 * the seeded Demo Org.
 *
 * Uses the DEBUG-only `seed_demo_users` fixtures (Demo Org). Runs under the
 * `rbac` Playwright project - logs in for itself.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../../src/locales';
import { loginAsNewContext } from '../../helpers';

const PASSWORD = 'Demo@12345';
const DEMO_OWNER = 'demo.owner@example.com';
const DEMO_ADMIN = 'demo.admin@example.com';

test.describe('Organization settings: owner-only danger zone, shared name edit', () => {
  test('Owner sees and can use the danger-zone delete control', async ({ browser }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      await page.goto('/organization');
      await expect(
        page.getByRole('heading', { name: t.organizations.dangerZone.title })
      ).toBeVisible({
        timeout: 10_000,
      });
      const deleteButton = page.getByRole('button', {
        name: t.organizations.dangerZone.deleteAction,
      });
      await expect(deleteButton).toBeVisible();

      // Confirm the control actually opens the confirm dialog (real
      // affordance, not dead markup) - then back out without deleting the
      // seeded Demo Org other specs depend on.
      await deleteButton.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5_000 });
      await expect(dialog.getByText(t.organizations.dangerZone.deleteConfirmBody)).toBeVisible();
      await page.getByRole('button', { name: t.buttons.cancel }).click();
      await expect(dialog).toBeHidden();
    } finally {
      await context.close();
    }
  });

  test('Owner can transfer ownership to another member, and it takes effect immediately', async ({
    browser,
  }) => {
    const owner = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      await owner.page.goto('/organization');
      await expect(
        owner.page.getByRole('button', { name: t.organizations.dangerZone.transferAction })
      ).toBeDisabled();

      await owner.page
        .getByLabel(t.organizations.dangerZone.memberLabel)
        .selectOption({ label: 'Aaron Admin (demo.admin@example.com)' });
      await expect(
        owner.page.getByRole('button', { name: t.organizations.dangerZone.transferAction })
      ).toBeEnabled();
      await owner.page
        .getByRole('button', { name: t.organizations.dangerZone.transferAction })
        .click();

      const dialog = owner.page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5_000 });
      await dialog.getByRole('button', { name: t.buttons.confirm }).click();
      await expect(owner.page.getByText(t.organizations.dangerZone.transferred)).toBeVisible({
        timeout: 10_000,
      });

      try {
        // The former Owner is now Admin — reload to pick up the refreshed
        // permission set (`router.refresh()` in the hook) and confirm the
        // danger zone is gone for them, same as any other Admin.
        await owner.page.reload();
        await expect(
          owner.page.getByRole('heading', { name: t.organizations.dangerZone.title })
        ).toHaveCount(0, { timeout: 10_000 });
      } finally {
        // Revert: log in as the new Owner (was Admin) and transfer back, so
        // the seed's Owner/Admin split stays exactly as documented for every
        // other spec that depends on it.
        const newOwner = await loginAsNewContext(browser, DEMO_ADMIN, PASSWORD);
        try {
          await newOwner.page.goto('/organization');
          await newOwner.page
            .getByLabel(t.organizations.dangerZone.memberLabel)
            .selectOption({ label: 'Olivia Owner (demo.owner@example.com)' });
          await newOwner.page
            .getByRole('button', { name: t.organizations.dangerZone.transferAction })
            .click();
          await newOwner.page
            .getByRole('dialog')
            .getByRole('button', { name: t.buttons.confirm })
            .click();
          // Waited on, not asserted — see the name-edit tests below for why.
          await newOwner.page
            .getByText(t.organizations.dangerZone.transferred)
            .waitFor({ timeout: 10_000 })
            .catch(() => {});
        } finally {
          await newOwner.context.close();
        }
      }
    } finally {
      await owner.context.close();
    }
  });

  test('Admin does not see the transfer-ownership control', async ({ browser }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_ADMIN, PASSWORD);
    try {
      await page.goto('/organization');
      await expect(page.getByRole('heading', { name: t.organizations.settings.title })).toBeVisible(
        {
          timeout: 10_000,
        }
      );
      await expect(page.getByLabel(t.organizations.dangerZone.memberLabel)).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: t.organizations.dangerZone.transferAction })
      ).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('Admin hitting the transfer-ownership API directly gets 403', async ({ browser }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_ADMIN, PASSWORD);
    try {
      const sessionResponse = await page.request.get('/api/auth/session');
      const session = await sessionResponse.json();
      const organizationId = session?.user?.organization?.id;
      expect(organizationId).toBeTruthy();

      const membersResponse = await page.request.get(
        `/api/backend/api/v1/organizations/${organizationId}/members/`
      );
      const members = (await membersResponse.json())?.data ?? [];
      const target = members.find((m: { email: string }) => m.email !== DEMO_ADMIN);
      expect(target, 'expected at least one other member to target').toBeTruthy();

      const response = await page.request.post(
        `/api/backend/api/v1/organizations/${organizationId}/transfer-ownership/`,
        { data: { user_id: target.user_id }, failOnStatusCode: false }
      );
      expect(response.status()).toBe(403);
    } finally {
      await context.close();
    }
  });

  test('Admin does not see the danger-zone delete control', async ({ browser }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_ADMIN, PASSWORD);
    try {
      await page.goto('/organization');
      await expect(page.getByRole('heading', { name: t.organizations.settings.title })).toBeVisible(
        {
          timeout: 10_000,
        }
      );
      await expect(
        page.getByRole('heading', { name: t.organizations.dangerZone.title })
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: t.organizations.dangerZone.deleteAction })
      ).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('Admin hitting the delete-organization API directly gets 403, not just a hidden button', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_ADMIN, PASSWORD);
    try {
      const sessionResponse = await page.request.get('/api/auth/session');
      const session = await sessionResponse.json();
      const organizationId = session?.user?.organization?.id;
      expect(organizationId).toBeTruthy();

      // Same route the Owner's (unused-in-this-test) delete button would
      // call - `OrganizationDetailView.delete`. Never actually sent by
      // Admin's UI, but the server must reject it regardless of what the
      // client renders.
      const response = await page.request.delete(
        `/api/backend/api/v1/organizations/${organizationId}/`,
        { failOnStatusCode: false }
      );
      expect(response.status()).toBe(403);

      // The organization must still exist and be reachable afterward -
      // belt-and-suspenders against a false-positive 403 that actually came
      // from a route-not-found rather than a real permission check.
      await page.goto('/organization');
      await expect(page.getByRole('heading', { name: t.organizations.settings.title })).toBeVisible(
        {
          timeout: 10_000,
        }
      );
    } finally {
      await context.close();
    }
  });

  test('Owner can edit the organization name', async ({ browser }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      await page.goto('/organization');
      const nameField = page.getByLabel(t.organizations.settings.nameLabel);
      // The field is populated from a fetch, so it renders empty first. Reading
      // it before that lands captures '' as `original` and the revert below
      // then writes the organization's name to the empty string.
      await expect(nameField).not.toHaveValue('', { timeout: 10_000 });
      const original = (await nameField.inputValue()).trim();
      const updated = `${original} (e2e)`;

      try {
        await nameField.fill(updated);
        await page.getByRole('button', { name: t.buttons.save }).click();
        await expect(page.getByText(t.organizations.settings.saved)).toBeVisible({
          timeout: 10_000,
        });
        await expect(nameField).toHaveValue(updated);
      } finally {
        // Revert unconditionally: this mutates seeded data every other spec and
        // every later run shares. When the revert lived after the assertions, a
        // single failure above skipped it and left the name permanently drifted
        // — a real run left 'Demo Org (e2e) (e2e-admin)' behind, which then
        // broke later runs that read it as their `original`.
        await nameField.fill(original);
        await page.getByRole('button', { name: t.buttons.save }).click();
        // Waited on, not asserted: the write must land before the context
        // closes, but a failure here must not mask a real failure above.
        await page
          .getByText(t.organizations.settings.saved)
          .waitFor({ timeout: 10_000 })
          .catch(() => {});
      }
      await expect(nameField).toHaveValue(original);
    } finally {
      await context.close();
    }
  });

  test('Admin can also edit the organization name (manage is shared, not owner-only)', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_ADMIN, PASSWORD);
    try {
      await page.goto('/organization');
      const nameField = page.getByLabel(t.organizations.settings.nameLabel);
      await expect(nameField).toBeEnabled();
      // See the Owner case above: read only once the fetch has populated it.
      await expect(nameField).not.toHaveValue('', { timeout: 10_000 });
      const original = (await nameField.inputValue()).trim();
      const updated = `${original} (e2e-admin)`;

      try {
        await nameField.fill(updated);
        await page.getByRole('button', { name: t.buttons.save }).click();
        await expect(page.getByText(t.organizations.settings.saved)).toBeVisible({
          timeout: 10_000,
        });
        await expect(nameField).toHaveValue(updated);
      } finally {
        await nameField.fill(original);
        await page.getByRole('button', { name: t.buttons.save }).click();
        await page
          .getByText(t.organizations.settings.saved)
          .waitFor({ timeout: 10_000 })
          .catch(() => {});
      }
      await expect(nameField).toHaveValue(original);
    } finally {
      await context.close();
    }
  });
});
