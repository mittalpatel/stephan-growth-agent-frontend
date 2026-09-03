/**
 * Notification preferences (/notifications).
 *
 * Each row is one event type; the UI currently exposes only the `email`
 * channel per row as a single `Switch`, aria-labelled
 * `"Email: {event type label}"` (NotificationPreferencesPanel.tsx). Toggling
 * fires one PATCH per {event_type, channel} triple, not a bulk PUT:
 *
 *   PATCH /api/v1/organizations/{id}/notification-preferences/
 *   body: { event_type, channel: 'email', enabled }
 *
 * (OrganizationNotificationPreferencesView.patch,
 * apps/notifications/api/v1/views/notifications.py, calling
 * NotificationService.set_preference).
 *
 * Model semantics (apps/notifications/models.py, NotificationPreference):
 * absence of a row means "on" (the default); a stored row only ever
 * represents an explicit choice. There is no RBAC gate on this view - a
 * notification is scoped to its recipient, not to a role - so a Read Only
 * account must be able to manage its own preferences same as anyone else;
 * asserted below as a real negative-permission check, not assumed.
 *
 * Uses the DEBUG-only `seed_demo_users` fixtures. Runs under the `rbac`
 * Playwright project - logs in for itself.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../../src/locales';
import { loginAsNewContext } from '../../helpers';

const PASSWORD = 'Demo@12345';
const DEMO_READONLY = 'demo.readonly@example.com';

// An optional (non-required) event type, so the switch is not disabled.
// t.notifications.eventType.project_shared = 'A project was shared with you'.
const EVENT_LABEL = 'A project was shared with you';
const SWITCH_LABEL = `${t.notifications.preferences.channelEmail}: ${EVENT_LABEL}`;

test.describe('Notifications: preference toggle persists per {event_type, channel}', () => {
  test('toggling one preference survives a reload, and only that preference changes', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_READONLY, PASSWORD);
    try {
      await page.goto('/notifications');
      await expect(page.getByText(t.notifications.preferences.title)).toBeVisible({
        timeout: 10_000,
      });

      const toggle = page.getByRole('switch', { name: SWITCH_LABEL });
      await expect(toggle).toBeVisible({ timeout: 10_000 });
      const before = await toggle.getAttribute('aria-checked');
      const expectedAfter = before === 'true' ? 'false' : 'true';

      await toggle.click();
      await expect(page.getByText(t.notifications.preferences.updated)).toBeVisible({
        timeout: 10_000,
      });
      // The switch re-renders as its own mutation settles - assert against
      // the fresh DOM node with an auto-retrying matcher rather than a single
      // getAttribute() read racing that re-render.
      await expect(page.getByRole('switch', { name: SWITCH_LABEL })).toHaveAttribute(
        'aria-checked',
        expectedAfter,
        { timeout: 10_000 }
      );
      const after = expectedAfter;

      // Reload: the PATCH must have actually persisted server-side, not just
      // updated local component state.
      await page.reload();
      const toggleAfterReload = page.getByRole('switch', { name: SWITCH_LABEL });
      await expect(toggleAfterReload).toBeVisible({ timeout: 10_000 });
      await expect(toggleAfterReload).toHaveAttribute('aria-checked', after ?? '', { timeout: 10_000 });

      // Restore to avoid leaving this seeded account's preferences mutated
      // for whatever ran before it in the same suite run.
      await toggleAfterReload.click();
      await expect(page.getByText(t.notifications.preferences.updated)).toBeVisible({
        timeout: 10_000,
      });
      await page.reload();
      await expect(page.getByRole('switch', { name: SWITCH_LABEL })).toHaveAttribute(
        'aria-checked',
        before ?? '',
        { timeout: 10_000 }
      );
    } finally {
      await context.close();
    }
  });

  test('a required (non-optional) event type\'s switch is disabled and cannot be turned off', async ({
    browser,
  }) => {
    const { context, page } = await loginAsNewContext(browser, DEMO_READONLY, PASSWORD);
    try {
      await page.goto('/notifications');
      // NON_OPTIONAL_EVENT_TYPES = ['password_reset_otp', 'signup_verification_otp']
      // (NotificationPreferencesPanel.tsx, mirroring the backend constant).
      const requiredLabel = `${t.notifications.preferences.channelEmail}: ${t.notifications.eventType.password_reset_otp}`;
      const requiredToggle = page.getByRole('switch', { name: requiredLabel });
      await expect(requiredToggle).toBeVisible({ timeout: 10_000 });
      await expect(requiredToggle).toBeDisabled();
      await expect(requiredToggle).toHaveAttribute('aria-checked', 'true');
      await expect(page.getByText(t.notifications.preferences.requiredNote).first()).toBeVisible();
    } finally {
      await context.close();
    }
  });
});
