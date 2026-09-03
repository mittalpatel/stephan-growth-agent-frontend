import { describe, it, expect } from 'vitest';

import {
  AUDIT_SEARCH_COLUMNS,
  ORGANIZATIONS_ENDPOINT,
  ORGANIZATIONS_LIST_KEY,
  ORGANIZATION_SWITCH_ROUTE,
  organizationAuditDetailEndpoint,
  organizationAuditDetailKey,
  organizationAuditEndpoint,
  organizationAuditKey,
  organizationAuditListUrl,
  organizationAuditParametersKey,
  organizationAuditParametersUrl,
  organizationDetailEndpoint,
  organizationDetailKey,
  organizationInviteEndpoint,
  organizationInviteResendEndpoint,
  organizationInvitesEndpoint,
  organizationInvitesKey,
  organizationMemberEndpoint,
  organizationMembersEndpoint,
  organizationMembersKey,
  organizationRolePermissionsEndpoint,
  organizationRolesEndpoint,
  organizationRolesKey,
  roleDetailEndpoint,
  roleDetailKey,
  userPermissionsExplainEndpoint,
  userPermissionsExplainKey,
} from '../organizations';

const ORG_ID = '0c2f6a1e-1111-4a2b-8c3d-4e5f60718293';
const USER_ID = '9a8b7c6d-2222-4e3f-9a0b-1c2d3e4f5a6b';
const INVITE_ID = 'b1c2d3e4-3333-4f5a-8b9c-0d1e2f3a4b5c';
const ROLE_ID = 'd4e5f6a7-4444-4b5c-9d0e-1f2a3b4c5d6e';

describe('organization endpoints', () => {
  it('builds every endpoint under the versioned organizations root', () => {
    // Django's APPEND_SLASH means a missing trailing slash costs a redirect on
    // every call, so each builder must produce one.
    const urls = [
      ORGANIZATIONS_ENDPOINT,
      organizationDetailEndpoint(ORG_ID),
      organizationMembersEndpoint(ORG_ID),
      organizationMemberEndpoint(ORG_ID, USER_ID),
      organizationInvitesEndpoint(ORG_ID),
      organizationRolesEndpoint(ORG_ID),
    ];
    for (const url of urls) {
      expect(url.startsWith('/api/v1/organizations/')).toBe(true);
      expect(url.endsWith('/')).toBe(true);
    }
  });

  it('nests the organization id in every scoped endpoint', () => {
    expect(organizationDetailEndpoint(ORG_ID)).toBe(`/api/v1/organizations/${ORG_ID}/`);
    expect(organizationMembersEndpoint(ORG_ID)).toBe(`/api/v1/organizations/${ORG_ID}/members/`);
    expect(organizationRolesEndpoint(ORG_ID)).toBe(`/api/v1/organizations/${ORG_ID}/roles/`);
    expect(organizationInvitesEndpoint(ORG_ID)).toBe(`/api/v1/organizations/${ORG_ID}/invites/`);
  });

  // The switch is deliberately NOT a backend endpoint builder. It mints a token
  // pair, so it is called through a same-origin route that keeps both tokens in
  // the httpOnly cookie; a builder here would invite calling it from the browser
  // and reintroduce the refresh-token exposure.
  it('routes the organization switch through a same-origin handler, not the backend', () => {
    expect(ORGANIZATION_SWITCH_ROUTE).toBe('/api/auth/organization-switch');
    expect(ORGANIZATION_SWITCH_ROUTE.startsWith('/api/v1/')).toBe(false);
  });

  it('scopes a member endpoint to both the organization and the user', () => {
    expect(organizationMemberEndpoint(ORG_ID, USER_ID)).toBe(
      `/api/v1/organizations/${ORG_ID}/members/${USER_ID}/`
    );
  });

  it('scopes an invite endpoint to both the organization and the invite', () => {
    expect(organizationInviteEndpoint(ORG_ID, INVITE_ID)).toBe(
      `/api/v1/organizations/${ORG_ID}/invites/${INVITE_ID}/`
    );
    expect(organizationInviteResendEndpoint(ORG_ID, INVITE_ID)).toBe(
      `/api/v1/organizations/${ORG_ID}/invites/${INVITE_ID}/resend/`
    );
  });

  it('builds the org-scoped audit trail endpoint', () => {
    expect(organizationAuditEndpoint(ORG_ID)).toBe(`/api/v1/organizations/${ORG_ID}/audit/`);
  });

  it('builds role endpoints under the rbac root, not the organizations root', () => {
    // These proxy the shared RBAC management API rather than duplicating it under
    // /organizations/, since a role edit/permission-set change is tenant-scoped by
    // the request's own JWT claim, not by an id in the path — so the endpoint
    // takes only a role id, never an organization id.
    expect(roleDetailEndpoint(ROLE_ID)).toBe(`/api/v1/rbac/roles/${ROLE_ID}/`);
    expect(organizationRolePermissionsEndpoint(ROLE_ID)).toBe(
      `/api/v1/rbac/roles/${ROLE_ID}/permissions/`
    );
  });

  it('builds the permission-inspector endpoint for a given user', () => {
    expect(userPermissionsExplainEndpoint(USER_ID)).toBe(
      `/api/v1/rbac/users/${USER_ID}/permissions/explain/`
    );
  });
});

