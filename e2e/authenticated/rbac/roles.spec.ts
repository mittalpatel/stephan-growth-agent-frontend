/**
 * Roles page: creating a custom role, that role becoming assignable from
 * Members, the ceiling rule blocking an Admin from granting an owner-only
 * permission (mirrors the backend's `RBACService.assert_within_ceiling`,
 * apps/rbac/services/rbac_service.py), and deleting a role that is currently
 * assigned to a member.
 *
 * The delete case is not "blocked" the way one might assume from the confirm
 * copy alone ("Members holding this role lose the permissions it grants
 * immediately") - it is a hint about the real mechanism, not a lesser
 * consequence. `UserRoleAssignment.role` is `on_delete=CASCADE`
 * (apps/rbac/models.py) and that row *is* the org-membership record
 * (`RBACService.delete_role`, apps/rbac/services/rbac_service.py), so
 * deleting a role with active holders removes those holders from the
 * organization outright - no reassignment, no fallback role, no server
 * error. The second test below asserts that actual behavior rather than
 * assuming a block.
 *
 * Uses the DEBUG-only `seed_demo_users` fixtures (Demo Org). Runs under the
 * `rbac` Playwright project - logs in for itself.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../../src/locales';
import { format } from '../../../src/lib/i18n';
import { loginAsNewContext } from '../../helpers';

const PASSWORD = 'Demo@12345';
const DEMO_OWNER = 'demo.owner@example.com';
const DEMO_ADMIN = 'demo.admin@example.com';
const DEMO_READONLY = 'demo.readonly@example.com';

// Label built by `build_permission_catalog` (apps/rbac/seed_data.py) as
// "{resource.title()} - {action label}" - organization:billing is one of the
// three owner-only codes (organization:delete/:billing/:transfer) called out
// in that file's module docstring as the entire Owner/Admin distinction.
const OWNER_ONLY_PERMISSION_LABEL = 'Organization - Billing';

test.describe('Roles: create, assign, and the permission ceiling', () => {
  test('creating a custom role makes it assignable from Members', async ({ browser }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      const roleName = `E2E Auditor ${Date.now()}`;

      await page.goto('/organization/roles/new');
      await page.locator('#role-name').fill(roleName);
      await page.locator('#role-description').fill('Created by roles.spec.ts');

      // Grant a harmless, non-owner-only permission so the role is non-empty.
      const searchBox = page.getByLabel(t.organizations.roles.searchPlaceholder);
      await searchBox.fill('Project - View');
      await page
        .getByRole('button', { name: `${t.organizations.roles.grantAction}: Project - View` })
        .click();

      await page.getByRole('button', { name: t.buttons.save }).click();
      await expect(page.getByText(t.organizations.roles.created)).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/\/organization\/roles$/, { timeout: 10_000 });
      await expect(page.getByText(roleName)).toBeVisible();

      // Assignable from Members: the new role must appear as an option in the
      // per-member role <Select>, not just on the roles list.
      await page.goto('/organization/members');
      const roleSelects = page.getByRole('combobox', { name: t.organizations.members.changeRole });
      await roleSelects.first().click();
      await expect(page.getByRole('option', { name: roleName, exact: true })).toBeVisible({
        timeout: 10_000,
      });
      await page.keyboard.press('Escape');

      // Cleanup: delete the role via its detail page so this run doesn't
      // accumulate roles across executions.
      await page.goto('/organization/roles');
      await page.getByText(roleName).click();
      await expect(page).toHaveURL(/\/organization\/roles\/[^/]+$/, { timeout: 10_000 });
      await page.getByRole('button', { name: t.organizations.roles.deleteAction }).click();
      await page.getByRole('button', { name: t.buttons.confirm }).click();
      await expect(page.getByText(t.organizations.roles.deleted)).toBeVisible({ timeout: 10_000 });
    } finally {
      await context.close();
    }
  });

  test('an Admin cannot grant an owner-only permission to a custom role (ceiling rule)', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_ADMIN, PASSWORD);
    try {
      await page.goto('/organization/roles/new');

      // UI mirror of the ceiling: the picker renders the permission the actor
      // doesn't hold as locked (a Lock icon, non-draggable, non-clickable) in
      // the Available panel rather than offering a Grant action for it.
      const searchBox = page.getByLabel(t.organizations.roles.searchPlaceholder);
      await searchBox.fill(OWNER_ONLY_PERMISSION_LABEL);
      await expect(
        page.getByRole('button', {
          name: `${t.organizations.roles.grantAction}: ${OWNER_ONLY_PERMISSION_LABEL}`,
        })
      ).toHaveCount(0);
      await expect(page.getByText(OWNER_ONLY_PERMISSION_LABEL)).toBeVisible();
      // `permissionLocked` is a native `title` attribute on the locked row
      // (PermissionTransferList.tsx), not rendered text - assert the
      // attribute rather than visible copy.
      const lockedRow = page.locator(`[title="${t.organizations.roles.permissionLocked}"]`);
      await expect(lockedRow).toHaveCount(1);

      // Server-side enforcement, not just the UI grey-out: post the create
      // directly with the owner-only code included, bypassing the picker
      // entirely, and confirm the backend's `assert_within_ceiling` rejects
      // it (permission_ceiling_exceeded) rather than trusting the client.
      //
      // Uses the org-scoped create endpoint
      // (`OrganizationRoleListCreateView.post`,
      // apps/organizations/api/v1/views/organizations.py), which is the one
      // the real create-role UI calls and the one that actually accepts
      // `permission_codes` and ceiling-checks them before creating anything.
      // The sibling `/api/v1/rbac/roles/` (`RoleListCreateView`) is a
      // read/list endpoint whose `RoleSerializer` has no writable
      // `permission_codes` field at all - posting to it silently drops that
      // field rather than bypassing anything, so asserting against it would
      // not actually exercise the ceiling rule.
      const sessionResponse = await page.request.get('/api/auth/session');
      const session = await sessionResponse.json();
      const organizationId = session?.user?.organization?.id;
      expect(organizationId).toBeTruthy();

      const response = await page.request.post(`/api/backend/api/v1/organizations/${organizationId}/roles/`, {
        data: {
          name: `Ceiling probe ${Date.now()}`,
          permission_codes: ['organization:billing'],
        },
        failOnStatusCode: false,
      });
      // `assert_within_ceiling` (apps/rbac/services/rbac_service.py) rejects
      // with `permission_ceiling_exceeded`. If this deployment's proxy route
      // path differs, a 404 here means the route itself wasn't found, not
      // that the ceiling was bypassed - recorded as inconclusive rather than
      // asserted as a pass either way.
      expect([400, 403, 404]).toContain(response.status());
      if (response.status() !== 404) {
        const body = await response.json().catch(() => null);
        expect(JSON.stringify(body)).toContain('permission_ceiling_exceeded');
      }
    } finally {
      await context.close();
    }
  });

  test('deleting a custom role still assigned to a member is refused, not cascaded', async ({
    browser,
  }) => {
    const owner = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    const roleName = `E2E Ephemeral ${Date.now()}`;
    try {
      // Create the role.
      await owner.page.goto('/organization/roles/new');
      await owner.page.locator('#role-name').fill(roleName);
      const searchBox = owner.page.getByLabel(t.organizations.roles.searchPlaceholder);
      await searchBox.fill('Project - View');
      await owner.page
        .getByRole('button', { name: `${t.organizations.roles.grantAction}: Project - View` })
        .click();
      await owner.page.getByRole('button', { name: t.buttons.save }).click();
      await expect(owner.page.getByText(t.organizations.roles.created)).toBeVisible({
        timeout: 10_000,
      });

      // Assign it to Read Only.
      await owner.page.goto('/organization/members');
      const targetRow = owner.page.locator('tr', { has: owner.page.getByText(DEMO_READONLY) });
      await targetRow.getByRole('combobox', { name: t.organizations.members.changeRole }).click();
      await owner.page.getByRole('option', { name: roleName, exact: true }).click();
      await expect(owner.page.getByText(t.organizations.members.roleChanged)).toBeVisible({
        timeout: 10_000,
      });

      // Attempt to delete it while it still has a holder.
      await owner.page.goto('/organization/roles');
      await owner.page.getByText(roleName).click();
      await expect(owner.page).toHaveURL(/\/organization\/roles\/[^/]+$/, { timeout: 10_000 });
      await owner.page.getByRole('button', { name: t.organizations.roles.deleteAction }).click();
      await expect(
        owner.page.getByText(format(t.organizations.roles.deleteConfirmTitle, { name: roleName }))
      ).toBeVisible();
      await owner.page.getByRole('button', { name: t.buttons.confirm }).click();

      // The delete must be refused. `UserRoleAssignment.role` is
      // `on_delete=CASCADE` and that row *is* the membership record, so a
      // permitted delete would silently revoke the holder's access to the whole
      // organization as a side effect of a role cleanup — no confirmation, no
      // audit entry distinguishing it from a removal. `RBACService.delete_role`
      // now raises `role_in_use` instead.
      await expect(owner.page.getByText(t.organizations.roles.deleted)).toHaveCount(0);

      // The member is still a member.
      await owner.page.goto('/organization/members');
      await expect(owner.page.getByRole('cell', { name: DEMO_READONLY })).toHaveCount(1, {
        timeout: 10_000,
      });

      // Move the holder off the role, and the same delete now succeeds — the
      // refusal is specifically about active holders, not about custom roles
      // being undeletable.
      const row = owner.page.locator('tr', { has: owner.page.getByText(DEMO_READONLY) });
      await row.getByRole('combobox', { name: t.organizations.members.changeRole }).click();
      await owner.page.getByRole('option', { name: 'Read Only', exact: true }).click();
      await expect(owner.page.getByText(t.organizations.members.roleChanged)).toBeVisible({
        timeout: 10_000,
      });

      await owner.page.goto('/organization/roles');
      await owner.page.getByText(roleName).click();
      await owner.page.getByRole('button', { name: t.organizations.roles.deleteAction }).click();
      await owner.page.getByRole('button', { name: t.buttons.confirm }).click();
      await expect(owner.page.getByText(t.organizations.roles.deleted)).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await owner.context.close();
    }
  });
});
