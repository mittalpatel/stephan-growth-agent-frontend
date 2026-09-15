'use client';

import { useMemo, useState } from 'react';

import type { DiscoveredUrl } from '@/types/knowledge';

import { useDiscoveredUrls } from './useDiscoveredUrls';

export type ReviewFilter = 'all' | 'selected' | 'unselected';

export type ReviewRow = DiscoveredUrl & {
  path: string;
  /** Only set when this row's origin differs from the crawl's main origin. */
  foreignOrigin: string | null;
  isHome: boolean;
  /** Same address as an earlier row once scheme, `www.` and trailing slash are ignored. */
  isDuplicate: boolean;
};

export type ReviewSection = { segment: string; count: number };

/** A section needs at least this many pages to be worth a shortcut chip. */
const MIN_SECTION_SIZE = 3;
const MAX_SECTIONS = 8;

function parse(raw: string): { origin: string; path: string; key: string } {
  try {
    const parsed = new URL(raw);
    const path = `${parsed.pathname}${parsed.search}`;
    const host = parsed.host.replace(/^www\./, '');
    const key = `${host}${parsed.pathname.replace(/\/+$/, '')}${parsed.search}`.toLowerCase();
    return { origin: parsed.origin, path, key };
  } catch {
    return { origin: '', path: raw, key: raw.toLowerCase() };
  }
}

function firstSegment(path: string): string | null {
  const segment = path.split(/[/?]/).find(Boolean);
  return segment ?? null;
}

/**
 * View state for the page-picker step: search, the selected/unselected tab,
 * section shortcuts, and the derived rows. Selection itself stays in
 * `useDiscoveredUrls`, which owns the server round trips.
 */
export function useDiscoveredUrlsReview(websiteSourceId: string) {
  const source = useDiscoveredUrls(websiteSourceId);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ReviewFilter>('all');

  const { rows, mainOrigin, sections } = useMemo(() => {
    const parsed = source.urls.map((url) => ({ url, ...parse(url.url) }));

    const originCounts = new Map<string, number>();
    for (const row of parsed) {
      if (row.origin) originCounts.set(row.origin, (originCounts.get(row.origin) ?? 0) + 1);
    }
    const main = [...originCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

    const seen = new Set<string>();
    const sectionCounts = new Map<string, number>();
    const derived: ReviewRow[] = parsed.map(({ url, origin, path, key }) => {
      const isDuplicate = seen.has(key);
      seen.add(key);
      const segment = firstSegment(path);
      if (segment) sectionCounts.set(segment, (sectionCounts.get(segment) ?? 0) + 1);
      return {
        ...url,
        path,
        foreignOrigin: origin && origin !== main ? origin : null,
        isHome: path === '/' || path === '',
        isDuplicate,
      };
    });

    const topSections = [...sectionCounts.entries()]
      .filter(([, count]) => count >= MIN_SECTION_SIZE)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_SECTIONS)
      .map(([segment, count]) => ({ segment, count }));

    return { rows: derived, mainOrigin: main, sections: topSections };
  }, [source.urls]);

  const query = search.trim().toLowerCase();
  const matchingSearch = query ? rows.filter((row) => row.url.toLowerCase().includes(query)) : rows;
  const visibleRows = matchingSearch.filter((row) => {
    if (filter === 'selected') return row.is_selected;
    if (filter === 'unselected') return !row.is_selected;
    return true;
  });
  const visibleIds = visibleRows.map((row) => row.id);
  const visibleSelectedCount = visibleRows.filter((row) => row.is_selected).length;
  const selectedCount = source.selectedCount;

  return {
    isLoading: source.isLoading,
    isError: source.isError,
    refetch: source.refetch,
    isTruncated: source.isTruncated,
    total: rows.length,
    /** How many pages the server holds, which exceeds `total` when truncated. */
    serverTotal: source.total,
    selectedCount,
    unselectedCount: rows.length - selectedCount,
    duplicateCount: rows.filter((row) => row.isDuplicate).length,
    mainOrigin,
    sections,

    search,
    setSearch,
    filter,
    setFilter,
    /** A section chip is just a search for `/segment/`; clicking it again clears it. */
    activeSection: sections.find((section) => query === `/${section.segment}/`)?.segment ?? null,
    toggleSection: (segment: string) =>
      setSearch((current) => (current.trim() === `/${segment}/` ? '' : `/${segment}/`)),
    clearFilters: () => {
      setSearch('');
      setFilter('all');
    },
    isNarrowed: query.length > 0 || filter !== 'all',

    visibleRows,
    allVisibleSelected: visibleRows.length > 0 && visibleSelectedCount === visibleRows.length,
    setVisibleSelected: (selected: boolean) =>
      selected ? source.selectMany(visibleIds) : source.deselectMany(visibleIds),
    deselectDuplicates: () =>
      source.deselectMany(
        rows.filter((row) => row.isDuplicate && row.is_selected).map((r) => r.id)
      ),
    toggle: source.toggle,
    removeUrl: source.removeUrl,
    addUrl: source.addUrl,
  };
}
