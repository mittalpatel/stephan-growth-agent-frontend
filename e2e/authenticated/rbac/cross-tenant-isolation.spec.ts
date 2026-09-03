/**
 * Cross-tenant isolation sweep: a Demo Org user must never see Acme Corp's
 * projects, members, or audit-log entries, whether in list views or by
 * guessing a direct URL/id.
 *
 * The active organization travels only inside the signed JWT claim attached
 * server-side by the `/api/backend` proxy (see src/services/organizations.ts's
 * top comment) — a client can never choose which tenant it acts in by editing
 * a request. Every org-scoped backend view resolves the URL's `organization_id`
 * through `require_url_organization` (apps/organizations/scoping.py:73-83),
 * which 404s rather than 403s a mismatch, specifically so a non-member cannot
 * distinguish "not yours" from "does not exist" and enumerate tenants.
 *
 * Runs under the `rbac` Playwright project — see cross-org-access.spec.ts for
 * why (two simultaneous org sessions, self-contained login).
 */
import { test, expect } from '@playwright/test';

import { t } from '../../../src/locales';
import { loginAsNewContext, openFirstRowDetail } from '../../helpers';

const PASSWORD = 'Demo@12345';
// The Owner, not the Admin: Admin is scoped to projects it holds a
// `ProjectAccess` row for and the seed gives it none, so its project list is
// empty — which would make assertion 1 below pass vacuously (nothing in an
// empty list can leak) while proving nothing. Only the Owner bypasses that
// scoping (`PROJECT_SCOPE_BYPASS_ROLE_SLUGS`). The id-probes that follow are
// tenant-scoped identically for either role.
const DEMO_OWNER = 'demo.owner@example.com';
const ACME_OWNER = 'acme.owner@example.com';

test.describe('Cross-tenant isolation: Demo Org cannot reach Acme Corp data', () => {
  test('project list, member list, and direct-URL/id probes are all blocked', async ({
    browser,
  }) => {
    const acme = await loginAsNewContext(browser, ACME_OWNER, PASSWORD);
    const demo = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      // Collect real Acme identifiers from Acme's own session.
      await acme.page.goto('/projects');
      const acmeProjectId = await openFirstRowDetail(acme.page, /\/projects\//);
      expect(acmeProjectId).toBeTruthy();

      const acmeSessionRes = await acme.page.request.get('/api/auth/session');
      const acmeSession = await acmeSessionRes.json();
      const acmeOrgId: string | undefined = acmeSession?.user?.organization?.id;
      expect(acmeOrgId, 'expected Acme session to carry an organization id').toBeTruthy();

      // 1. Acme's seeded projects ("Shared Project" / "Private Project") never
      // appear in Demo's own project list — both orgs seed identically-named
      // projects, so this also proves the list is tenant-filtered, not merely
      // id-filtered on detail views.
      await demo.page.goto('/projects');
      // Non-vacuous by construction: Demo's own list must actually have rows,
      // or "contains nothing of Acme's" is trivially true and tests nothing.
      await expect(demo.page.locator('tbody tr').first()).toBeVisible({ timeout: 15_000 });
      // Not `locator('tbody tr')`: with more than one row that locator resolves
      // to several elements, and `toContainText`'s single-string form is a
      // strict-mode violation against a multi-element locator. `tbody` itself
      // is one element and its full text is exactly what must not mention Acme.
      await expect(demo.page.locator('tbody')).not.toContainText(acmeSession.user.email ?? '');

      // 2. Direct URL: Demo Org user navigating straight to an Acme project id
      // must not see Acme's project. It should land on a not-found state, not
      // a rendered detail page (whose presence would itself be the leak).
      await demo.page.goto(`/projects/${acmeProjectId}`);
      await expect(demo.page.getByText(t.projects.detail.title)).toHaveCount(0);

      // 3. Direct API: the same id, through the real same-origin proxy, under
      // Demo's session cookie. ProjectSelector.get_project scopes by
      // request.tenant, same reasoning as require_url_organization above.
      const projectApiRes = await demo.page.request.get(
        `/api/backend/api/v1/projects/${acmeProjectId}/`
      );
      expect(projectApiRes.status()).toBe(404);

      // 4. Members: Demo cannot list Acme's members by URL-guessing Acme's org id.
      const membersApiRes = await demo.page.request.get(
        `/api/backend/api/v1/organizations/${acmeOrgId}/members/`
      );
      expect(membersApiRes.status()).toBe(404);

      // 5. Audit: same probe against Acme's audit trail.
      const auditApiRes = await demo.page.request.get(
        `/api/backend/api/v1/organizations/${acmeOrgId}/audit/`
      );
      expect(auditApiRes.status()).toBe(404);

      // 6. Demo's own audit page never renders an Acme actor/target, proving
      // the list itself (not just direct-id probing) is tenant-scoped.
      await demo.page.goto('/organization/audit');
      await expect(demo.page.getByText(ACME_OWNER)).toHaveCount(0);
    } finally {
      await acme.context.close();
      await demo.context.close();
    }
  });
});
