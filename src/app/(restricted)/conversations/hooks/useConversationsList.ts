'use client';

import { useMemo } from 'react';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useQueryParams } from '@/hooks/useQueryParams';
import { ROW_LIMIT_OPTIONS } from '@/constants/data';
import { t } from '@/locales';
import {
  CONVERSATION_STATUS_VALUES,
  buildConversationListParams,
  conversationsListKey,
  conversationsListUrl,
} from '@/services/conversations';
import type { ApiResponse, FilterConfig } from '@/types/api';
import type { ConversationListItem } from '@/types/conversation';

/** URL namespace. Every param is written as `conversations_page`, … */
const NAMESPACE = 'conversations';

/**
 * One agent's conversations, as one flat bag of props — mirrors
 * `useKnowledgeSources`. No search field: `ConversationSelector` declares
 * none. The filter config is built from client-known enum values rather
 * than fetched, since `AgentConversationListView` never wires up
 * `?type=parameters` (see `src/services/conversations.ts`).
 */
export function useConversationsList(agentId: string) {
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

  const listQuery = useAuthQuery<ApiResponse<ConversationListItem[]>>(
    [...conversationsListKey(agentId), buildConversationListParams(listQueryInput)],
    conversationsListUrl(agentId, listQueryInput),
    { enabled: Boolean(agentId), placeholderData: (previous) => previous }
  );

  const conversations = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'status',
        label: t.conversations.filters.statusLabel,
        type: 'multi_select',
        options: CONVERSATION_STATUS_VALUES.map((value) => ({
          value,
          label: t.conversations.status[value],
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
    conversations,
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
      { value: 'created_at', label: t.conversations.columns.createdAt },
      { value: 'updated_at', label: t.conversations.columns.updatedAt },
      { value: 'status', label: t.conversations.columns.status },
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

export type ConversationsListProps = ReturnType<typeof useConversationsList>;
