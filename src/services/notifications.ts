/**
 * Notification endpoints, query keys, and payload types.
 *
 * A service module owns three things and nothing else: the endpoint strings, the
 * query keys, and the param building. No React, no state, no fetching — see
 * `context/api.md`.
 */

import { buildListParams, type ListQuery } from './listParams';

export const organizationNotificationsEndpoint = (organizationId: string): string =>
  `/api/v1/organizations/${organizationId}/notifications/`;

export const organizationNotificationUnreadCountEndpoint = (organizationId: string): string =>
  `${organizationNotificationsEndpoint(organizationId)}unread-count/`;

export const organizationNotificationReadEndpoint = (
  organizationId: string,
  notificationId: string
): string => `${organizationNotificationsEndpoint(organizationId)}${notificationId}/read/`;

export const organizationNotificationReadAllEndpoint = (organizationId: string): string =>
  `${organizationNotificationsEndpoint(organizationId)}read-all/`;

export const organizationNotificationPreferencesEndpoint = (organizationId: string): string =>
  `${organizationNotificationsEndpoint(organizationId)}preferences/`;

/** The `?type=parameters` request that drives the list toolbar's filter configs. */
export const organizationNotificationsParametersUrl = (organizationId: string): string =>
  `${organizationNotificationsEndpoint(organizationId)}?type=parameters`;

/** Builds the notifications list URL from the shared list-param contract. */
export function organizationNotificationsListUrl(organizationId: string, query: ListQuery): string {
  const search = new URLSearchParams(
    Object.entries(buildListParams(query)).map(([key, value]) => [key, String(value)])
  );
  return `${organizationNotificationsEndpoint(organizationId)}?${search.toString()}`;
}

// -- Query keys ------------------------------------------------------------
// The organization id is part of every key: without it, switching organizations
// would read the previous tenant's cached entry under the new tenant's name.
export const organizationNotificationsKey = (organizationId: string) => [
  'organization-notifications',
  organizationId,
];
export const organizationNotificationsParametersKey = (organizationId: string) => [
  'organization-notifications-parameters',
  organizationId,
];
export const organizationNotificationUnreadCountKey = (organizationId: string) => [
  'organization-notification-unread-count',
  organizationId,
];
export const organizationNotificationPreferencesKey = (organizationId: string) => [
  'organization-notification-preferences',
  organizationId,
];

// -- Payloads ----------------------------------------------------------------

/** Mirrors `apps.notifications.constants.EventType` exactly. */
export type NotificationEventType =
  | 'password_reset_otp'
  | 'signup_verification_otp'
  | 'organization_invite'
  | 'organization_added'
  | 'new_device_login'
  | 'invite_accepted'
  | 'project_shared'
  | 'conversation_assigned';

/** Mirrors `apps.notifications.constants.Channel` exactly. */
export type NotificationChannel = 'email' | 'in_app';

export interface NotificationRow {
  id: string;
  event_type: NotificationEventType;
  payload: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/** `{ [eventType]: { [channel]: enabled } }` — mirrors `NotificationService.list_preferences`. */
export type NotificationPreferences = Record<string, Record<string, boolean>>;

export interface UpdateNotificationPreferencePayload {
  event_type: NotificationEventType;
  channel: NotificationChannel;
  enabled: boolean;
}
