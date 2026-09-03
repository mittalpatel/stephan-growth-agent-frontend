import { describe, it, expect } from 'vitest';

import {
  API_KEY_SEARCH_COLUMNS,
  organizationApiKeyDetailEndpoint,
  organizationApiKeyDetailKey,
  organizationApiKeyRevokeEndpoint,
  organizationApiKeysEndpoint,
  organizationApiKeysKey,
  organizationApiKeysListUrl,
  organizationApiKeysParametersKey,
  organizationApiKeysParametersUrl,
} from '../apiKeys';

const ORG_ID = '0c2f6a1e-1111-4a2b-8c3d-4e5f60718293';
const OTHER_ORG_ID = 'aaaaaaaa-1111-4a2b-8c3d-4e5f60718293';
const KEY_ID = 'b1c2d3e4-3333-4f5a-8b9c-0d1e2f3a4b5c';

describe('api key endpoints', () => {
  it('builds every endpoint under the org-scoped api-keys root', () => {
    // Django's APPEND_SLASH means a missing trailing slash costs a redirect on
    // every call, so each builder must produce one.
    const urls = [
      organizationApiKeysEndpoint(ORG_ID),
      organizationApiKeyDetailEndpoint(ORG_ID, KEY_ID),
      organizationApiKeyRevokeEndpoint(ORG_ID, KEY_ID),
    ];
    for (const url of urls) {
      expect(url.startsWith(`/api/v1/organizations/${ORG_ID}/api-keys/`)).toBe(true);
      expect(url.endsWith('/')).toBe(true);
    }
  });

  it('nests the organization id in the list endpoint', () => {
    expect(organizationApiKeysEndpoint(ORG_ID)).toBe(`/api/v1/organizations/${ORG_ID}/api-keys/`);
  });

  it('nests both the organization and key id in the detail endpoint', () => {
    expect(organizationApiKeyDetailEndpoint(ORG_ID, KEY_ID)).toBe(
      `/api/v1/organizations/${ORG_ID}/api-keys/${KEY_ID}/`
    );
  });

  it('builds the revoke endpoint from the detail endpoint', () => {
    expect(organizationApiKeyRevokeEndpoint(ORG_ID, KEY_ID)).toBe(
      `${organizationApiKeyDetailEndpoint(ORG_ID, KEY_ID)}revoke/`
    );
  });

  it('builds the parameters URL from the list endpoint', () => {
    expect(organizationApiKeysParametersUrl(ORG_ID)).toBe(
      `${organizationApiKeysEndpoint(ORG_ID)}?type=parameters`
    );
  });

  it('only offers columns the backend actually searches', () => {
    expect([...API_KEY_SEARCH_COLUMNS]).toEqual(['name', 'prefix']);
  });
});

describe('api key list URL', () => {
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
    const url = organizationApiKeysListUrl(ORG_ID, baseQuery);
    expect(url).toBe(`${organizationApiKeysEndpoint(ORG_ID)}?page=1&page_size=25`);
  });

  it('encodes search and sort in the shared list-param shape', () => {
    const url = organizationApiKeysListUrl(ORG_ID, {
      ...baseQuery,
      search: ['name'],
      search_by: 'nightly',
      sort: 'created_at',
    });
    const params = new URLSearchParams(url.split('?')[1]);

    expect(params.get('search')).toBe('name');
    expect(params.get('search_by')).toBe('nightly');
    expect(params.get('sort')).toBe('created_at');
    expect(params.get('sort_direction')).toBe('desc');
  });
});

describe('api key query keys', () => {
  it('keys the list and parameters caches by organization id', () => {
    expect(organizationApiKeysKey(ORG_ID)).toEqual(['organization-api-keys', ORG_ID]);
    expect(organizationApiKeysParametersKey(ORG_ID)).toEqual([
      'organization-api-keys-parameters',
      ORG_ID,
    ]);
  });

  it('produces different keys for different organizations', () => {
    expect(organizationApiKeysKey(ORG_ID)).not.toEqual(organizationApiKeysKey(OTHER_ORG_ID));
  });

  it('keys the detail cache by both organization and key id', () => {
    expect(organizationApiKeyDetailKey(ORG_ID, KEY_ID)).toEqual([
      'organization-api-key-detail',
      ORG_ID,
      KEY_ID,
    ]);
    expect(organizationApiKeyDetailKey(ORG_ID, KEY_ID)).not.toEqual(
      organizationApiKeyDetailKey(ORG_ID, 'other')
    );
  });

  it('gives each cache its own namespace', () => {
    const namespaces = [
      organizationApiKeysKey(ORG_ID)[0],
      organizationApiKeysParametersKey(ORG_ID)[0],
      organizationApiKeyDetailKey(ORG_ID, KEY_ID)[0],
    ];
    expect(new Set(namespaces).size).toBe(namespaces.length);
  });
});
