/**
 * Cross-org project-access grants must be impossible, both through the UI and
 * through a direct API call.
 *
 * Uses the DEBUG-only `seed_demo_users` fixtures (see
 * apps/devtools/management/commands/seed_demo_users.py in the backend): two
 * wholly separate organizations, "Demo Org" and "Acme Corp", each with an
 * Owner/Admin/Member/Read Only account sharing the password `Demo@12345`.
 *
 * Runs under the `rbac` Playwright project (see playwright.config.ts) — it
 * logs in for itself via `loginAsNewContext` rather than depending on the
 * single-tenant `chromium` storage state, and needs two organizations' worth
 * of sessions open at once.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../../src/locales';
import { loginAsNewContext, openFirstRowDetail } from '../../helpers';

const PASSWORD = 'Demo@12345';
// The Owner, not the Admin. Admin is *scoped* by design — it holds every
// project permission but only for projects it has a `ProjectAccess` row for,
// and the seed deliberately gives it none, so its project list is empty and
// there is nothing to open a Share dialog on (see
// `PROJECT_SCOPE_BYPASS_ROLE_SLUGS` in apps/projects/constants.py and
// DEV_CREDENTIALS.md). Only the Owner bypasses that scoping. The guarantee
// under test — that the candidate pool is scoped to the actor's own tenant —
// is identical for any actor holding `project:access_manage`.
const DEMO_OWNER = 'demo.owner@example.com';
const ACME_MEMBER = 'acme.member@example.com';

test.describe('Cross-org project access grant is rejected', () => {
  test('the share dialog never offers an Acme Corp user to a Demo Org actor', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      await page.goto('/projects');
      await openFirstRowDetail(page, /\/projects\//);

      await page.getByRole('button', { name: t.projects.access.shareButton }).click();
      await expect(page.getByRole('dialog', { name: t.projects.access.title })).toBeVisible();

      // Search the "add people" picker for the Acme member by name and by
      // email — neither must ever surface a match, since the candidate pool
      // (`organizationMembersEndpoint`) is scoped server-side to the actor's
      // own tenant. See src/app/(restricted)/projects/[projectId]/components/ProjectAccessSection.tsx.
      const addPeopleInput = page.getByPlaceholder(t.projects.access.addPeoplePlaceholder);
      await addPeopleInput.fill('Sam'); // acme.member@example.com's first name
      await expect(page.getByText(t.projects.access.noMatches)).toBeVisible();
      await expect(page.getByText(ACME_MEMBER)).toHaveCount(0);

      await addPeopleInput.fill('');
      await addPeopleInput.fill(ACME_MEMBER);
      await expect(page.getByText(t.projects.access.noMatches)).toBeVisible();
      await expect(page.getByText(ACME_MEMBER)).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('a direct API grant against an Acme Corp user_id is rejected, not 200', async ({
    browser,
  }) => {
    // Two live sessions at once: Acme's, to resolve a real Acme user_id and a
    // real Demo project_id is irrelevant to Acme, and Demo's, whose session
    // cookie (via the same-origin `/api/backend` proxy — see
    // src/client/axiosAuth.ts) is what actually issues the cross-org attempt.
    const acme = await loginAsNewContext(browser, ACME_MEMBER, PASSWORD);
    const demo = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      // Resolve the Acme member's own user_id from their own authenticated
      // session (NextAuth exposes it on the session object at /api/auth/session).
      const acmeSession = await acme.page.request.get('/api/auth/session');
      const acmeSessionBody = await acmeSession.json();
      const acmeUserId: string | undefined = acmeSessionBody?.user?.id;
      expect(acmeUserId, 'expected the Acme session to carry a user id').toBeTruthy();

      // Resolve a real Demo Org project id the actor can manage access for.
      await demo.page.goto('/projects');
      const demoProjectId = await openFirstRowDetail(demo.page, /\/projects\//);
      expect(demoProjectId).toBeTruthy();

      // The actual cross-org attempt: the Demo Org session, targeting the
      // Acme user_id, through the real same-origin proxy — not a mocked route.
      const response = await demo.page.request.post(
        `/api/backend/api/v1/projects/${demoProjectId}/access/`,
        { data: { user_id: acmeUserId, access_level: 'viewer' } }
      );

      // `_tenant_member` in apps/projects/api/v1/views/project_access.py:37-53
      // resolves the target user scoped to `request.tenant` (the actor's own
      // org, from the signed JWT) and raises `ResourceNotFoundError` — 404,
      // not 403 — when no match exists. See project_access.py:87 (the POST
      // handler) calling `_tenant_member(request, ...)`.
      expect(response.status()).toBe(404);
      expect(response.status()).not.toBe(200);
      expect(response.status()).not.toBe(201);
    } finally {
      await acme.context.close();
      await demo.context.close();
    }
  });
});
