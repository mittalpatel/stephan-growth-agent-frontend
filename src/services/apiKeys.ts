/**
 * Organization API key (service token) endpoints, query keys, and payload types.
 *
 * A service module owns three things and nothing else: the endpoint strings, the
 * query keys, and the param building. No React, no state, no fetching — see
 * `context/api.md`.
 *
 * **The raw secret returned by `create` is never cached.** It travels in the
 * mutation's resolved value only, is held in component state for the one-time
 * reveal, and must never be written into a query key, the TanStack cache, or the
 * URL. See `ApiKeyCreateResponse` below.
 */

import { buildListParams, type ListQuery } from './listParams';

export const organizationApiKeysEndpoint = (organizationId: string): string =>
  `/api/v1/organizations/${organizationId}/api-keys/`;

export const organizationApiKeyDetailEndpoint = (organizationId: string, keyId: string): string =>
  `${organizationApiKeysEndpoint(organizationId)}${keyId}/`;

export const organizationApiKeyRevokeEndpoint = (organizationId: string, keyId: string): string =>
  `${organizationApiKeyDetailEndpoint(organizationId, keyId)}revoke/`;

/** The `?type=parameters` request that drives the list toolbar's filter configs. */
export const organizationApiKeysParametersUrl = (organizationId: string): string =>
  `${organizationApiKeysEndpoint(organizationId)}?type=parameters`;

/**
 * Searchable columns offered to the backend's `search`/`search_by` pair. Must be
 * a subset of `ApiKeySelector._SEARCH_FIELDS` — an unrecognized column is ignored
 * server-side rather than erroring, so a typo here degrades to "search does
 * nothing" rather than a 400.
 */
export const API_KEY_SEARCH_COLUMNS = ['name', 'prefix'] as const;

/** Builds the API-keys list URL from the shared list-param contract. */
export function organizationApiKeysListUrl(organizationId: string, query: ListQuery): string {
  const search = new URLSearchParams(
    Object.entries(buildListParams(query)).map(([key, value]) => [key, String(value)])
  );
  return `${organizationApiKeysEndpoint(organizationId)}?${search.toString()}`;
}

// -- Query keys ------------------------------------------------------------
// The organization id is part of every key: without it, switching organizations
// would read the previous tenant's cached entry under the new tenant's name.
export const organizationApiKeysKey = (organizationId: string) => [
  'organization-api-keys',
  organizationId,
];
export const organizationApiKeysParametersKey = (organizationId: string) => [
  'organization-api-keys-parameters',
  organizationId,
];
export const organizationApiKeyDetailKey = (organizationId: string, keyId: string) => [
  'organization-api-key-detail',
  organizationId,
  keyId,
];

// -- Payloads ----------------------------------------------------------------

export type ApiKeyStatus = 'active' | 'expired' | 'revoked';

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  status: ApiKeyStatus;
  permission_count: number;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ApiKeyDetail {
  id: string;
  name: string;
  prefix: string;
  status: ApiKeyStatus;
  permission_codes: string[];
  created_by_email: string;
  last_used_at: string | null;
  last_used_ip: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  revoked_by_email: string;
  created_at: string;
}

/**
 * `ApiKeyDetail` plus the one-time secret. Returned **only** by the create
 * response — never by any GET. Field names match `ApiKeyWriteSerializer` exactly.
 */
export interface ApiKeyCreateResponse extends ApiKeyDetail {
  secret: string;
}

export interface CreateApiKeyPayload {
  name: string;
  permission_codes: string[];
  expires_at?: string | null;
}
