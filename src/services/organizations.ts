/**
 * Organization (tenancy) endpoints, query keys, and payload types.
 *
 * A service module owns three things and nothing else: the endpoint strings, the
 * query keys, and the param building. No React, no state, no fetching — see
 * `context/api.md`.
 *
 * The active organization is never sent as a request header. It travels inside the
 * signed JWT the `/api/backend` proxy attaches server-side, so a client cannot
 * change which tenant it is acting in by editing a request. Switching is an
 * explicit endpoint that mints a new token.
 */

import { buildListParams, type ListQuery } from './listParams';
export const ORGANIZATIONS_ENDPOINT = '/api/v1/organizations/';

export const organizationDetailEndpoint = (id: string): string => `${ORGANIZATIONS_ENDPOINT}${id}/`;

/**
 * `GET /organizations/{id}/` response shape. `plan_tier` and `seat_limit` are
 * operator-only fields (no self-serve billing exists yet) - read-only here,
 * set from the Django admin.
 */
export interface OrganizationDetail {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  seat_limit: number | null;
  plan_tier: { id: string; name: string } | null;
  created_at: string;
}

/**
 * Same-origin route that performs an organization switch.
 *
 * Deliberately not the backend's `/organizations/<id>/switch/` endpoint. That
 * endpoint mints a fresh token pair, and the refresh token in it is good for the
 * whole session lifetime — calling it from the browser would put that credential
 * in reach of any XSS, which is the exposure `/api/backend/[...path]` and the
 * nonce CSP were built to avoid for the *shorter-lived* access token. The route
 * below makes the call server-side and writes both tokens into the httpOnly
 * cookie instead.
 */
export const ORGANIZATION_SWITCH_ROUTE = '/api/auth/organization-switch';

export const organizationSetupChecklistEndpoint = (id: string): string =>
  `${ORGANIZATIONS_ENDPOINT}${id}/setup-checklist/`;

export const organizationMembersEndpoint = (id: string): string =>
  `${ORGANIZATIONS_ENDPOINT}${id}/members/`;

export const organizationMemberEndpoint = (id: string, userId: string): string =>
  `${ORGANIZATIONS_ENDPOINT}${id}/members/${userId}/`;

export const organizationMemberSuspendEndpoint = (id: string, userId: string): string =>
  `${ORGANIZATIONS_ENDPOINT}${id}/members/${userId}/suspend/`;

export const organizationMemberReactivateEndpoint = (id: string, userId: string): string =>
  `${ORGANIZATIONS_ENDPOINT}${id}/members/${userId}/reactivate/`;

export const organizationInvitesEndpoint = (id: string): string =>
  `${ORGANIZATIONS_ENDPOINT}${id}/invites/`;

export const organizationInviteEndpoint = (id: string, inviteId: string): string =>
  `${ORGANIZATIONS_ENDPOINT}${id}/invites/${inviteId}/`;

export const organizationInviteResendEndpoint = (id: string, inviteId: string): string =>
  `${ORGANIZATIONS_ENDPOINT}${id}/invites/${inviteId}/resend/`;

export const organizationRolesEndpoint = (id: string): string =>
  `${ORGANIZATIONS_ENDPOINT}${id}/roles/`;

export const organizationTransferOwnershipEndpoint = (id: string): string =>
  `${ORGANIZATIONS_ENDPOINT}${id}/transfer-ownership/`;

// Role read/write goes to the shared RBAC management API rather than a duplicate
// under /organizations/. These take only a role id, never an organization id: the
// tenant comes from the request's signed JWT claim, so an org segment in the path
// would be decorative at best and misleading at worst.
export const roleDetailEndpoint = (roleId: string): string => `/api/v1/rbac/roles/${roleId}/`;

export const organizationRolePermissionsEndpoint = (roleId: string): string =>
  `/api/v1/rbac/roles/${roleId}/permissions/`;

/** Restores a system role's permission set to its seeded definition. */
export const organizationRoleResetEndpoint = (roleId: string): string =>
  `/api/v1/rbac/roles/${roleId}/reset/`;

export const organizationAuditEndpoint = (id: string): string =>
  `${ORGANIZATIONS_ENDPOINT}${id}/audit/`;

export const organizationAuditDetailEndpoint = (id: string, eventId: string): string =>
  `${ORGANIZATIONS_ENDPOINT}${id}/audit/${eventId}/`;

/** The `?type=parameters` request that drives the audit toolbar's filter configs. */
export const organizationAuditParametersUrl = (id: string): string =>
  `${organizationAuditEndpoint(id)}?type=parameters`;

