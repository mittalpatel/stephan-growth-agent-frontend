'use client';

import { useMemo } from 'react';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useQueryParams } from '@/hooks/useQueryParams';
import { ROW_LIMIT_OPTIONS } from '@/constants/data';
import { t } from '@/locales';
import {
  APPROVALS_LIST_KEY,
  APPROVAL_STATUS_VALUES,
  buildApprovalListParams,
  approvalsListUrl,
} from '@/services/approvals';
import type { ApiResponse, FilterConfig } from '@/types/api';
import type { ApprovalListItem } from '@/types/approval';

/** URL namespace. Every param is written as `approvals_page`, `approvals_sort`, … */
const NAMESPACE = 'approvals';

/**
 * The org-wide approvals inbox, as one flat bag of props — mirrors
 * `useLeadsList`. Filter config is built from client-known enum values since
 * `ApprovalListView` has no `?type=parameters` route either.
 */
export function useApprovalsList() {
  const {
    queryParams,
    setSort,
    setFilter,
    getFilterValues,
    setPageNumber,
    setPageRowsLimit,
    clearAllFilters,
  } = useQueryParams(NAMESPACE);

  const listQueryInput = {
    page: queryParams.page,
    limit: queryParams.limit,
    search: [],
    search_by: '',
    sort: queryParams.sort,
    sort_direction: queryParams.sort_direction,
    filter: queryParams.filter,
    filter_by: queryParams.filter_by,
  };

  const listQuery = useAuthQuery<ApiResponse<ApprovalListItem[]>>(
    [APPROVALS_LIST_KEY, buildApprovalListParams(listQueryInput)],
    approvalsListUrl(listQueryInput),
    { placeholderData: (previous) => previous }
  );

  const approvals = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'status',
        label: t.approvals.filters.statusLabel,
        type: 'multi_select',
        options: APPROVAL_STATUS_VALUES.map((value) => ({
          value,
          label: t.approvals.status[value],
        })),
      },
    ],
    []
  );

  const activeFilters = useMemo(
    () =>
      Object.fromEntries(filterConfigs.map((config) => [config.key, getFilterValues(config.key)])),
    [filterConfigs, getFilterValues]
  );

  const hasActiveFilters = Object.values(activeFilters).some((v) => v.length > 0);

  return {
    approvals,
    total: meta?.count ?? 0,
    currentPage: meta?.current_page ?? queryParams.page,
    totalPages: meta?.total_pages ?? 1,

    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
    refetch: listQuery.refetch,

    sortField: queryParams.sort,
    sortDirection: queryParams.sort_direction,
    // `ApprovalSelector._SORT_FIELDS` also allows `updated_at`, left out
    // because no column shows it — a sort with no visible effect reads as a bug.
    sortOptions: [
      { value: 'created_at', label: t.approvals.table.created },
      { value: 'status', label: t.approvals.table.status },
    ],
    onSortFieldChange: (field: string) => setSort(field, queryParams.sort_direction),
    onSortDirectionToggle: () =>
      setSort(queryParams.sort, queryParams.sort_direction === 'asc' ? 'desc' : 'asc'),
    filterConfigs,
    activeFilters,
    onFilterChange: setFilter,
    hasActiveFilters,
    onResetFilters: clearAllFilters,

    limit: queryParams.limit,
    limitOptions: ROW_LIMIT_OPTIONS,
    onPageChange: setPageNumber,
    onLimitChange: setPageRowsLimit,
  };
}
