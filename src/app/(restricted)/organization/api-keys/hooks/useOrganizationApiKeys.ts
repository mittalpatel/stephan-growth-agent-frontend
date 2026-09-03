'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { ROW_LIMIT_OPTIONS } from '@/constants/data';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { useQueryParams } from '@/hooks/useQueryParams';
import { applyApiError } from '@/lib/apiError';
import { t } from '@/locales';
import { buildListParams } from '@/services/listParams';
import {
  API_KEY_SEARCH_COLUMNS,
  organizationApiKeyRevokeEndpoint,
  organizationApiKeysKey,
  organizationApiKeysListUrl,
  organizationApiKeysParametersKey,
  organizationApiKeysParametersUrl,
  type ApiKeyRow,
} from '@/services/apiKeys';
import type { ApiResponse, ParametersConfig } from '@/types/api';

/** URL namespace. Every param is written as `apikeys_page`, `apikeys_sort`, … */
const NAMESPACE = 'apikeys';

/**
 * The org-scoped API keys list, plus revocation — one flat props bag.
 *
 * Mirrors `useOrganizationAudit` for the list half (URL-as-source-of-truth,
 * `?type=parameters` toolbar config, pagination) and `useOrganizationMembers` for
 * the mutation half (`pendingKeyId` while a revoke is in flight, refetch on
 * success). Creation is deliberately not here: it lives in
 * `CreateApiKeyDialog`, which is also the only place the one-time secret exists —
 * threading it through this hook would put it one `useMemo` away from ending up
 * in a dependency array or a devtools snapshot.
 */
export function useOrganizationApiKeys() {
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? '';

  const { queryParams, setSearch, setSort, setPageNumber, setPageRowsLimit, clearAllFilters } =
    useQueryParams(NAMESPACE);

  const { searchTerm, handleSearchChange, handleSearchClear } = useDebouncedSearch({
    initialValue: queryParams.search_by,
    columns: [...API_KEY_SEARCH_COLUMNS],
    setSearch,
  });

  const parametersQuery = useAuthQuery<ApiResponse<ParametersConfig>>(
    organizationApiKeysParametersKey(organizationId),
    organizationApiKeysParametersUrl(organizationId),
    { enabled: Boolean(organizationId), staleTime: 5 * 60 * 1000 }
  );

  const listQueryInput = {
    page: queryParams.page,
    limit: queryParams.limit,
    search: queryParams.search,
    search_by: queryParams.search_by,
    sort: queryParams.sort,
    sort_direction: queryParams.sort_direction,
    filter: [] as string[],
    filter_by: [] as string[],
  };

  const listQuery = useAuthQuery<ApiResponse<ApiKeyRow[]>>(
    [...organizationApiKeysKey(organizationId), buildListParams(listQueryInput)],
    organizationApiKeysListUrl(organizationId, listQueryInput),
    {
      enabled: Boolean(organizationId),
      // Never cached server-side (see ApiKeySelector's module docstring), so
      // there is no cached-but-stale page to worry about here either — this
      // just keeps paging from flashing an empty table between steps.
      placeholderData: (previous) => previous,
    }
  );

  const keys = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const sortOptions = useMemo(
    () =>
      (parametersQuery.data?.data?.sort_fields ?? []).map((field) => ({
        value: field.key,
        label: field.label,
      })),
    [parametersQuery.data]
  );

  const hasActiveFilters = Boolean(queryParams.search_by);

  const { mutateAsync: mutate } = useAuthMutation();
  const [pendingKeyId, setPendingKeyId] = useState<string | null>(null);

  const revokeKey = useCallback(
    async (keyId: string) => {
      setPendingKeyId(keyId);
      try {
        await mutate({
          url: organizationApiKeyRevokeEndpoint(organizationId, keyId),
          method: 'post',
        });
        toast.success(t.organizations.apiKeys.revoked);
        await listQuery.refetch();
      } catch (error) {
        applyApiError(error, { fallbackMessage: t.organizations.apiKeys.revokeFailed });
      } finally {
        setPendingKeyId(null);
      }
    },
    [mutate, organizationId, listQuery]
  );

  return {
    // data
    organization,
    organizationId,
    keys,
    total: meta?.count ?? 0,
    displayed: keys.length,
    currentPage: meta?.current_page ?? queryParams.page,
    totalPages: meta?.total_pages ?? 1,

    // status
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
    refetch: listQuery.refetch,

    // toolbar
    title: t.organizations.apiKeys.title,
    searchTerm,
    onSearchChange: handleSearchChange,
    onSearchClear: handleSearchClear,
    searchPlaceholder: t.organizations.apiKeys.searchPlaceholder,
    sortField: queryParams.sort,
    sortDirection: queryParams.sort_direction,
    sortOptions,
    onSortFieldChange: (field: string) => setSort(field, queryParams.sort_direction),
    onSortDirectionToggle: () =>
      setSort(queryParams.sort, queryParams.sort_direction === 'asc' ? 'desc' : 'asc'),
    hasActiveFilters,
    onResetFilters: clearAllFilters,

    // pagination
    limit: queryParams.limit,
    limitOptions: ROW_LIMIT_OPTIONS,
    onPageChange: setPageNumber,
    onLimitChange: setPageRowsLimit,

    // revoke
    pendingKeyId,
    revokeKey,
  };
}
