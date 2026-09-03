/**
 * Spot-check narrow-viewport (375x667, iPhone SE-ish) layout: the shared
 * auth shell collapses to a single centered card, the 6-box OTP input does
 * not overflow at that width, and a handful of key dialogs render without
 * horizontal overflow or clipped content.
 *
 * No visual-regression tooling is set up here, so this asserts structure
 * (an element is hidden vs visible, `scrollWidth` does not exceed
 * `clientWidth`, interactive elements stay within the viewport) rather than
 * pixel-diffing.
 *
 * `AuthHeroShell.tsx` (src/app/(public)/components/AuthHeroShell.tsx) is the
 * chrome shared by `/login`, `/signup`, `/forgot-password`, `/login/otp`, and
 * `/login/backup-code` per its own doc comment: the left branding panel is
 * `hidden ... md:flex` (line 34), so below `md` (768px) it must not render,
 * and the right-hand card sits in a `flex-1 ... items-center justify-center`
 * column (line 46) so it stays centered rather than pinned to a half-width
 * slot.
 *
 * The OTP page normally requires a live MFA challenge in `sessionStorage`
 * (see `useMfaVerifyForm.ts` / `mfaChallengeStorage.ts`) before it renders
 * the form instead of redirecting to `/login`. A fake challenge is seeded via
 * `addInitScript` purely to reach the page for a layout check - no attempt is
 * made to submit it.
 *
 * Runs under the `rbac` Playwright project - logs in for itself where a
 * dialog requires an authenticated session; the auth-shell/OTP checks are
 * unauthenticated.
 */
import { test, expect, type Page } from '@playwright/test';

import { t } from '../../../src/locales';
import { loginAsNewContext } from '../../helpers';

const PASSWORD = 'Demo@12345';
const DEMO_OWNER = 'demo.owner@example.com';
const VIEWPORT = { width: 375, height: 667 };

/**
 * The `AuthHeroShell` branding panel is collapsed at this width.
 *
 * Two things make the obvious `getByText(appName)).toHaveCount(0)` wrong, and
 * both of them made this spec fail against a shell that was behaving
 * correctly:
 *   1. The panel is `hidden md:flex` — `display:none`, still in the DOM. A
 *      count assertion sees it; only a visibility assertion doesn't.
 *   2. The app name is a *substring* of the copyright line
 *      ("© 2026 YB Inspire. All rights reserved."), which is `md:hidden`
 *      and therefore deliberately visible here. `exact` pins the query to the
 *      panel's own name element and off both the copyright and the ancestor
 *      containers whose combined text also contains it.
 */
async function expectBrandingPanelCollapsed(page: Page) {
  await expect(page.getByText(t.common.appName, { exact: true })).toBeHidden();
}

/** No element forces the page wider than its own viewport. */
async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
  });
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

test.describe('Responsive layout at 375x667', () => {
  test.use({ viewport: VIEWPORT });

  test('login page: split-screen shell collapses to a single centered card', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: t.auth.signInButton })).toBeVisible();

    await expectBrandingPanelCollapsed(page);
    await expect(page.getByText(t.auth.heroTagline, { exact: true })).toBeHidden();

    await expectNoHorizontalOverflow(page);
  });

  test('signup page: same shell, same collapse', async ({ page }) => {
    await page.goto('/signup');
    await expectBrandingPanelCollapsed(page);
    await expectNoHorizontalOverflow(page);
  });

  test('forgot-password page: same shell, same collapse', async ({ page }) => {
    await page.goto('/forgot-password');
    await expectBrandingPanelCollapsed(page);
    await expectNoHorizontalOverflow(page);
  });

  test('login/otp: shell collapses and the 6-box OTP input does not overflow', async ({ page }) => {
    // Seed a fake challenge so the page renders the form instead of
    // redirecting to /login (see mfaChallengeStorage.ts's STORAGE_KEY).
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'auth:mfaChallenge',
        JSON.stringify({ challenge: 'e2e-fake-challenge', callbackUrl: null })
      );
    });
    await page.goto('/login/otp');

    await expectBrandingPanelCollapsed(page);

    const otpGroup = page.getByRole('group');
    await expect(otpGroup).toBeVisible({ timeout: 10_000 });
    const box = await otpGroup.boundingBox();
    const viewportSize = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewportSize).not.toBeNull();
    if (box && viewportSize) {
      // The whole 6-box group must fit inside the viewport width - the
      // regression this component's own `min-w-0` comment describes was the
      // boxes ballooning past their container at ~1200px inside a 384px
      // dialog; a 375px viewport is the tightest realistic case.
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewportSize.width + 1);
    }

    await expectNoHorizontalOverflow(page);
  });

  test('Create Project dialog renders usably with no horizontal overflow', async ({ browser }) => {
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();
    try {
      await page.goto('/login');
      await page.getByLabel(t.auth.emailPlaceholder).fill(DEMO_OWNER);
      await page.getByLabel(t.auth.passwordPlaceholder, { exact: true }).fill(PASSWORD);
      await page.getByRole('button', { name: t.auth.signInButton }).click();
      await expect(page).not.toHaveURL(/\/login|\/no-role/, { timeout: 15_000 });

      await page.goto('/projects');
      await page.getByRole('button', { name: t.projects.actions.create }).click();
      const dialog = page.getByRole('dialog', { name: t.projects.form.createTitle });
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      const box = await dialog.boundingBox();
      const viewportSize = page.viewportSize();
      expect(box).not.toBeNull();
      expect(viewportSize).not.toBeNull();
      if (box && viewportSize) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewportSize.width + 1);
      }
      await expectNoHorizontalOverflow(page);

      await expect(page.getByLabel(t.projects.form.nameLabel)).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('Invite Member dialog renders usably with no horizontal overflow', async ({ browser }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_OWNER, PASSWORD);
    try {
      await page.setViewportSize(VIEWPORT);
      await page.goto('/organization/members');
      await page.getByRole('button', { name: t.organizations.invite.title }).click();
      const dialog = page.getByRole('dialog', { name: t.organizations.invite.title });
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      const box = await dialog.boundingBox();
      const viewportSize = page.viewportSize();
      expect(box).not.toBeNull();
      expect(viewportSize).not.toBeNull();
      if (box && viewportSize) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewportSize.width + 1);
      }
      await expectNoHorizontalOverflow(page);

      await expect(page.getByLabel(t.organizations.invite.emailLabel)).toBeVisible();
    } finally {
      await context.close();
    }
  });
});
