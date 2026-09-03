import { describe, it, expect } from 'vitest';

import { browserNotificationText, type PushedNotification } from '@/hooks/useBrowserNotifications';

function push(overrides: Partial<PushedNotification>): PushedNotification {
  return {
    id: 'n1',
    event_type: 'project_shared',
    payload: {},
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('browserNotificationText', () => {
  it('names the sharer, project, and level for project_shared', () => {
    const text = browserNotificationText(
      push({
        payload: {
          granted_by: 'Ada Lovelace',
          project_name: 'Apollo',
          access_level: 'editor',
        },
      })
    );

    expect(text).toEqual({
      title: 'Project shared with you',
      body: 'Ada Lovelace gave you editor access to Apollo',
    });
  });

  it('falls back to actorless copy when the sharer is unknown', () => {
    const text = browserNotificationText(
      push({ payload: { project_name: 'Apollo', access_level: 'viewer' } })
    );

    expect(text?.body).toBe('You were given viewer access to Apollo');
  });

  it('returns null for an event with no browser copy, so no window is raised', () => {
    expect(browserNotificationText(push({ event_type: 'password_reset_otp' }))).toBeNull();
  });

  it('ignores non-string payload values rather than rendering [object Object]', () => {
    const text = browserNotificationText(
      push({ payload: { project_name: { nested: true }, access_level: 'viewer' } })
    );

    expect(text?.body).toBe('You were given viewer access to ');
  });
});
