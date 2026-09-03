'use client';

import { useCallback, useMemo } from 'react';
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
  organizationNotificationReadAllEndpoint,
  organizationNotificationReadEndpoint,
  organizationNotificationsKey,
  organizationNotificationsListUrl,
  organizationNotificationsParametersKey,
  organizationNotificationsParametersUrl,
  type NotificationRow,
} from '@/services/notifications';
import type { ApiResponse, ParametersConfig } from '@/types/api';

const NAMESPACE = 'notifications';

/**
 * The org-scoped notification list, plus mark-read/mark-all-read. Mirrors
 * `useOrganizationApiKeys` for the list half; there is no create/revoke half
 * here since a notification is never authored by its recipient.
 */
export function useNotificationsList() {
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? '';

  const {
    queryParams,
    setSort,
    setPageNumber,
    setPageRowsLimit,
    clearAllFilters,
    setFilter,
    getFilterValues,
  } = useQueryParams(NAMESPACE);

  // The selector has no search fields (`_SEARCH_FIELDS = {}`), so this is wired
  // for consistency with every other list toolbar but sends nothing the
  // backend can match on.
  const { searchTerm, handleSearchChange, handleSearchClear } = useDebouncedSearch({
    initialValue: queryParams.search_by,
    columns: [],
    setSearch: () => {},
  });

  const parametersQuery = useAuthQuery<ApiResponse<ParametersConfig>>(
    organizationNotificationsParametersKey(organizationId),
    organizationNotificationsParametersUrl(organizationId),
    { enabled: Boolean(organizationId), staleTime: 5 * 60 * 1000 }
  );

  const listQueryInput = {
    page: queryParams.page,
    limit: queryParams.limit,
    search: [] as string[],
    search_by: '',
    sort: queryParams.sort,
    sort_direction: queryParams.sort_direction,
    filter: queryParams.filter,
    filter_by: queryParams.filter_by,
  };

  const listQuery = useAuthQuery<ApiResponse<NotificationRow[]>>(
    [...organizationNotificationsKey(organizationId), buildListParams(listQueryInput)],
    organizationNotificationsListUrl(organizationId, listQueryInput),
    { enabled: Boolean(organizationId), placeholderData: (previous) => previous }
  );

  const notificationRows = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const sortOptions = useMemo(
    () =>
      (parametersQuery.data?.data?.sort_fields ?? []).map((field) => ({
        value: field.key,
        label: field.label,
      })),
    [parametersQuery.data]
  );

  const filterConfigs = parametersQuery.data?.data?.filters ?? [];
  const hasActiveFilters = queryParams.filter.length > 0;

  const { mutateAsync: mutate } = useAuthMutation();

  const markRead = useCallback(
    async (notificationId: string) => {
      try {
        await mutate({
          url: organizationNotificationReadEndpoint(organizationId, notificationId),
          method: 'post',
        });
        await listQuery.refetch();
      } catch (error) {
        applyApiError(error, { fallbackMessage: t.notifications.errorTitle });
      }
    },
    [mutate, organizationId, listQuery]
  );

  const markAllRead = useCallback(async () => {
    try {
      await mutate({
        url: organizationNotificationReadAllEndpoint(organizationId),
        method: 'post',
      });
      toast.success(t.notifications.allMarkedRead);
      await listQuery.refetch();
    } catch (error) {
      applyApiError(error, { fallbackMessage: t.notifications.errorTitle });
    }
  }, [mutate, organizationId, listQuery]);

  return {
    // data
    organization,
    organizationId,
    notifications: notificationRows,
    total: meta?.count ?? 0,
    displayed: notificationRows.length,
    currentPage: meta?.current_page ?? queryParams.page,
    totalPages: meta?.total_pages ?? 1,

    // status
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
    refetch: listQuery.refetch,

    // toolbar
    title: t.notifications.title,
    searchTerm,
    onSearchChange: handleSearchChange,
    onSearchClear: handleSearchClear,
    sortField: queryParams.sort,
    sortDirection: queryParams.sort_direction,
    sortOptions,
    onSortFieldChange: (field: string) => setSort(field, queryParams.sort_direction),
    onSortDirectionToggle: () =>
      setSort(queryParams.sort, queryParams.sort_direction === 'asc' ? 'desc' : 'asc'),
    filterConfigs,
    activeFilters: { event_type: getFilterValues('event_type') },
    onFilterChange: setFilter,
    hasActiveFilters,
    onResetFilters: clearAllFilters,

    // pagination
    limit: queryParams.limit,
    limitOptions: ROW_LIMIT_OPTIONS,
    onPageChange: setPageNumber,
    onLimitChange: setPageRowsLimit,

    // actions
    markRead,
    markAllRead,
  };
}
