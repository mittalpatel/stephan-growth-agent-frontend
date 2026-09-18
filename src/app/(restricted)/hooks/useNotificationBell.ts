'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { t } from '@/locales';
import {
  organizationNotificationReadAllEndpoint,
  organizationNotificationReadEndpoint,
  organizationNotificationUnreadCountEndpoint,
  organizationNotificationUnreadCountKey,
  organizationNotificationsEndpoint,
  organizationNotificationsKey,
  type NotificationRow,
} from '@/services/notifications';
import type { ApiResponse } from '@/types/api';

/** How often the bell polls for new notifications, as a fail-open backstop.
 * `useRealtimeSocket` (mounted in `LayoutWrapper`) invalidates these same
 * queries the moment a notification is pushed live, so this interval never
 * has to do the work in the common case — it only matters if the socket never
 * connected (blocked upgrade, channel-layer outage). Every open tab polls
 * independently, so a short interval multiplies fast; 5 minutes is still
 * prompt enough for that fallback path without hammering the backend. */
const POLL_INTERVAL_MS = 300_000;

/** How many recent notifications the dropdown shows before "View all". */
const RECENT_LIMIT = 5;

/**
 * Header bell: unread count (polled) and a short recent list, plus mark-read
 * actions. The full paginated list lives in `/notifications`'s own hook — this
 * one exists only to feed the dropdown and stays intentionally small.
 */
export function useNotificationBell() {
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? '';
  const [open, setOpen] = useState(false);
  const { permission, request: requestPermission } = useBrowserNotifications();

  const unreadQuery = useAuthQuery<ApiResponse<{ unread_count: number }>>(
    organizationNotificationUnreadCountKey(organizationId),
    organizationNotificationUnreadCountEndpoint(organizationId),
    { enabled: Boolean(organizationId), refetchInterval: POLL_INTERVAL_MS }
  );

  const recentQuery = useAuthQuery<ApiResponse<NotificationRow[]>>(
    [...organizationNotificationsKey(organizationId), 'recent'],
    `${organizationNotificationsEndpoint(organizationId)}?page=1&page_size=${RECENT_LIMIT}`,
    // Only while the dropdown is open — polling a list nobody is looking at
    // wastes a request every interval for no visible benefit.
    { enabled: Boolean(organizationId) && open, refetchInterval: open ? POLL_INTERVAL_MS : false }
  );

  const { mutateAsync: mutate } = useAuthMutation();

  const markRead = useCallback(
    async (notificationId: string) => {
      try {
        await mutate({
          url: organizationNotificationReadEndpoint(organizationId, notificationId),
          method: 'post',
        });
        await Promise.all([unreadQuery.refetch(), recentQuery.refetch()]);
      } catch (error) {
        applyApiError(error, { fallbackMessage: t.notifications.errorTitle });
      }
    },
    [mutate, organizationId, unreadQuery, recentQuery]
  );

  const markAllRead = useCallback(async () => {
    try {
      await mutate({
        url: organizationNotificationReadAllEndpoint(organizationId),
        method: 'post',
      });
      toast.success(t.notifications.allMarkedRead);
      await Promise.all([unreadQuery.refetch(), recentQuery.refetch()]);
    } catch (error) {
      applyApiError(error, { fallbackMessage: t.notifications.errorTitle });
    }
  }, [mutate, organizationId, unreadQuery, recentQuery]);

  /** Ask the browser for desktop-notification permission, with feedback.
   *
   * Must be driven by a user gesture (the bell's menu item), never called on
   * mount — see `useBrowserNotifications`. */
  const requestBrowserPermission = useCallback(async () => {
    const result = await requestPermission();
    if (result === 'granted') toast.success(t.notifications.browser.enabled);
    else if (result === 'denied') toast.error(t.notifications.browser.blocked);
  }, [requestPermission]);

  return {
    open,
    onOpenChange: setOpen,
    unreadCount: unreadQuery.data?.data.unread_count ?? 0,
    recent: recentQuery.data?.data ?? [],
    isLoading: recentQuery.isLoading,
    markRead,
    markAllRead,
    permission,
    requestBrowserPermission,
  };
}
