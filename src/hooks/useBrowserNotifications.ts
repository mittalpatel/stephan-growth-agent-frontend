'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { format } from '@/lib/i18n';
import { t } from '@/locales';
import type { NotificationEventType } from '@/services/notifications';

/** The shape pushed over the websocket by `NotificationDispatcher._push_realtime`. */
export interface PushedNotification {
  id: string;
  event_type: NotificationEventType;
  payload: Record<string, unknown>;
  created_at: string;
}

export type BrowserPermission = 'default' | 'granted' | 'denied' | 'unsupported';

function currentPermission(): BrowserPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as BrowserPermission;
}

/**
 * `Notification.permission` is external, mutable, non-reactive browser state,
 * so it is read through `useSyncExternalStore` rather than mirrored into
 * `useState` from an effect: the value is unavailable during SSR, and copying
 * it in an effect both trips `react-hooks/set-state-in-effect` and renders one
 * frame of a value that is already known to be wrong.
 *
 * The browser fires no event when permission changes, so `subscribe` exists to
 * let `request()` announce the answer it just received. Listeners live at
 * module scope so every mounted consumer re-reads together.
 */
const permissionListeners = new Set<() => void>();

function subscribePermission(onChange: () => void): () => void {
  permissionListeners.add(onChange);
  return () => permissionListeners.delete(onChange);
}

function announcePermissionChange(): void {
  for (const listener of permissionListeners) listener();
}

// Returns a primitive, so referential stability across calls is automatic —
// no caching needed to avoid the infinite re-render `useSyncExternalStore`
// punishes object snapshots with.
const serverPermission = (): BrowserPermission => 'unsupported';

function str(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === 'string' ? value : '';
}

/**
 * Turn a pushed notification into desktop-notification text.
 *
 * Returns `null` for event types with no browser copy — an unknown or
 * deliberately-quiet event should raise no window, rather than showing a raw
 * `event_type` slug to the user.
 */
export function browserNotificationText(
  note: PushedNotification
): { title: string; body: string } | null {
  const copy = t.notifications.browser;

  if (note.event_type === 'project_shared') {
    const grantedBy = str(note.payload, 'granted_by');
    const values = {
      granted_by: grantedBy,
      project_name: str(note.payload, 'project_name'),
      access_level: str(note.payload, 'access_level'),
    };
    return {
      title: copy.project_shared.title,
      body: format(grantedBy ? copy.project_shared.body : copy.project_shared.bodyNoActor, values),
    };
  }

  if (note.event_type === 'invite_accepted') {
    return {
      title: copy.invite_accepted.title,
      body: format(copy.invite_accepted.body, {
        accepted_by: str(note.payload, 'accepted_by') || str(note.payload, 'email'),
      }),
    };
  }

  return null;
}

/**
 * Desktop notifications for events pushed over the realtime socket.
 *
 * Permission is never requested on mount: browsers increasingly ignore (or
 * penalise) an unprompted `requestPermission()` on page load, and a permission
 * dialog nobody asked for is the exact pattern they are penalising. `request()`
 * is exposed for a real user gesture to call instead — see the bell's
 * "Enable desktop notifications" action.
 *
 * `notify()` is a no-op unless permission is already granted, so callers can
 * invoke it unconditionally on every push without branching.
 */
export function useBrowserNotifications() {
  const permission = useSyncExternalStore(
    subscribePermission,
    currentPermission,
    serverPermission
  );

  const request = useCallback(async (): Promise<BrowserPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    try {
      const result = (await Notification.requestPermission()) as BrowserPermission;
      announcePermissionChange();
      return result;
    } catch {
      // Older Safari rejects rather than resolving 'denied'. Treat the same.
      announcePermissionChange();
      return 'denied';
    }
  }, []);

  const notify = useCallback((note: PushedNotification) => {
    // Re-read rather than trusting state: permission can be revoked in browser
    // settings mid-session, and a stale 'granted' would throw on construction.
    if (currentPermission() !== 'granted') return;
    if (document.visibilityState === 'visible') return; // already looking at the app

    const text = browserNotificationText(note);
    if (text === null) return;

    try {
      // `tag` collapses repeats of the same notification (a reconnecting socket
      // can redeliver) into one OS-level bubble instead of stacking duplicates.
      new Notification(text.title, { body: text.body, tag: note.id });
    } catch {
      // Some browsers (notably Android Chrome) only permit notifications via a
      // service worker and throw on the constructor. Nothing to recover — the
      // in-app bell already updated.
    }
  }, []);

  return { permission, request, notify };
}
