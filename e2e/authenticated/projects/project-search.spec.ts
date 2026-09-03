/**
 * Project search matches both name and description.
 *
 * `_SEARCH_FIELDS = {"name": "name", "description": "description"}`
 * (apps/projects/selectors/project_selector.py) confirms the backend queries
 * both columns; the frontend mirrors it via
 * `PROJECT_SEARCH_COLUMNS = ['name', 'description']` (src/services/projects.ts).
 * This is correct substring behavior by design, not a bug to flag - the test
 * below verifies exactly that: a query matching only the description (not the
 * name) still returns the row.
 *
 * Seed data: Demo Org's "Shared Project" description is
 * "Shared with {member_first_name} (Member) as editor." - "editor" appears
 * only in the description, never the name, making it a clean description-only
 * search probe.
 *
 * Uses the DEBUG-only `seed_demo_users` fixtures (Demo Org, Owner - who sees
 * every seeded project per project-access-scoping.spec.ts). Runs under the
 * `rbac` Playwright project.
 */
import { test, expect } from '@playwright/test';

import { search, loginAsNewContext } from '../../helpers';

const PASSWORD = 'Demo@12345';
const DEMO_OWNER = 'demo.owner@example.com';

test.describe('Projects: search matches name and description', () => {
  test('a query for the exact name returns that project', async ({ browser }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      await page.goto('/projects');
      await search(page, 'Shared Project');
      await expect(page.getByRole('link', { name: 'Shared Project' })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole('link', { name: 'Private Project' })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('a query matching only the description (not the name) still returns the project', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      await page.goto('/projects');
      // "editor" appears in Shared Project's seeded description
      // ("...as editor.") and nowhere in either seeded project's name.
      await search(page, 'editor');
      await expect(page.getByRole('link', { name: 'Shared Project' })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole('link', { name: 'Private Project' })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('a query matching neither field returns no rows', async ({ browser }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      await page.goto('/projects');
      await search(page, 'zzz-no-such-project-or-description-zzz');
      await expect(page.getByRole('link', { name: 'Shared Project' })).toHaveCount(0, {
        timeout: 10_000,
      });
      await expect(page.getByRole('link', { name: 'Private Project' })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
});
