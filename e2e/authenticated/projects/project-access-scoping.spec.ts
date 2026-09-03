/**
 * Project list role-scoping: which projects a role can even see.
 *
 * This is real API-level filtering, not a UI hide.
 * `ProjectSelector.get_queryset` (apps/projects/selectors/project_selector.py)
 * filters to `access_grants__user=actor` for every role except one that
 * `_bypasses_access_scoping()` - and that bypass set
 * (`PROJECT_SCOPE_BYPASS_ROLE_SLUGS`, apps/projects/constants.py) contains
 * only the Owner slug. Admin is deliberately excluded: Admin holds every
 * project *permission*, but permission decides which verbs are allowed, not
 * which rows are reached.
 *
 * Seed data (apps/devtools/management/commands/seed_demo_users.py): each org
 * has "Shared Project" (an explicit `ProjectAccess(access_level=EDITOR)` grant
 * for the seeded Member) and "Private Project" (no grant for anyone but the
 * Owner). So Member/Read Only should see "Shared Project" but never "Private
 * Project" - not "view only", literally absent from the list response - while
 * Owner sees both.
 *
 * Uses the DEBUG-only `seed_demo_users` fixtures (Demo Org). Runs under the
 * `rbac` Playwright project (which also matches authenticated/projects/**) -
 * logs in for itself.
 */
import { test, expect } from '@playwright/test';

import { loginAsNewContext } from '../../helpers';

const PASSWORD = 'Demo@12345';
const DEMO_OWNER = 'demo.owner@example.com';
const DEMO_MEMBER = 'demo.member@example.com';
const DEMO_READONLY = 'demo.readonly@example.com';

test.describe('Projects: role-scoped visibility', () => {
  test('the Owner sees both seeded projects', async ({ browser }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      await page.goto('/projects');
      await expect(page.getByRole('link', { name: 'Shared Project' })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole('link', { name: 'Private Project' })).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await context.close();
    }
  });

  test('Member sees Shared Project (an explicit editor grant) but not Private Project', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_MEMBER, PASSWORD);
    try {
      await page.goto('/projects');
      await expect(page.getByRole('link', { name: 'Shared Project' })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole('link', { name: 'Private Project' })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('Read Only sees neither project (no ProjectAccess grant of any kind)', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_READONLY, PASSWORD);
    try {
      await page.goto('/projects');
      // The seed script only grants Member an editor row on Shared Project -
      // Read Only has no ProjectAccess row on either seeded project, so per
      // `ProjectSelector.get_queryset` both are absent from this response.
      await expect(page.getByRole('link', { name: 'Shared Project' })).toHaveCount(0, {
        timeout: 10_000,
      });
      await expect(page.getByRole('link', { name: 'Private Project' })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
});
