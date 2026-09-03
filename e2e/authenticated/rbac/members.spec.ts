/**
 * Members page: invite flow, resend-replaces-not-duplicates, the Admin role
 * ceiling (cannot offer "Owner" as assignable), and a role change taking
 * effect on the affected member's very next action.
 *
 * Uses the DEBUG-only `seed_demo_users` fixtures (Demo Org). Runs under the
 * `rbac` Playwright project — logs in for itself.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../../src/locales';
import { loginAsNewContext } from '../../helpers';

const PASSWORD = 'Demo@12345';
const DEMO_ADMIN = 'demo.admin@example.com';
const DEMO_READONLY = 'demo.readonly@example.com';

test.describe('Members: invite flow', () => {
  test('inviting, then resending, replaces the pending row rather than duplicating it', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_ADMIN, PASSWORD);
    try {
      await page.goto('/organization/members');
      const inviteEmail = `e2e-invite-${Date.now()}@example.com`;

      await page.getByRole('button', { name: t.organizations.invite.title }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel(t.organizations.invite.emailLabel).fill(inviteEmail);
      // `RHFSelectField` (src/components/common/form/RHFSelectField.tsx) is a
      // native <select>, not a Radix combobox — `selectOption` by index picks
      // the first assignable role, whatever it resolves to. The ceiling test
      // below asserts specifically about "Owner" never being an option.
      await dialog.getByLabel(t.organizations.invite.roleLabel).selectOption({ index: 0 });
      await dialog.getByRole('button', { name: t.organizations.invite.submit }).click();
      await expect(page.getByText(t.organizations.invite.sent)).toBeVisible({ timeout: 10_000 });

      await expect(page.getByRole('cell', { name: inviteEmail })).toHaveCount(1);

      // Resend the same invite and confirm the row count for this email is
      // still exactly one — a naive re-invite that creates a second Invite
      // row would duplicate it instead of replacing/refreshing the existing one.
      const row = page.locator('tr', { has: page.getByText(inviteEmail) });
      await row.getByRole('button', { name: t.organizations.pendingInvites.resend }).click();
      await expect(page.getByText(t.organizations.members.inviteResent)).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole('cell', { name: inviteEmail })).toHaveCount(1);

      // Cleanup: revoke so the suite doesn't accumulate invites across runs.
      // ConfirmDialog defaults its action button to t.buttons.confirm — see
      // src/components/common/ConfirmDialog.tsx, which PendingInvitesTable
      // does not override.
      await row.getByRole('button', { name: t.organizations.pendingInvites.revoke }).click();
      await page.getByRole('button', { name: t.buttons.confirm }).click();
      await expect(page.getByText(t.organizations.members.inviteRevoked)).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await context.close();
    }
  });

  test('the assignable-role dropdown never offers "Owner" to an Admin', async ({ browser }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_ADMIN, PASSWORD);
    try {
      await page.goto('/organization/members');

      // Ceiling rule checked in both places a role is chosen: inviting a new
      // member (a native <select> — see RHFSelectField), and changing an
      // existing member's role (a Radix `Select`, per MembersTable.tsx).
      await page.getByRole('button', { name: t.organizations.invite.title }).click();
      const dialog = page.getByRole('dialog');
      const inviteRoleSelect = dialog.getByLabel(t.organizations.invite.roleLabel);
      await expect(inviteRoleSelect.locator('option', { hasText: 'Owner' })).toHaveCount(0);
      await page.keyboard.press('Escape');

      const roleSelects = page.getByRole('combobox', { name: t.organizations.members.changeRole });
      await roleSelects.first().click();
      await expect(page.getByRole('option', { name: 'Owner', exact: true })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
});

test.describe('Members: a role change takes effect on the member\'s next action', () => {
  test('promoting Read Only to Admin immediately grants member-management affordances', async ({
    browser,
  }) => {
    const admin = await loginAsNewContext(browser, DEMO_ADMIN, PASSWORD);
    const target = await loginAsNewContext(browser, DEMO_READONLY, PASSWORD);
    try {
      // Baseline: Read Only cannot see the invite affordance at all. In fact
      // `PermissionGuard` bounces a Read Only visitor off `/organization/members`
      // entirely (they hold no `member:view`) — `target.page` ends up on
      // whatever `defaultRoute()` resolves to, not the members page, which is
      // itself proof enough that the invite affordance is unreachable. Reload
      // instead of relying on this `goto`'s post-redirect URL for the check
      // below — a second `goto` to the same path is the same assertion made
      // explicit and is not fooled by the client-side redirect having already
      // fired once.
      await target.page.goto('/organization/members');
      await expect(
        target.page.getByRole('button', { name: t.organizations.invite.title })
      ).toHaveCount(0);

      // Admin changes the Read Only member's role to Admin.
      await admin.page.goto('/organization/members');
      const targetRow = admin.page.locator('tr', { has: admin.page.getByText(DEMO_READONLY) });
      await targetRow
        .getByRole('combobox', { name: t.organizations.members.changeRole })
        .click();
      await admin.page.getByRole('option', { name: 'Admin', exact: true }).click();
      await expect(admin.page.getByText(t.organizations.members.roleChanged)).toBeVisible({
        timeout: 10_000,
      });

      try {
        // Not `target.page.reload()`: the baseline `goto` above already got
        // client-side-redirected away from `/organization/members` by
        // `PermissionGuard` (Read Only has no `member:view`), so `target.page`'s
        // current URL is wherever `defaultRoute()` sent it, not the members
        // page — reloading that would just reload the wrong page and prove
        // nothing. A fresh `goto` is the member's next action against the
        // server and must already reflect the new role — permissions are
        // resolved per request, not cached for the session's lifetime.
        await target.page.goto('/organization/members');
        await expect(
          target.page.getByRole('button', { name: t.organizations.invite.title })
        ).toBeVisible({ timeout: 10_000 });
      } finally {
        // Revert regardless of outcome so the seed stays as documented.
        await admin.page.reload();
        const revertRow = admin.page.locator('tr', { has: admin.page.getByText(DEMO_READONLY) });
        await revertRow.getByRole('combobox', { name: t.organizations.members.changeRole }).click();
        await admin.page.getByRole('option', { name: 'Read Only', exact: true }).click();
        // Waited on, not asserted. An `expect` here throws out of `finally` and
        // replaces whatever real failure the try block raised — the reason this
        // test reported "Role updated. not found" on the revert while the
        // actual assertion that failed was the one above it.
        await admin.page
          .getByText(t.organizations.members.roleChanged)
          .waitFor({ timeout: 10_000 })
          .catch(() => {});
      }
    } finally {
      await admin.context.close();
      await target.context.close();
    }
  });
});
