'use client';

import { ROW_LIMIT_OPTIONS } from '@/constants/data';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useQueryParams } from '@/hooks/useQueryParams';
import { buildListParams } from '@/services/listParams';
import {
  IMPERSONATION_SESSIONS_KEY,
  impersonationSessionsListUrl,
  type ImpersonationSessionRow,
} from '@/services/organizations';
import type { ApiResponse } from '@/types/api';

/** URL namespace, so paging this list never collides with a list on another page. */
const NAMESPACE = 'sessions';

/**
 * The review surface: every session ever opened, newest first.
 *
 * Paginated but deliberately not filtered. The list exists to answer "who is in a
 * customer's account, and who has been", and the useful shape of that question is
 * chronological — the backend also refuses to cache it, for the same reason.
 */
export function useImpersonationSessions() {
  const { queryParams, setPageNumber, setPageRowsLimit } = useQueryParams(NAMESPACE);

  // The full ListQuery shape, with the search/sort/filter halves left empty:
  // `buildListParams` omits empty values, so this sends page and page_size only.
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

  const query = useAuthQuery<ApiResponse<ImpersonationSessionRow[]>>(
    [...IMPERSONATION_SESSIONS_KEY, buildListParams(listQueryInput)],
    impersonationSessionsListUrl(listQueryInput),
    { placeholderData: (previous) => previous }
  );

  const sessions = query.data?.data ?? [];
  const meta = query.data?.meta;

  return {
    sessions,
    total: meta?.count ?? 0,
    displayed: sessions.length,
    currentPage: meta?.current_page ?? queryParams.page,
    totalPages: meta?.total_pages ?? 1,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    limit: queryParams.limit,
    limitOptions: ROW_LIMIT_OPTIONS,
    onPageChange: setPageNumber,
    onLimitChange: setPageRowsLimit,
  };
}
