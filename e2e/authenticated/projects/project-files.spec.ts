/**
 * Project Files section (ProjectFilesSection.tsx on the project detail page):
 * upload, delete, and a PDF preview, with permission gates that mirror
 * project access levels.
 *
 * Gating (ProjectFilesSection.tsx + apps/files/api/v1/views/files.py):
 *   - Upload: org-wide `project:create` OR project ownership OR an
 *     editor/manager `ProjectAccess` grant.
 *   - Delete: org-wide `project:delete` OR ownership OR editor/manager grant.
 *     Note the backend's own delete view is gated only on `project:view` at
 *     the coarse RBAC layer - the real authority is
 *     `FileService._assert_can_write`, deliberately not the org-wide
 *     `project:delete` permission, because "deleting one of its files is
 *     something the project's own owner/editor should be able to delegate via
 *     a per-project grant" (apps/files/api/v1/views/files.py comment).
 *   - Member on Shared Project holds an editor grant (seed data), so Member
 *     can upload/delete files there despite not holding org-wide
 *     project:create/delete as an Admin/Owner would.
 *
 * Rename: `useProjectFiles.ts` exposes a working `rename()` and the locale
 * strings exist (`t.projects.files.actions.rename`, `toast.renamed`), but
 * `ProjectFilesSection.tsx` wires no rename button/input despite its own
 * header comment listing "rename" among what the section does - grep confirms
 * zero rename control in the JSX. This is a real UI gap: rename cannot be
 * exercised through the UI, so it is intentionally skipped here rather than
 * asserting against a selector that doesn't exist.
 *
 * PDF preview: verified with a hand-built, dependency-free multi-page PDF
 * fixture (e2e/fixtures/pdf.ts) rather than skipping it as impractical.
 *
 * Uses the DEBUG-only `seed_demo_users` fixtures (Demo Org). Runs under the
 * `rbac` Playwright project.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../../src/locales';
import { loginAsNewContext } from '../../helpers';
import { buildTestPdf } from '../../fixtures/pdf';

const PASSWORD = 'Demo@12345';
const DEMO_OWNER = 'demo.owner@example.com';
const DEMO_MEMBER = 'demo.member@example.com';
const DEMO_READONLY = 'demo.readonly@example.com';

async function goToSharedProject(page: import('@playwright/test').Page) {
  await page.goto('/projects');
  await page.getByRole('link', { name: 'Shared Project' }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+$/, { timeout: 10_000 });
}

test.describe('Project Files: upload, PDF preview, delete', () => {
  // Upload + a real pdf.js render + delete, each with its own generous wait,
  // does not fit Playwright's 30s default — especially against a dev server
  // compiling the project-detail route on first hit. The individual `expect`
  // timeouts are the meaningful assertions; this is just headroom for the sum.
  test('an editor-grant Member can upload a PDF, preview it, and delete it', async ({
    browser,
  }) => {
    test.setTimeout(90_000);
    const { context, page } = await loginAsNewContext(browser, DEMO_MEMBER, PASSWORD);
    try {
      await goToSharedProject(page);

      await expect(page.getByRole('button', { name: t.projects.files.uploadButton })).toBeVisible({
        timeout: 10_000,
      });
      await page.getByRole('button', { name: t.projects.files.uploadButton }).click();
      const dialog = page.getByRole('dialog');

      const fileName = `e2e-test-${Date.now()}.pdf`;
      await dialog.locator('input[type="file"]').setInputFiles({
        name: fileName,
        mimeType: 'application/pdf',
        buffer: buildTestPdf(2),
      });
      // Name auto-fills from the selected file per handleFileSelected; leave
      // it as-is.
      await dialog.getByRole('button', { name: t.projects.files.form.submit }).click();
      await expect(page.getByText(t.projects.files.toast.uploaded)).toBeVisible({
        timeout: 15_000,
      });

      const fileRow = page.locator('tbody tr', { has: page.getByText(fileName) });
      await expect(fileRow).toBeVisible({ timeout: 10_000 });

      // Preview: click the file name to open the inline PDF preview.
      await fileRow.getByRole('button', { name: fileName }).click();
      // pdf.js reports page count via t.projects.files.pdf.pageOf ("Page 1 of 2").
      await expect(page.getByText('Page 1 of 2')).toBeVisible({ timeout: 15_000 });

      // Delete: no confirm dialog wraps this action in the component - it
      // fires immediately on click.
      await fileRow.getByRole('button', { name: t.projects.files.actions.delete }).click();
      await expect(page.getByText(t.projects.files.toast.deleted)).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('tbody tr', { has: page.getByText(fileName) })).toHaveCount(0, {
        timeout: 10_000,
      });
    } finally {
      await context.close();
    }
  });

  test('Read Only (no ProjectAccess grant on Shared Project, no org-wide project:create) sees no upload control', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_READONLY, PASSWORD);
    try {
      // Read Only has no ProjectAccess grant on either seeded project (see
      // project-access-scoping.spec.ts), so Shared Project itself is not even
      // in this account's project list - confirming that first is the honest
      // assertion, rather than assuming the Files section renders at all.
      await page.goto('/projects');
      await expect(page.getByRole('link', { name: 'Shared Project' })).toHaveCount(0, {
        timeout: 10_000,
      });
    } finally {
      await context.close();
    }
  });

  test('the Owner can upload and delete files on Private Project (ownership, no explicit grant needed)', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      await page.goto('/projects');
      await page.getByRole('link', { name: 'Private Project' }).click();
      await expect(page).toHaveURL(/\/projects\/[^/]+$/, { timeout: 10_000 });

      await expect(page.getByRole('button', { name: t.projects.files.uploadButton })).toBeVisible({
        timeout: 10_000,
      });
      await page.getByRole('button', { name: t.projects.files.uploadButton }).click();
      const dialog = page.getByRole('dialog');
      const fileName = `e2e-owner-${Date.now()}.pdf`;
      await dialog.locator('input[type="file"]').setInputFiles({
        name: fileName,
        mimeType: 'application/pdf',
        buffer: buildTestPdf(1),
      });
      await dialog.getByRole('button', { name: t.projects.files.form.submit }).click();
      await expect(page.getByText(t.projects.files.toast.uploaded)).toBeVisible({
        timeout: 15_000,
      });

      const fileRow = page.locator('tbody tr', { has: page.getByText(fileName) });
      await expect(
        fileRow.getByRole('button', { name: t.projects.files.actions.delete })
      ).toBeVisible({
        timeout: 10_000,
      });
      await fileRow.getByRole('button', { name: t.projects.files.actions.delete }).click();
      await expect(page.getByText(t.projects.files.toast.deleted)).toBeVisible({ timeout: 10_000 });
    } finally {
      await context.close();
    }
  });
});