/**
 * Searchable columns offered to the backend's `search`/`search_by` pair.
 *
 * Must be a subset of `_SEARCH_FIELDS` in
 * `apps/audit/selectors/audit_selector.py` — the backend ignores a column it
 * does not recognise, so a typo here degrades to "search silently does nothing"
 * rather than to an error.
 */
export const AUDIT_SEARCH_COLUMNS = ['actor', 'target'] as const;

/** Builds the audit list URL from the shared list-param contract. */
export function organizationAuditListUrl(
  id: string,
  query: ListQuery,
  dateRange?: { date_from?: string; date_to?: string }
): string {
  const params = buildListParams(query);
  // `date_from`/`date_to` are specific to this endpoint (`AuditSelector`), not
  // part of the shared list-params contract every list endpoint honours.
  if (dateRange?.date_from) params.date_from = dateRange.date_from;
  if (dateRange?.date_to) params.date_to = dateRange.date_to;
  const search = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  );
  return `${organizationAuditEndpoint(id)}?${search.toString()}`;
}

/** "Why does this user have X?" — backs the members-page inspector drawer. */
export const userPermissionsExplainEndpoint = (userId: string): string =>
  `/api/v1/rbac/users/${userId}/permissions/explain/`;

/** This member's own active grant/deny overrides, in the acting organization. */
export const userOverridesEndpoint = (userId: string): string =>
  `/api/v1/rbac/users/${userId}/overrides/`;

/** Add/remove one override. `user_id` travels in the body, not the path — this
 * is the same shape POST and DELETE both use. */
export const USER_OVERRIDE_ENDPOINT = '/api/v1/rbac/overrides/';

// The current user's own pending invites, across every organization — not under
// /organizations/<id>/ like the admin-side pending-invites list, since accepting
// one is how the user reaches an organization they aren't a member of yet, so it
// cannot be scoped by an org id the request has no way to supply.
// Note: `apps.users.api.v1.urls` (which owns this route) is mounted at
// `/api/v1/auth/`, not `/api/v1/users/` — matches `/api/v1/auth/me/permissions/`.
export const MY_INVITES_ENDPOINT = '/api/v1/auth/me/invites/';

export const myInviteAcceptEndpoint = (inviteId: string): string =>
  `${MY_INVITES_ENDPOINT}${inviteId}/accept/`;

export const myInviteDeclineEndpoint = (inviteId: string): string =>
  `${MY_INVITES_ENDPOINT}${inviteId}/decline/`;

// -- Query keys ------------------------------------------------------------
// Mutable arrays (no `as const`) to match TanStack's `unknown[]` key type, and the
// convention in `services/projects.ts`. The organization id is part of every scoped
// key: without it, switching organizations reads the previous tenant's cached
// entry under the new tenant's name.
export const ORGANIZATIONS_LIST_KEY = 'organizations';
export const organizationDetailKey = (id: string) => ['organization-detail', id];
export const organizationMembersKey = (id: string) => ['organization-members', id];
export const organizationSetupChecklistKey = (id: string) => ['organization-setup-checklist', id];
export const organizationRolesKey = (id: string) => ['organization-roles', id];
export const organizationInvitesKey = (id: string) => ['organization-invites', id];
// Single-arg, matching `roleDetailEndpoint`: `RestrictedBreadcrumb`'s resolver
// registry reads this exact cache entry to label the UUID segment in
// /organization/roles/<id>, and its contract is `(id: string) => string[]`.
export const roleDetailKey = (roleId: string) => ['role-detail', roleId];
export const organizationAuditKey = (id: string) => ['organization-audit', id];
export const organizationAuditParametersKey = (id: string) => ['organization-audit-parameters', id];
export const organizationAuditDetailKey = (id: string, eventId: string) => [
  'organization-audit-detail',
  id,
  eventId,
];
export const userPermissionsExplainKey = (userId: string) => ['user-permissions-explain', userId];
export const userOverridesKey = (userId: string) => ['user-overrides', userId];
export const MY_INVITES_KEY = ['my-invites'];

// -- Payloads --------------------------------------------------------------
export interface CreateOrganizationPayload {
  name: string;
}

export interface InviteMemberPayload {
  email: string;
  role_id: string;
}

export interface ChangeMemberRolePayload {
  role_id: string;
}

/**
 * Permission codes are backend-defined and constant — the builder renders the
 * catalog from `GET /api/v1/rbac/permissions/` rather than hardcoding a list.
 */
