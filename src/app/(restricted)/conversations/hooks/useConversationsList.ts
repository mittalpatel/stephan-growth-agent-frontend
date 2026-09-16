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
 * Conversations as one flat bag of props — mirrors `useKnowledgeSources`.
 * `agentId: null` reads every agent's conversations in the organization
 * (`ConversationListView`, backend 2026-09-14) instead of one agent's; both
 * take the same filter/sort params, so only the URL differs.
 *
 * No search field: `ConversationSelector` declares none. The filter config is
 * built from client-known enum values rather than fetched, since neither list
 * view wires up `?type=parameters` (see `src/services/conversations.ts`).
 */
export function useConversationsList(agentId: string | null) {
  const {
    queryParams,
    setSort,
    setFilter,
    getFilterValues,
    getParam,
    setParam,
    setPageNumber,
    setPageRowsLimit,
    clearAllFilters,
  } = useQueryParams(NAMESPACE);

  // `has_escalation` (backend 2026-09-16) is the first boolean-typed filter
  // in this codebase — it rides its own top-level query param rather than the
  // generic `filter`/`filter_by` column contract, so it's stored via the
  // ad-hoc `getParam`/`setParam` pair instead of `getFilterValues`/`setFilter`.
  const hasEscalationParam = getParam('has_escalation');
  const hasEscalation: 'true' | 'false' | undefined =
    hasEscalationParam === 'true' || hasEscalationParam === 'false'
      ? hasEscalationParam
      : undefined;

  const listQueryInput = {
    page: queryParams.page,
    limit: queryParams.limit,
    search: [],
    search_by: '',
    sort: queryParams.sort,
    sort_direction: queryParams.sort_direction,
    filter: queryParams.filter,
    filter_by: queryParams.filter_by,
    has_escalation: hasEscalation,
  };

  const listQuery = useAuthQuery<ApiResponse<ConversationListItem[]>>(
    [...conversationsListKey(agentId), buildConversationListParams(listQueryInput)],
    conversationsListUrl(agentId, listQueryInput),
    // `null` is a real, fetchable selection (every agent), so only an empty
    // string — no agent picked yet while options are still loading — gates it.
    { enabled: agentId !== '', placeholderData: (previous) => previous }
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
      {
        key: 'has_escalation',
        label: t.conversations.filters.hasEscalationLabel,
        type: 'single_select',
        options: [
          { value: 'true', label: t.conversations.filters.hasEscalationYes },
          { value: 'false', label: t.conversations.filters.hasEscalationNo },
        ],
      },
    ],
    []
  );

  const activeFilters = useMemo(
    () => ({
      ...Object.fromEntries(
        filterConfigs
          .filter((config) => config.key !== 'has_escalation')
          .map((config) => [config.key, getFilterValues(config.key)])
      ),
      has_escalation: hasEscalation ? [hasEscalation] : [],
    }),
    [filterConfigs, getFilterValues, hasEscalation]
  );

  function onFilterChange(column: string, values: string[]) {
    if (column === 'has_escalation') {
      setParam('has_escalation', values[0] ?? null);
      return;
    }
    setFilter(column, values);
  }

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
    onFilterChange,
    hasActiveFilters,
    onResetFilters: clearAllFilters,

    limit: queryParams.limit,
    limitOptions: ROW_LIMIT_OPTIONS,
    onPageChange: setPageNumber,
    onLimitChange: setPageRowsLimit,
  };
}

export type ConversationsListProps = ReturnType<typeof useConversationsList>;
