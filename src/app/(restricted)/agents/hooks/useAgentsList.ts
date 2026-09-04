'use client';

import { useMemo } from 'react';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { ROW_LIMIT_OPTIONS } from '@/constants/data';
import { t } from '@/locales';
import {
  AGENTS_LIST_KEY,
  AGENTS_PARAMETERS_KEY,
  AGENTS_PARAMETERS_URL,
  AGENT_SEARCH_COLUMNS,
  buildAgentListParams,
  agentListUrl,
} from '@/services/agents';
import type { ApiResponse, ParametersConfig } from '@/types/api';
import type { AgentListItem } from '@/types/agent';

/** URL namespace. Every param is written as `agents_page`, `agents_sort`, … */
const NAMESPACE = 'agents';

type ParametersResponse = ApiResponse<ParametersConfig>;

/**
 * Everything the agents list page needs, as one flat bag of props — see
 * `src/app/(restricted)/projects/hooks/useProjectsList.ts` for the pattern
 * this mirrors.
 */
export function useAgentsList() {
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
    columns: AGENT_SEARCH_COLUMNS,
    setSearch,
  });

  const parametersQuery = useAuthQuery<ParametersResponse>(
    [AGENTS_PARAMETERS_KEY],
    AGENTS_PARAMETERS_URL,
    { staleTime: 5 * 60 * 1000 }
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

  const listQuery = useAuthQuery<ApiResponse<AgentListItem[]>>(
    [AGENTS_LIST_KEY, buildAgentListParams(listQueryInput)],
    agentListUrl(listQueryInput),
    { placeholderData: (previous) => previous }
  );

  const agents = listQuery.data?.data ?? [];
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
    agents,
    total: meta?.count ?? 0,
    displayed: agents.length,
    currentPage: meta?.current_page ?? queryParams.page,
    totalPages: meta?.total_pages ?? 1,

    // status
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
    refetch: listQuery.refetch,

    // toolbar
    title: t.agents.title,
    searchTerm,
    onSearchChange: handleSearchChange,
    onSearchClear: handleSearchClear,
    searchPlaceholder: t.agents.list.searchPlaceholder,
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

export type AgentsListProps = ReturnType<typeof useAgentsList>;