describe('organization query keys', () => {
  it('keys detail and member caches by organization id', () => {
    // The id must be part of the key: switching organizations otherwise reads the
    // previous tenant's cached entry under the new tenant's name.
    expect(organizationDetailKey(ORG_ID)).toEqual(['organization-detail', ORG_ID]);
    expect(organizationMembersKey(ORG_ID)).toEqual(['organization-members', ORG_ID]);
    expect(organizationRolesKey(ORG_ID)).toEqual(['organization-roles', ORG_ID]);
  });

  it('gives each cache its own namespace', () => {
    const namespaces = [
      ORGANIZATIONS_LIST_KEY,
      organizationDetailKey(ORG_ID)[0],
      organizationMembersKey(ORG_ID)[0],
      organizationRolesKey(ORG_ID)[0],
    ];
    expect(new Set(namespaces).size).toBe(namespaces.length);
  });

  it('produces different keys for different organizations', () => {
    expect(organizationMembersKey(ORG_ID)).not.toEqual(organizationMembersKey(USER_ID));
  });

  it('keys the invites and audit caches by organization id', () => {
    expect(organizationInvitesKey(ORG_ID)).toEqual(['organization-invites', ORG_ID]);
    expect(organizationAuditKey(ORG_ID)).toEqual(['organization-audit', ORG_ID]);
  });

  it('keys the role-detail cache by role id alone', () => {
    // No org segment needed: the endpoint itself is tenant-scoped server-side.
    expect(roleDetailKey(ROLE_ID)).toEqual(['role-detail', ROLE_ID]);
  });

  it('keys the permission-explain cache by user id, independent of organization', () => {
    // The endpoint itself is tenant-scoped server-side via request.tenant, so the
    // key only needs to distinguish users, not organizations, for correctness —
    // but see the endpoint test above for why the URL has no org segment at all.
    expect(userPermissionsExplainKey(USER_ID)).toEqual(['user-permissions-explain', USER_ID]);
  });

  describe('audit trail', () => {
    const EVENT_ID = 'f1e2d3c4-5555-4a6b-8c7d-9e0f1a2b3c4d';

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

    it('nests the event id under the organization', () => {
      expect(organizationAuditDetailEndpoint(ORG_ID, EVENT_ID)).toBe(
        `/api/v1/organizations/${ORG_ID}/audit/${EVENT_ID}/`
      );
    });

    it('builds the parameters URL from the list endpoint', () => {
      expect(organizationAuditParametersUrl(ORG_ID)).toBe(
        `${organizationAuditEndpoint(ORG_ID)}?type=parameters`
      );
    });

    it('sends only pagination when nothing is filtered', () => {
      // A blank `search_by=` is a different request from no search at all, on
      // both sides of the wire — it would miss the cache on every unfiltered load.
      const url = organizationAuditListUrl(ORG_ID, baseQuery);

      expect(url).toBe(`${organizationAuditEndpoint(ORG_ID)}?page=1&page_size=25`);
    });

    it('encodes search, filters, and sort in the shared list-param shape', () => {
      const url = organizationAuditListUrl(ORG_ID, {
        ...baseQuery,
        search: ['actor', 'target'],
        search_by: 'alice@example.com',
        sort: 'created_at',
        filter: ['event'],
        filter_by: ['member_removed,member_invited'],
      });
      const params = new URLSearchParams(url.split('?')[1]);

      expect(params.get('search')).toBe('actor,target');
      expect(params.get('search_by')).toBe('alice@example.com');
      expect(params.get('sort')).toBe('created_at');
      expect(params.get('sort_direction')).toBe('desc');
      expect(params.get('filter')).toBe('event');
      expect(params.get('filter_by')).toBe('member_removed,member_invited');
    });

    it('keeps the detail cache key distinct per event', () => {
      expect(organizationAuditDetailKey(ORG_ID, EVENT_ID)).not.toEqual(
        organizationAuditDetailKey(ORG_ID, 'other')
      );
      expect(organizationAuditParametersKey(ORG_ID)).not.toEqual(
        organizationAuditParametersKey('other-org')
      );
    });

    it('only offers columns the backend actually searches', () => {
      // The backend silently ignores an unknown column, so a typo here would
      // degrade to "search does nothing" rather than to an error. Mirrors
      // `_SEARCH_FIELDS` in apps/audit/selectors/audit_selector.py.
      expect([...AUDIT_SEARCH_COLUMNS]).toEqual(['actor', 'target']);
    });
  });
});
