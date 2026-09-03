'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SetSearch = (columns: string[], value: string) => void;

type Options = {
  /** Initial input value — pass `queryParams.search_by ?? ''` so the box hydrates
   *  from the URL on load/refresh (used only for the first render). */
  initialValue: string;
  /** Backend search columns for this list (may change over time, e.g. when a
   *  parameters endpoint resolves). The latest value is always used. */
  columns: string[];
  /** URL writer from `useQueryParams` — `setSearch(columns, value)`. */
  setSearch: SetSearch;
  /** Debounce delay in ms (default `SEARCH_DEBOUNCE_MS`). */
  delay?: number;
};

/**
 * How long the search box waits before writing the term to the URL.
 *
 * Exported because the e2e helpers have to outwait it (`e2e/helpers.ts`), and a
 * literal duplicated over there silently rots the moment this number changes —
 * the tests would keep passing, then start flaking for a reason nobody would
 * connect back to this line.
 */
export const SEARCH_DEBOUNCE_MS = 400;

/**
 * Owns the debounced search-box state shared by every URL-backed list page.
 * Centralizes three things that used to be copy-pasted into each list hook:
 *   1. lazy-initialising `searchTerm` from the URL (`search_by`) so the input
 *      isn't empty after a refresh,
 *   2. the 400ms debounce before writing the term to the URL, and
 *   3. clearing the input + URL search.
 * The URL remains the source of truth for the actual query; this only manages
 * the visible input value + debounce.
 */
export function useDebouncedSearch({
  initialValue,
  columns,
  setSearch,
  delay = SEARCH_DEBOUNCE_MS,
}: Options) {
  const [searchTerm, setSearchTerm] = useState(() => initialValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest columns without changing the handler identity. Updated in an
  // effect (not during render) so it's always current by the time a change event fires.
  const columnsRef = useRef(columns);
  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  // Cancel a pending debounce on unmount so it can't fire after teardown.
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setSearch(columnsRef.current, value), delay);
    },
    [setSearch, delay]
  );

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch([], '');
  }, [setSearch]);

  return { searchTerm, setSearchTerm, handleSearchChange, handleSearchClear };
}
