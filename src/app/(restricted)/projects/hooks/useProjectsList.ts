'use client';

import { useMemo } from 'react';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { ROW_LIMIT_OPTIONS } from '@/constants/data';
import { t } from '@/locales';
import {
  PROJECTS_LIST_KEY,
  PROJECTS_PARAMETERS_KEY,
  PROJECTS_PARAMETERS_URL,
  PROJECT_SEARCH_COLUMNS,
  buildProjectListParams,
  projectListUrl,
} from '@/services/projects';
import type { ApiResponse, ParametersConfig } from '@/types/api';
import type { ProjectListItem } from '@/types/project';

/** URL namespace. Every param is written as `projects_page`, `projects_sort`, … */
const NAMESPACE = 'projects';

type ParametersResponse = ApiResponse<ParametersConfig>;

/**
 * Everything the projects list page needs, as one flat bag of props.
 *
 * ## Why the hook owns all of it
 *
 * The components below this are pure presenters — they receive values and
 * callbacks and render. No `useQuery`, no request bodies, no error mapping in a
 * component. That split is what makes the list testable without a network and
 * the presenters reusable in a different context (a dialog, a dashboard card).
 *
 * ## URL is the source of truth
 *
 * Page, search, sort, and filters all live in the URL via `useQueryParams`, not
 * in `useState`. A filtered list is therefore linkable, survives a refresh, and
 * restores correctly on back-navigation — none of which is true of component
 * state. The keys are namespaced (`projects_page`) so a second list on the same
 * screen cannot collide with this one.
 */
export function useProjectsList() {
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
    columns: PROJECT_SEARCH_COLUMNS,
    setSearch,
  });

  // `?type=parameters` — the filter/sort configuration the toolbar renders from.
  // Fetched separately because it changes far less often than the data, so it
  // gets a long stale time instead of refetching alongside every page change.
  const parametersQuery = useAuthQuery<ParametersResponse>(
    [PROJECTS_PARAMETERS_KEY],
    PROJECTS_PARAMETERS_URL,
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

  // The key mirrors the params exactly, so any URL change that alters the request
  // also alters the cache entry — and any change that does not, reuses it.
  const listQuery = useAuthQuery<ApiResponse<ProjectListItem[]>>(
    [PROJECTS_LIST_KEY, buildProjectListParams(listQueryInput)],
    projectListUrl(listQueryInput),
    {
      // Keeps the previous page rendered while the next one loads, so paging
      // does not flash an empty table.
      placeholderData: (previous) => previous,
    }
  );

  const projects = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  // Memoized rather than `?? []` inline: the fallback allocates a fresh array on
  // every render, which would make `activeFilters` below recompute every time and
  // hand the toolbar a new object identity on each pass.
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

  // `getFilterValues` reads the URL, so this recomputes whenever a filter moves.
  const activeFilters = useMemo(
    () =>
      Object.fromEntries(filterConfigs.map((config) => [config.key, getFilterValues(config.key)])),
    [filterConfigs, getFilterValues]
  );

  const hasActiveFilters =
    Boolean(queryParams.search_by) || Object.values(activeFilters).some((v) => v.length > 0);

  return {
    // data
    projects,
    total: meta?.count ?? 0,
    displayed: projects.length,
    currentPage: meta?.current_page ?? queryParams.page,
    totalPages: meta?.total_pages ?? 1,

    // status
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
    refetch: listQuery.refetch,

    // toolbar
    title: t.projects.title,
    searchTerm,
    onSearchChange: handleSearchChange,
    onSearchClear: handleSearchClear,
    searchPlaceholder: t.projects.list.searchPlaceholder,
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

export type ProjectsListProps = ReturnType<typeof useProjectsList>;
