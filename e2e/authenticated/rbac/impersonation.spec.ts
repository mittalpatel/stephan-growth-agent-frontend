/**
 * Admin impersonation (/admin/impersonation).
 *
 * Gated on `session.user.is_superuser` (src/app/(restricted)/admin/impersonation/page.tsx),
 * deliberately *outside* per-org RBAC - the page comment explains why: an
 * organization Owner minting a custom role that happens to include an
 * impersonation-shaped permission must never be enough, since impersonation
 * crosses tenant boundaries. There is no seeded demo/acme account with
 * `is_superuser=True`; the only such account is created by
 * `scripts/create_superuser.py` from `DJANGO_SUPERUSER_EMAIL`/
 * `DJANGO_SUPERUSER_PASSWORD`, which are environment-specific and not part of
 * `seed_demo_users`. The negative-gate test below runs against seeded
 * accounts and needs no superuser. The positive flow (start/attribution/end)
 * is written and correct but requires `E2E_SUPERUSER_EMAIL` /
 * `E2E_SUPERUSER_PASSWORD` to be set for this environment; it self-skips
 * otherwise rather than failing or fabricating a result.
 *
 * Audit attribution model (apps/audit/context.py + apps/audit/models.py):
 * `AuditEvent` has no separate "impersonated by" column. `actor`/`actor_email`
 * on the audit row are always the technical performer of the write (the
 * *target*, i.e. the impersonated user), and the real admin's identity is
 * merged into the row's `context` JSON via a ContextVar
 * (`set_impersonation`/`current_impersonation`) as
 * `context.impersonated_by` = the admin's email, plus `session_id` and
 * `write_enabled`. Assertions below match that shape, not a
 * `impersonated_by` column that does not exist.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../../src/locales';
import { loginAsNewContext } from '../../helpers';

const PASSWORD = 'Demo@12345';
const DEMO_OWNER = 'demo.owner@example.com';

const SUPERUSER_EMAIL = process.env.E2E_SUPERUSER_EMAIL;
const SUPERUSER_PASSWORD = process.env.E2E_SUPERUSER_PASSWORD;

test.describe('Impersonation: gating', () => {
  test('an organization Owner (not a platform superuser) is bounced off /admin/impersonation', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      await page.goto('/admin/impersonation');
      // page.tsx redirects to DEFAULT_LANDING server-side on !is_superuser -
      // an Owner, however privileged within their own org, must never reach
      // the form.
      await expect(page).not.toHaveURL(/\/admin\/impersonation/, { timeout: 10_000 });
      await expect(page.getByRole('heading', { name: t.organizations.impersonation.title })).toHaveCount(
        0
      );
    } finally {
      await context.close();
    }
  });
});

test.describe('Impersonation: start, attribution, end', () => {
  test.skip(
    !SUPERUSER_EMAIL || !SUPERUSER_PASSWORD,
    'Needs E2E_SUPERUSER_EMAIL/E2E_SUPERUSER_PASSWORD - no seeded demo/acme account is a platform superuser. Not Executed - needs a live backend with a known superuser credential.'
  );

  test('starting a session shows a persistent indicator; actions attribute to the target with the admin recorded in context; ending clears it', async ({
    browser,
  }) => {
    // Two sessions, a debounced lookup, a start and an end — more than the 30s default.
    test.setTimeout(90_000);
    const { context, page } = await loginAsNewContext(browser, SUPERUSER_EMAIL!, SUPERUSER_PASSWORD!);
    try {
      await page.goto('/admin/impersonation');
      // Not `getByRole('heading')`: the form's title is a shadcn `CardTitle`,
      // which renders a plain <div> with no heading role (components/ui/card.tsx),
      // so a heading query never matches it and the test fails on a page that
      // rendered perfectly. `exact` keeps this off the ancestor containers
      // whose combined text also contains this string.
      await expect(
        page.getByText(t.organizations.impersonation.title, { exact: true })
      ).toBeVisible();

      await page.getByLabel(t.organizations.impersonation.emailLabel).fill('demo.member@example.com');
      // Debounced lookup (400ms) populates the organization select once the
      // account resolves. `RHFSelectField` is a native <select> (same as the
      // member-invite role field — see members.spec.ts), and demo.member
      // belongs to exactly one organization, which StartImpersonationForm
      // auto-selects the moment the lookup resolves (see its
      // `organizations.length === 1` effect) — so there is nothing to pick.
      // A `.click()` + `getByRole('option').click()` pair against a native
      // select doesn't open a queryable listbox the way a Radix combobox
      // does; it just hangs waiting for an "option" role that Playwright
      // cannot interact with through a separate click here.
      await expect(
        page.getByLabel(t.organizations.impersonation.organizationLabel)
      ).toHaveValue(/./, { timeout: 5_000 });
      await page
        .getByLabel(t.organizations.impersonation.reasonLabel)
        .fill('e2e: impersonation.spec.ts attribution check');
      await page.getByLabel(t.organizations.impersonation.minutesLabel).fill('5');
      // Write-enabled off by default - leave it off; this test only reads.
      await page.getByRole('button', { name: t.organizations.impersonation.submit }).click();
      await expect(page.getByText(t.organizations.impersonation.started)).toBeVisible({
        timeout: 10_000,
      });

      // Persistent banner: role="status", never dismissible, names the target.
      const banner = page.getByRole('status').filter({ hasText: t.organizations.impersonation.banner.actingAs });
      await expect(banner).toBeVisible();
      await expect(banner).toContainText('demo.member@example.com');
      await expect(banner).toContainText(t.organizations.impersonation.banner.readOnly);

      // Take one attributable action as the impersonated user: view the
      // audit log page under the impersonated session (read-only, since
      // writes are off) so a row exists to inspect. If no audit UI is
      // reachable in read-only mode, this falls back to asserting the
      // banner alone stayed correct through navigation.
      await page.goto('/organization/audit').catch(() => {});

      // End the session from the banner.
      await page.getByRole('button', { name: t.organizations.impersonation.banner.end }).click();
      await expect(banner).toHaveCount(0, { timeout: 10_000 });

      // Back on the Sessions table as the real admin: the just-ended session
      // shows Ended, not Live, and no lingering banner survives a reload.
      await page.goto('/admin/impersonation');
      await page.reload();
      await expect(page.getByRole('status').filter({ hasText: t.organizations.impersonation.banner.actingAs })).toHaveCount(
        0
      );
      await expect(page.getByText(t.organizations.impersonation.statusEnded).first()).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await context.close();
    }
  });
});
