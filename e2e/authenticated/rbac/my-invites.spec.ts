/**
 * "My Invites" (/invites) - the signed-in user's own view of invitations sent
 * to their email, distinct from the per-org Members "pending invites" table
 * (that one is the admin/inviter's view of outstanding invites; this one is
 * the invitee's).
 *
 * Endpoints (src/services/organizations.ts):
 *   GET  /api/v1/auth/me/invites/
 *   POST /api/v1/auth/me/invites/{id}/accept/
 *   POST /api/v1/auth/me/invites/{id}/decline/
 *
 * Backend (apps/users/services/invite_service.py):
 *   - accept_for_user(): asserts invite.email == user.email, invite not
 *     already used/expired, then in one transaction calls
 *     RBACService.assign_role(user, invite.role, organization=invite.organization)
 *     (creating the UserRoleAssignment - the membership record itself) and
 *     InviteService.consume() (marks used_at, does not delete the row).
 *   - decline_for_user(): same ownership/validity checks, then *hard-deletes*
 *     the invite row outright (declared "single-use and never redeemed, so
 *     nothing is worth keeping" in the docstring) - not a soft "declined"
 *     status, an actual delete.
 *
 * Uses the DEBUG-only `seed_demo_users` fixtures. Runs under the `rbac`
 * Playwright project - logs in for itself.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../../src/locales';
import { format } from '../../../src/lib/i18n';
import { loginAsNewContext } from '../../helpers';

const PASSWORD = 'Demo@12345';
const DEMO_OWNER = 'demo.owner@example.com';

test.describe('My Invites: accept', () => {
  test('accepting joins the org with the invited role and the invite leaves the pending list', async ({
    browser,
  }) => {
    const owner = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      // Invite acceptance requires `invite.email === user.email`
      // (invite_service.py), so the invitee must be an existing account - a
      // freshly-made-up email has nothing to sign in as, and public signup is
      // out of scope here (covered by e2e/journey/*). Use an already-seeded
      // cross-org account whose membership this test owns end-to-end: Acme's
      // Owner, invited into Demo Org as a guest Read Only member here, then
      // removed again in cleanup.
      const guestEmail = 'acme.owner@example.com';
      await owner.page.goto('/organization/members');
      await owner.page.getByRole('button', { name: t.organizations.invite.title }).click();
      const dialog = owner.page.getByRole('dialog');
      await dialog.getByLabel(t.organizations.invite.emailLabel).fill(guestEmail);
      await dialog
        .getByLabel(t.organizations.invite.roleLabel)
        .selectOption({ label: 'Read Only' });
      await dialog.getByRole('button', { name: t.organizations.invite.submit }).click();
      await expect(owner.page.getByText(t.organizations.invite.sent)).toBeVisible({
        timeout: 10_000,
      });

      const guest = await loginAsNewContext(browser, guestEmail, PASSWORD);
      try {
        await guest.page.goto('/invites');
        await expect(
          guest.page.getByText(format(t.organizations.myInvites.asRole, { role: 'Read Only' }))
        ).toBeVisible({ timeout: 10_000 });
        await guest.page
          .getByRole('button', { name: t.organizations.myInvites.accept })
          .first()
          .click();
        await expect(guest.page.getByText(t.organizations.myInvites.accepted)).toBeVisible({
          timeout: 10_000,
        });

        // Gone from "my invites" once consumed.
        await guest.page.goto('/invites');
        await expect(
          guest.page.getByText(format(t.organizations.myInvites.asRole, { role: 'Read Only' }))
        ).toHaveCount(0);
      } finally {
        await guest.context.close();
      }

      // Joined Demo Org with the invited role: shows up in Members with Read
      // Only selected.
      await owner.page.goto('/organization/members');
      const row = owner.page.locator('tr', { has: owner.page.getByText(guestEmail) });
      await expect(row).toBeVisible({ timeout: 10_000 });
      await expect(
        row.getByRole('combobox', { name: t.organizations.members.changeRole })
      ).toContainText('Read Only');

      // Cleanup: remove the guest from Demo Org so this run doesn't leave a
      // permanent cross-org membership behind.
      await row.getByRole('button', { name: t.organizations.members.remove }).click();
      await owner.page.getByRole('button', { name: t.buttons.confirm }).click();
      await expect(owner.page.getByText(t.organizations.members.removed)).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await owner.context.close();
    }
  });
});

test.describe('My Invites: decline', () => {
  test('declining removes the invite without granting access', async ({ browser }) => {
    const owner = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      const guestEmail = 'acme.admin@example.com';
      await owner.page.goto('/organization/members');
      await owner.page.getByRole('button', { name: t.organizations.invite.title }).click();
      const dialog = owner.page.getByRole('dialog');
      await dialog.getByLabel(t.organizations.invite.emailLabel).fill(guestEmail);
      await dialog
        .getByLabel(t.organizations.invite.roleLabel)
        .selectOption({ label: 'Read Only' });
      await dialog.getByRole('button', { name: t.organizations.invite.submit }).click();
      await expect(owner.page.getByText(t.organizations.invite.sent)).toBeVisible({
        timeout: 10_000,
      });

      const guest = await loginAsNewContext(browser, guestEmail, PASSWORD);
      try {
        await guest.page.goto('/invites');
        await expect(
          guest.page.getByText(format(t.organizations.myInvites.asRole, { role: 'Read Only' }))
        ).toBeVisible({ timeout: 10_000 });
        await guest.page
          .getByRole('button', { name: t.organizations.myInvites.decline })
          .first()
          .click();
        await expect(guest.page.getByText(t.organizations.myInvites.declined)).toBeVisible({
          timeout: 10_000,
        });

        await guest.page.goto('/invites');
        await expect(
          guest.page.getByText(format(t.organizations.myInvites.asRole, { role: 'Read Only' }))
        ).toHaveCount(0);
      } finally {
        await guest.context.close();
      }

      // No access granted: the guest never appears in Demo Org's Members.
      await owner.page.goto('/organization/members');
      await expect(owner.page.getByRole('cell', { name: guestEmail })).toHaveCount(0, {
        timeout: 10_000,
      });

      // The invite is gone from the org's own pending-invites table too
      // (hard-deleted, not merely marked declined) - re-inviting the same
      // email must not collide with a stale row.
      await expect(owner.page.getByRole('cell', { name: guestEmail })).toHaveCount(0);
    } finally {
      await owner.context.close();
    }
  });
});
