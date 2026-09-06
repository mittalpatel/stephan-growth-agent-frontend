'use client';

import { useMemo } from 'react';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { ROW_LIMIT_OPTIONS } from '@/constants/data';
import { t } from '@/locales';
import {
  KNOWLEDGE_SOURCE_SEARCH_COLUMNS,
  KNOWLEDGE_SOURCE_STATUS_VALUES,
  KNOWLEDGE_SOURCE_TYPE_VALUES,
  buildKnowledgeSourceListParams,
  knowledgeSourcesListKey,
  knowledgeSourcesListUrl,
} from '@/services/knowledge';
import type { ApiResponse, FilterConfig } from '@/types/api';
import type { KnowledgeSourceListItem } from '@/types/knowledge';

/** URL namespace. Every param is written as `knowledge_page`, `knowledge_sort`, … */
const NAMESPACE = 'knowledge';

/**
 * The organization's shared knowledge sources, as one flat bag of props —
 * mirrors `useAgentsList`. Org-wide, not per-agent: every agent's knowledge
 * page shows the same list, and an agent narrows to a subset of it through
 * `useKnowledgeTargets` rather than owning rows of its own. The filter config is built from client-known enum values
 * rather than fetched, since `AgentKnowledgeSourceListView` never wires up
 * `?type=parameters` even though its selector supports it (see
 * `src/services/knowledge.ts`).
 */
export function useKnowledgeSources() {
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
    columns: KNOWLEDGE_SOURCE_SEARCH_COLUMNS,
    setSearch,
  });

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

  const listQuery = useAuthQuery<ApiResponse<KnowledgeSourceListItem[]>>(
    [...knowledgeSourcesListKey(), buildKnowledgeSourceListParams(listQueryInput)],
    knowledgeSourcesListUrl(listQueryInput),
    { placeholderData: (previous) => previous }
  );

  const sources = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'status',
        label: t.knowledge.filters.statusLabel,
        type: 'multi_select',
        options: KNOWLEDGE_SOURCE_STATUS_VALUES.map((value) => ({
          value,
          label: t.knowledge.status[value],
        })),
      },
      {
        key: 'source_type',
        label: t.knowledge.filters.sourceTypeLabel,
        type: 'multi_select',
        options: KNOWLEDGE_SOURCE_TYPE_VALUES.map((value) => ({
          value,
          label: t.knowledge.sourceType[value],
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

  const hasActiveFilters =
    Boolean(queryParams.search_by) || Object.values(activeFilters).some((v) => v.length > 0);

  return {
    // data
    sources,
    total: meta?.count ?? 0,
    displayed: sources.length,
    currentPage: meta?.current_page ?? queryParams.page,
    totalPages: meta?.total_pages ?? 1,

    // status
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
    refetch: listQuery.refetch,

    // toolbar
    title: t.knowledge.title,
    searchTerm,
    onSearchChange: handleSearchChange,
    onSearchClear: handleSearchClear,
    searchPlaceholder: t.knowledge.list.searchPlaceholder,
    sortField: queryParams.sort,
    sortDirection: queryParams.sort_direction,
    sortOptions: [
      { value: 'display_name', label: t.knowledge.columns.displayName },
      { value: 'status', label: t.knowledge.columns.status },
      { value: 'created_at', label: t.knowledge.columns.updatedAt },
      { value: 'updated_at', label: t.knowledge.columns.updatedAt },
    ],
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

export type KnowledgeSourcesProps = ReturnType<typeof useKnowledgeSources>;
