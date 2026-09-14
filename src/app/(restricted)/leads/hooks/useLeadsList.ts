'use client';

import { useMemo } from 'react';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useQueryParams } from '@/hooks/useQueryParams';
import { ROW_LIMIT_OPTIONS } from '@/constants/data';
import { t } from '@/locales';
import {
  LEADS_LIST_KEY,
  LEAD_QUALIFICATION_OUTCOME_VALUES,
  LEAD_STATUS_VALUES,
  buildLeadListParams,
  leadsListUrl,
} from '@/services/leads';
import type { ApiResponse, FilterConfig } from '@/types/api';
import type { LeadListItem } from '@/types/lead';

/** URL namespace. Every param is written as `leads_page`, `leads_sort`, … */
const NAMESPACE = 'leads';

/**
 * The leads list, as one flat bag of props — mirrors `useKnowledgeSources`.
 * No search field: `LeadSelector` declares none. The filter config is built
 * from client-known enum values rather than fetched, since `LeadListView`
 * never wires up `?type=parameters` (see `src/services/leads.ts`).
 *
 * Passing `agentId` pins the list to one agent, for the agent detail page's
 * Prospects tab. It appends to the user's own filters rather than replacing
 * them, keeping `filter`/`filter_by` positionally aligned, and maps to
 * `LeadSelector._FILTER_FIELDS`' `agent` key. Omit it for the org-wide page.
 */
export function useLeadsList(agentId?: string) {
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
    filter: agentId ? [...queryParams.filter, agentId] : queryParams.filter,
    filter_by: agentId ? [...queryParams.filter_by, 'agent'] : queryParams.filter_by,
  };

  const listQuery = useAuthQuery<ApiResponse<LeadListItem[]>>(
    [LEADS_LIST_KEY, buildLeadListParams(listQueryInput)],
    leadsListUrl(listQueryInput),
    { placeholderData: (previous) => previous }
  );

  const leads = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'status',
        label: t.leads.filters.statusLabel,
        type: 'multi_select',
        options: LEAD_STATUS_VALUES.map((value) => ({ value, label: t.leads.status[value] })),
      },
      // Keys must match `LeadSelector._FILTER_FIELDS` exactly. No matching
      // sort option: `_SORT_FIELDS` doesn't include this one, so offering it
      // would send a sort the backend rejects.
      {
        key: 'qualification_outcome',
        label: t.leads.filters.qualificationOutcomeLabel,
        type: 'multi_select',
        options: LEAD_QUALIFICATION_OUTCOME_VALUES.map((value) => ({
          value,
          label: t.leads.qualificationOutcome[value],
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
    leads,
    total: meta?.count ?? 0,
    currentPage: meta?.current_page ?? queryParams.page,
    totalPages: meta?.total_pages ?? 1,

    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
    refetch: listQuery.refetch,

    sortField: queryParams.sort,
    sortDirection: queryParams.sort_direction,
    sortOptions: [
      { value: 'created_at', label: t.leads.table.lastContact },
      { value: 'status', label: t.leads.table.status },
      { value: 'email', label: t.leads.table.lead },
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

export type LeadsListProps = ReturnType<typeof useLeadsList>;
