'use client';

import { useMemo } from 'react';

import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { ROW_LIMIT_OPTIONS } from '@/constants/data';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { useQueryParams } from '@/hooks/useQueryParams';
import { t } from '@/locales';
import {
  AUDIT_SEARCH_COLUMNS,
  organizationAuditKey,
  organizationAuditListUrl,
  organizationAuditParametersKey,
  organizationAuditParametersUrl,
} from '@/services/organizations';
import { buildListParams } from '@/services/listParams';
import type { AuditEventRow } from '@/services/organizations';
import type { ApiResponse, ParametersConfig } from '@/types/api';

/** URL namespace. Every param is written as `audit_page`, `audit_sort`, … */
const NAMESPACE = 'audit';

/**
 * The org-scoped audit trail, as one flat bag of props.
 *
 * Mirrors `useProjectsList` deliberately — same URL-as-source-of-truth, same
 * `?type=parameters` toolbar config, same pagination. A trail is the list most
 * likely to grow past what a single unpaginated fetch can carry, so it was the
 * one page that most needed this and least had it.
 *
 * Filters live in the URL rather than component state so that "the removals in
 * March" is a link someone can paste into an incident review, which is most of
 * what this page is read for.
 */
export function useOrganizationAudit() {
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? '';

  const {
    queryParams,
    setSearch,
    setSort,
    setFilter,
    getFilterValues,
    setPageNumber,
    setPageRowsLimit,
    clearAllFilters,
  } = useQueryParams(NAMESPACE);

  const { searchTerm, handleSearchChange, handleSearchClear } = useDebouncedSearch({
    initialValue: queryParams.search_by,
    columns: [...AUDIT_SEARCH_COLUMNS],
    setSearch,
  });

  // Changes far less often than the data (only when the backend gains an event
  // type), so it gets a long stale time rather than refetching with every page.
  const parametersQuery = useAuthQuery<ApiResponse<ParametersConfig>>(
    organizationAuditParametersKey(organizationId),
    organizationAuditParametersUrl(organizationId),
    { enabled: Boolean(organizationId), staleTime: 5 * 60 * 1000 }
  );

  const listQueryInput = {
    page: queryParams.page,
    limit: queryParams.limit,
    search: queryParams.search,
    search_by: queryParams.search_by,
    sort: queryParams.sort,
    sort_direction: queryParams.sort_direction,
    filter: queryParams.filter,
    filter_by: queryParams.filter_by,
  };

  const dateRange = { date_from: queryParams.start_date, date_to: queryParams.end_date };

  const listQuery = useAuthQuery<ApiResponse<AuditEventRow[]>>(
    [...organizationAuditKey(organizationId), buildListParams(listQueryInput), dateRange],
    organizationAuditListUrl(organizationId, listQueryInput, dateRange),
    {
      enabled: Boolean(organizationId),
      // Keeps the current page rendered while the next loads, so paging through
      // a trail does not flash an empty table between every step.
      placeholderData: (previous) => previous,
    }
  );

  const events = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const filterConfigs = useMemo(
    () => parametersQuery.data?.data?.filters ?? [],
    [parametersQuery.data]
  );

  const sortOptions = useMemo(
    () =>
      (parametersQuery.data?.data?.sort_fields ?? []).map((field) => ({
        value: field.key,
        label: field.label,
      })),
    [parametersQuery.data]
  );

  const activeFilters = useMemo(
    () =>
      Object.fromEntries(filterConfigs.map((config) => [config.key, getFilterValues(config.key)])),
    [filterConfigs, getFilterValues]
  );

  const hasActiveFilters =
    Boolean(queryParams.search_by) || Object.values(activeFilters).some((v) => v.length > 0);

  return {
    // data
    organization,
    organizationId,
    events,
    total: meta?.count ?? 0,
    displayed: events.length,
    currentPage: meta?.current_page ?? queryParams.page,
    totalPages: meta?.total_pages ?? 1,

    // status
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
    refetch: listQuery.refetch,

    // toolbar
    title: t.organizations.audit.title,
    searchTerm,
    onSearchChange: handleSearchChange,
    onSearchClear: handleSearchClear,
    searchPlaceholder: t.organizations.audit.searchPlaceholder,
    sortField: queryParams.sort,
    sortDirection: queryParams.sort_direction,
    sortOptions,
    onSortFieldChange: (field: string) => setSort(field, queryParams.sort_direction),
    onSortDirectionToggle: () =>
      setSort(queryParams.sort, queryParams.sort_direction === 'asc' ? 'desc' : 'asc'),
    filterConfigs,
    activeFilters,
    onFilterChange: setFilter,
    hasActiveFilters,
    onResetFilters: clearAllFilters,

    // pagination
    limit: queryParams.limit,
    limitOptions: ROW_LIMIT_OPTIONS,
    onPageChange: setPageNumber,
    onLimitChange: setPageRowsLimit,
  };
}
