'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DEFAULT_PAGINATION_PER_PAGE_LIMIT } from '@/constants/data';

// ── Types ─────────────────────────────────────────────────────────────────────

export type QueryState = {
  page: number;
  limit: number;
  search: string[];
  search_by: string;
  sort: string;
  sort_direction: 'asc' | 'desc';
  filter: string[];
  filter_by: string[];
  start_date: string;
  end_date: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function pk(namespace: string, key: string) {
  return `${namespace}_${key}`;
}

// All namespaced keys for a given namespace — used by clearAllFilters to avoid
// wiping other namespaces that share the same URL.
const NAMESPACE_KEYS = [
  'page',
  'page_size',
  'sort',
  'sort_direction',
  'search',
  'search_by',
  'filter',
  'filter_by',
  'start_date',
  'end_date',
] as const;

// Page-specific ad-hoc params set through `setParam`/`setParams` also live under
// this namespace but are not part of the typed `QueryState` above. List them here
// so `clearAllFilters` purges them too — a key missing from this array survives a
// reset, which looks like the reset button being broken.
const CUSTOM_PARAM_KEYS: readonly string[] = [];

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useQueryParams(namespace: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive all state directly from URL — no useState/useEffect lag
  const queryParams = useMemo((): QueryState => {
    const get = (key: string) => searchParams.get(pk(namespace, key)) ?? '';
    const pageRaw = Number(get('page'));
    const limitRaw = Number(get('page_size'));
    const filterRaw = get('filter');
    const filterByRaw = get('filter_by');

    return {
      page: pageRaw > 0 ? pageRaw : 1,
      limit: limitRaw > 0 ? limitRaw : DEFAULT_PAGINATION_PER_PAGE_LIMIT,
      search: get('search') ? get('search').split(',').filter(Boolean) : [],
      search_by: get('search_by'),
      sort: get('sort'),
      sort_direction: get('sort_direction') === 'desc' ? 'desc' : 'asc',
      filter: filterRaw ? filterRaw.split(',').filter(Boolean) : [],
      filter_by: filterByRaw ? filterByRaw.split('|') : [],
      start_date: get('start_date'),
      end_date: get('end_date'),
    };
  }, [namespace, searchParams]);

  // Core URL writer — only touches keys it's given, preserves everything else
  const push = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        const prefixed = pk(namespace, key);
        if (value === null || value === '') next.delete(prefixed);
        else next.set(prefixed, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [namespace, pathname, router, searchParams]
  );

  // ── Sort ──────────────────────────────────────────────────────────────────

  const setSort = useCallback(
    (field: string, direction: 'asc' | 'desc' = 'asc') => {
      if (!field.trim()) {
        push({ sort: null, sort_direction: null });
        return;
      }
      push({ sort: field.trim(), sort_direction: direction, page: '1' });
    },
    [push]
  );

  const clearSort = useCallback(() => push({ sort: null, sort_direction: null }), [push]);

  // ── Search ────────────────────────────────────────────────────────────────

  const setSearch = useCallback(
    (columns: string[], value: string) => {
      const v = value.trim();
      if (v) push({ search: columns.join(','), search_by: v, page: '1' });
      else push({ search: null, search_by: null, page: '1' });
    },
    [push]
  );

  const clearSearch = useCallback(() => push({ search: null, search_by: null, page: '1' }), [push]);

  // ── Filters ───────────────────────────────────────────────────────────────

  // Mutable ref so multiple synchronous setFilter/removeFilter calls
  // (e.g. the "Limpiar filtros" loop in FilterToolbar) each see the result
  // of the previous call instead of all reading the same stale queryParams.
  const filterRef = useRef({ filter: queryParams.filter, filter_by: queryParams.filter_by });
  useEffect(() => {
    filterRef.current = { filter: queryParams.filter, filter_by: queryParams.filter_by };
  }, [queryParams.filter, queryParams.filter_by]);

  const setFilter = useCallback(
    (column: string, values: string[]) => {
      const filters = [...filterRef.current.filter];
      const filterBy = [...filterRef.current.filter_by];
      const idx = filters.indexOf(column);

      if (values.length === 0) {
        if (idx >= 0) {
          filters.splice(idx, 1);
          filterBy.splice(idx, 1);
        }
      } else if (idx >= 0) {
        filterBy[idx] = values.join(',');
      } else {
        filters.push(column);
        filterBy.push(values.join(','));
      }

      filterRef.current = { filter: filters, filter_by: filterBy };
      push({
        filter: filters.join(',') || null,
        filter_by: filterBy.join('|') || null,
        page: '1',
      });
    },
    [push]
  );

  // Append values to an existing filter (or create it)
  const appendFilter = useCallback(
    (column: string, values: string[]) => {
      const filters = [...filterRef.current.filter];
      const filterBy = [...filterRef.current.filter_by];
      const idx = filters.indexOf(column);
      if (idx >= 0) {
        const existing = filterBy[idx].split(',');
        filterBy[idx] = [...new Set([...existing, ...values])].join(',');
      } else {
        filters.push(column);
        filterBy.push(values.join(','));
      }
      filterRef.current = { filter: filters, filter_by: filterBy };
      push({ filter: filters.join(','), filter_by: filterBy.join('|'), page: '1' });
    },
    [push]
  );

  const removeFilter = useCallback(
    (column: string) => {
      const { filter, filter_by } = filterRef.current;
      const idx = filter.indexOf(column);
      if (idx < 0) return;
      const nextFilters = filter.filter((_, i) => i !== idx);
      const nextFilterBy = filter_by.filter((_, i) => i !== idx);
      filterRef.current = { filter: nextFilters, filter_by: nextFilterBy };
      push({
        filter: nextFilters.join(',') || null,
        filter_by: nextFilterBy.join('|') || null,
        page: '1',
      });
    },
    [push]
  );

  // Remove a specific value from a filter column, optionally removing the column when empty
  const removeFilterValue = useCallback(
    (column: string, value: string | string[], removeWhenEmpty = true) => {
      // Read/write the live ref (not the rendered snapshot) so back-to-back filter
      // mutations in the same tick compose instead of clobbering each other — matches
      // appendFilter/removeFilter above.
      const { filter, filter_by } = filterRef.current;
      const idx = filter.indexOf(column);
      if (idx < 0) return;
      const toRemove = Array.isArray(value) ? value : [value];
      const filters = [...filter];
      const filterBy = [...filter_by];
      const remaining = filterBy[idx].split(',').filter((v) => !toRemove.includes(v));
      if (remaining.length === 0 && removeWhenEmpty) {
        filters.splice(idx, 1);
        filterBy.splice(idx, 1);
      } else {
        filterBy[idx] = remaining.join(',');
      }
      filterRef.current = { filter: filters, filter_by: filterBy };
      push({
        filter: filters.join(',') || null,
        filter_by: filterBy.join('|') || null,
        page: '1',
      });
    },
    [push]
  );

  // Get the current values for a specific filter column
  const getFilterValues = useCallback(
    (column: string): string[] => {
      const idx = queryParams.filter.indexOf(column);
      if (idx < 0 || !queryParams.filter_by[idx]) return [];
      return queryParams.filter_by[idx].split(',').filter(Boolean);
    },
    [queryParams.filter, queryParams.filter_by]
  );

  // ── Pagination ────────────────────────────────────────────────────────────

  const setPageNumber = useCallback((page: number) => push({ page: String(page) }), [push]);

  const setPageRowsLimit = useCallback(
    (limit: number) => push({ page_size: String(limit), page: '1' }),
    [push]
  );

  // ── Date range ────────────────────────────────────────────────────────────

  const setDateRange = useCallback(
    (startDate: string, endDate: string) =>
      push({ start_date: startDate || null, end_date: endDate || null, page: '1' }),
    [push]
  );

  const clearDateRange = useCallback(() => push({ start_date: null, end_date: null }), [push]);

  // ── Reset — only removes THIS namespace's keys, preserves other namespaces ─

  const clearFilters = useCallback(
    () => push({ filter: null, filter_by: null, page: '1' }),
    [push]
  );

  const clearAllFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of [...NAMESPACE_KEYS, ...CUSTOM_PARAM_KEYS]) next.delete(pk(namespace, key));
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [namespace, pathname, router, searchParams]);

  // ── Ad-hoc params — for page-specific filters that don't fit the typed
  // QueryState shape (e.g. a boolean toggle or a page-local select value).
  // Resets to page 1 by default, matching every other filter setter above.
  const getParam = useCallback(
    (key: string) => searchParams.get(pk(namespace, key)) ?? '',
    [namespace, searchParams]
  );

  const setParam = useCallback(
    (key: string, value: string | null, resetPage = true) => {
      push({ [key]: value, ...(resetPage ? { page: '1' } : {}) });
    },
    [push]
  );

  // Like setParam but for updating several ad-hoc keys atomically (e.g. a
  // cascading select that must clear its dependents in the same URL write).
  const setParams = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      push({ ...updates, ...(resetPage ? { page: '1' } : {}) });
    },
    [push]
  );

  return {
    getParam,
    setParam,
    setParams,
    queryParams,
    // sort
    setSort,
    clearSort,
    // search
    setSearch,
    clearSearch,
    // filters
    setFilter,
    appendFilter,
    removeFilter,
    removeFilterValue,
    getFilterValues,
    clearFilters,
    // pagination
    setPageNumber,
    setPageRowsLimit,
    // date range
    setDateRange,
    clearDateRange,
    // reset
    clearAllFilters,
  };
}
