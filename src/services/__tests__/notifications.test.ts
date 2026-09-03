import { describe, it, expect } from 'vitest';

import {
  organizationNotificationPreferencesEndpoint,
  organizationNotificationPreferencesKey,
  organizationNotificationReadAllEndpoint,
  organizationNotificationReadEndpoint,
  organizationNotificationUnreadCountEndpoint,
  organizationNotificationUnreadCountKey,
  organizationNotificationsEndpoint,
  organizationNotificationsKey,
  organizationNotificationsListUrl,
  organizationNotificationsParametersKey,
  organizationNotificationsParametersUrl,
} from '../notifications';

const ORG_ID = '0c2f6a1e-1111-4a2b-8c3d-4e5f60718293';
const OTHER_ORG_ID = 'aaaaaaaa-1111-4a2b-8c3d-4e5f60718293';
const NOTIFICATION_ID = 'b1c2d3e4-3333-4f5a-8b9c-0d1e2f3a4b5c';

describe('notification endpoints', () => {
  it('builds every endpoint under the org-scoped notifications root', () => {
    // Django's APPEND_SLASH means a missing trailing slash costs a redirect on
    // every call, so each builder must produce one.
    const urls = [
      organizationNotificationsEndpoint(ORG_ID),
      organizationNotificationUnreadCountEndpoint(ORG_ID),
      organizationNotificationReadEndpoint(ORG_ID, NOTIFICATION_ID),
      organizationNotificationReadAllEndpoint(ORG_ID),
      organizationNotificationPreferencesEndpoint(ORG_ID),
    ];
    for (const url of urls) {
      expect(url.startsWith(`/api/v1/organizations/${ORG_ID}/notifications/`)).toBe(true);
      expect(url.endsWith('/')).toBe(true);
    }
  });

  it('nests both the organization and notification id in the read endpoint', () => {
    expect(organizationNotificationReadEndpoint(ORG_ID, NOTIFICATION_ID)).toBe(
      `/api/v1/organizations/${ORG_ID}/notifications/${NOTIFICATION_ID}/read/`
    );
  });

  it('builds the parameters URL from the list endpoint', () => {
    expect(organizationNotificationsParametersUrl(ORG_ID)).toBe(
      `${organizationNotificationsEndpoint(ORG_ID)}?type=parameters`
    );
  });
});

describe('notification list URL', () => {
  const baseQuery = {
    page: 1,
    limit: 25,
    search: [] as string[],
    search_by: '',
    sort: '',
    sort_direction: 'desc' as const,
    filter: [] as string[],
    filter_by: [] as string[],
  };

  it('sends only pagination when nothing is filtered', () => {
    const url = organizationNotificationsListUrl(ORG_ID, baseQuery);
    expect(url).toBe(`${organizationNotificationsEndpoint(ORG_ID)}?page=1&page_size=25`);
  });

  it('encodes a filter in the shared list-param shape', () => {
    const url = organizationNotificationsListUrl(ORG_ID, {
      ...baseQuery,
      filter: ['event_type'],
      filter_by: ['organization_added'],
    });
    const params = new URLSearchParams(url.split('?')[1]);

    expect(params.get('filter')).toBe('event_type');
    expect(params.get('filter_by')).toBe('organization_added');
  });
});

describe('notification query keys', () => {
  it('keys every cache by organization id', () => {
    expect(organizationNotificationsKey(ORG_ID)).toEqual(['organization-notifications', ORG_ID]);
    expect(organizationNotificationsParametersKey(ORG_ID)).toEqual([
      'organization-notifications-parameters',
      ORG_ID,
    ]);
    expect(organizationNotificationUnreadCountKey(ORG_ID)).toEqual([
      'organization-notification-unread-count',
      ORG_ID,
    ]);
    expect(organizationNotificationPreferencesKey(ORG_ID)).toEqual([
      'organization-notification-preferences',
      ORG_ID,
    ]);
  });

  it('produces different keys for different organizations', () => {
    expect(organizationNotificationsKey(ORG_ID)).not.toEqual(
      organizationNotificationsKey(OTHER_ORG_ID)
    );
    expect(organizationNotificationUnreadCountKey(ORG_ID)).not.toEqual(
      organizationNotificationUnreadCountKey(OTHER_ORG_ID)
    );
  });

  it('gives each cache its own namespace', () => {
    const namespaces = [
      organizationNotificationsKey(ORG_ID)[0],
      organizationNotificationsParametersKey(ORG_ID)[0],
      organizationNotificationUnreadCountKey(ORG_ID)[0],
      organizationNotificationPreferencesKey(ORG_ID)[0],
    ];
    expect(new Set(namespaces).size).toBe(namespaces.length);
  });
});
