// The backend list query-param names — the frontend mirror of
// `common/api/query_params.py` and `DefaultPagination`.
//
// Every list-query builder reads its param names from here, so a backend rename
// is a one-line edit rather than a hunt across every service. This pairing has
// drifted before (a `limit` → `page_size` rename that the frontend missed), which
// is why the backend exports `contracts/list_params.json` and CI asserts this
// object against it. Change one side and the build fails until you change the other.
export const LIST_PARAM = {
  page: 'page',
  pageSize: 'page_size',
  search: 'search',
  searchValue: 'search_by',
  filter: 'filter',
  filterValue: 'filter_by',
  sort: 'sort',
  sortDirection: 'sort_direction',
} as const;

/** The shape `useQueryParams` hands back, narrowed to what a list request needs. */
export type ListQuery = {
  page: number;
  limit: number;
  search: string[];
  search_by: string;
  sort: string;
  sort_direction: 'asc' | 'desc';
  filter: string[];
  filter_by: string[];
};

/**
 * Turn URL state into the backend's list params.
 *
 * Empty values are omitted rather than sent blank. A blank `search_by=` is not
 * the same request as no search at all — it produces a different cache key on
 * both sides, so an unfiltered list would miss the cache on every render.
 *
 * Lives here, next to the param names it encodes, because every list endpoint
 * shares the contract. A per-resource copy is a per-resource opportunity for the
 * encoding to drift from `common/api/query_params.py`.
 */
export function buildListParams(query: ListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {
    [LIST_PARAM.page]: query.page,
    [LIST_PARAM.pageSize]: query.limit,
  };

  if (query.search.length && query.search_by) {
    params[LIST_PARAM.search] = query.search.join(',');
    params[LIST_PARAM.searchValue] = query.search_by;
  }
  if (query.sort) {
    params[LIST_PARAM.sort] = query.sort;
    params[LIST_PARAM.sortDirection] = query.sort_direction;
  }
  if (query.filter.length && query.filter_by.length) {
    params[LIST_PARAM.filter] = query.filter.join(',');
    params[LIST_PARAM.filterValue] = query.filter_by.join('|');
  }

  return params;
}