export interface CreateRolePayload {
  name: string;
  description?: string;
  permission_codes: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
}

export interface SetRolePermissionsPayload {
  permission_codes: string[];
}

export interface PendingInvite {
  id: string;
  email: string;
  role: { id: string; name: string; slug: string } | null;
  expires_at: string;
  created_at: string;
}

export interface ResendInvitePayload {
  domain: string;
}

export interface AuditEventRow {
  id: string;
  actor_email: string;
  /** Coarse verb — `created`, `permission_changed`, … */
  action: string;
  /** `action`, translated by the backend. Never build this map client-side: the
   *  enum lives in Python, and a local copy renders a raw slug the first time a
   *  member is added there. */
  action_label: string;
  /** Fine-grained verb — `member_removed`, `role_forked`, … Empty when the
   *  action already says everything. */
  event: string;
  event_label: string;
  target_type: string;
  target_id: string;
  /** Display name captured when the row was written, so it survives the target
   *  being deleted — which is exactly the row a reader cares most about. */
  target_label: string;
  created_at: string;
}

/** One audit row in full. `changes`/`context`/`ip_address` are detail-only —
 *  see `AuditEventDetailSerializer` for why they are kept off the list. */
export interface AuditEventDetail extends AuditEventRow {
  changes: Record<string, unknown>;
  context: Record<string, unknown>;
  ip_address: string | null;
}

export type PermissionSource =
  | { kind: 'role'; role_slug: string; role_name: string }
  | { kind: 'override' }
  | { kind: 'superuser' };

/** Keyed by permission code — each maps to the source(s) that grant it. */
export type PermissionExplanation = Record<string, PermissionSource[]>;

export type OverrideEffect = 'grant' | 'deny';

export interface UserOverrideRow {
  permission_code: string;
  permission_label: string;
  effect: OverrideEffect;
  reason: string;
  expires_at: string | null;
}

export interface SetOverridePayload {
  user_id: string;
  permission_code: string;
  effect: OverrideEffect;
  reason?: string;
  expires_at?: string | null;
}

export interface MyInvite {
  id: string;
  organization: { id: string; name: string; slug: string };
  role: { id: string; name: string; slug: string } | null;
  expires_at: string;
  created_at: string;
}

// -- Support impersonation -------------------------------------------------
// Platform-level, so these sit outside the `/organizations/<id>/` tree: routing
// them through per-org RBAC would let an organization Owner mint a role that
// grants impersonation, which inverts the trust relationship entirely.

export const IMPERSONATION_ENDPOINT = '/api/v1/impersonation/';

/** Exact-email resolution to a user id plus the organizations they belong to. */
export const impersonationLookupUrl = (email: string): string =>
  `${IMPERSONATION_ENDPOINT}lookup/?email=${encodeURIComponent(email)}`;

export const IMPERSONATION_SESSIONS_ENDPOINT = `${IMPERSONATION_ENDPOINT}sessions/`;

/**
 * Same-origin routes, for the same reason as `ORGANIZATION_SWITCH_ROUTE`: both
 * ends of a session move a token pair, and a refresh token must never be handed
 * to browser JavaScript. Starting also has to park the admin's own tokens, and
 * ending has to put them back — neither is something the browser could do.
 */
export const IMPERSONATION_START_ROUTE = '/api/auth/impersonation-start';
export const IMPERSONATION_END_ROUTE = '/api/auth/impersonation-end';

export function impersonationSessionsListUrl(query: ListQuery): string {
  const search = new URLSearchParams(
    Object.entries(buildListParams(query)).map(([key, value]) => [key, String(value)])
  );
  return `${IMPERSONATION_SESSIONS_ENDPOINT}?${search.toString()}`;
}

export const IMPERSONATION_SESSIONS_KEY = ['impersonation-sessions'];
export const impersonationLookupKey = (email: string) => ['impersonation-lookup', email];

export interface ImpersonationTarget {
  id: string;
  email: string;
  full_name: string;
  organizations: OrganizationSummaryRow[];
}

export interface OrganizationSummaryRow {
  id: string;
  name: string;
  slug: string;
}

export interface ImpersonationSessionRow {
  id: string;
  impersonator_email: string;
  target_email: string;
  organization: OrganizationSummaryRow | null;
  reason: string;
  write_enabled: boolean;
  started_at: string;
  expires_at: string;
  ended_at: string | null;
  is_live: boolean;
}

export interface StartImpersonationPayload {
  user_id: string;
  organization_id: string;
  reason: string;
  minutes: number;
  write_enabled: boolean;
}
