'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import {
  ArrowDown,
  ArrowUp,
  Info,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';

import { DateRangePicker } from './DateRangePicker';
import { NativeSelect } from './NativeSelect';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MotionPopover } from '@/components/motion/MotionPopover';
import { chipTransition } from '@/components/motion/tokens';
import { format } from '@/lib/i18n';
import { t } from '@/locales';
import type { FilterConfig } from '@/types/api';

export type ViewMode = 'grid' | 'table';

export type SortOption = {
  value: string;
  label: string;
};

export type FilterToolbarProps = Readonly<{
  /** Omit on a page that already renders this same name in its `PageHeader`:
   *  repeating it here is visual noise and a second h1 for a screen reader.
   *  Only a list with no page header of its own (projects, agent knowledge)
   *  passes it. Without it the row still shows the "showing X of Y" count. */
  title?: string;
  total: number;
  displayed: number;
  isFetching: boolean;

  /** Both optional: a list with no alternate layout (the audit trail) has no
   *  view toggle to drive, and requiring them would mean passing a fixed value
   *  and a no-op purely to satisfy the type. Omitting either hides the toggle. */
  view?: ViewMode;
  onViewChange?: (view: ViewMode) => void;

  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  searchPlaceholder?: string;

  sortField: string;
  sortDirection: 'asc' | 'desc';
  sortOptions: SortOption[];
  onSortFieldChange: (field: string) => void;
  onSortDirectionToggle: () => void;

  limit: number;
  limitOptions: number[];
  onLimitChange: (value: number) => void;

  onResetFilters: () => void;

  showViewToggle?: boolean;
  showDateRange?: boolean;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  /** Optional helper text shown behind the (i) button next to the date picker. */
  dateRangeHint?: string;

  filterConfigs?: FilterConfig[];
  activeFilters?: Record<string, string[]>;
  onFilterChange?: (column: string, values: string[]) => void;

  // Optional element rendered at the far right of the page-size/sort row
  // (e.g. an export button that should sit inline with the row controls).
  trailingAction?: React.ReactNode;
}>;

// Shared control styling. Defined once here rather than repeated inline so the
// toolbar's controls stay visually identical to each other — and so retheming is
// one edit. Semantic tokens only: a literal colour here would break dark mode.
const CONTROL = 'border-input bg-background rounded-lg border';
const FOCUS = 'focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]';
// Height matches the search input and the buttons beside it, so the whole row
// sits on one baseline; `NativeSelect` already supplies border, radius and focus.
const selectClass = 'text-foreground h-10 font-medium';
const iconButton = `${CONTROL} ${FOCUS} text-muted-foreground hover:text-foreground hover:bg-accent flex h-10 w-10 shrink-0 items-center justify-center transition-colors`;

type FilterOptionItemProps = {
  filterKey: string;
  opt: FilterConfig['options'][number];
  allowMultiple: boolean;
  checked: boolean;
  currentValues: string[];
  onFilterChange?: (column: string, values: string[]) => void;
};

type FilterChipProps = {
  displayName: string;
  filterKey: string;
  value: string;
  label: string;
  activeFilters: Record<string, string[]>;
  onFilterChange?: (column: string, values: string[]) => void;
};

function FilterChip({
  displayName,
  filterKey,
  value,
  label,
  activeFilters,
  onFilterChange,
}: Readonly<FilterChipProps>) {
  function handleRemove() {
    const next = (activeFilters[filterKey] ?? []).filter((v) => v !== value);
    onFilterChange?.(filterKey, next);
  }
  return (
    <m.span
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={chipTransition}
      className="bg-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
    >
      <span className="text-muted-foreground text-sm">{displayName}:</span>
      <span className="text-foreground text-sm font-medium">{label}</span>
      <button
        type="button"
        onClick={handleRemove}
        className="text-muted-foreground hover:bg-accent hover:text-foreground ml-1 flex h-4 w-4 items-center justify-center rounded-full transition-colors"
        aria-label={format(t.common.removeFilter, { label })}
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </m.span>
  );
}

function dedupeByValue(options: FilterConfig['options']): FilterConfig['options'] {
  const seen = new Set<string>();
  return options.filter((opt) => {
    if (seen.has(opt.value)) return false;
    seen.add(opt.value);
    return true;
  });
}

function FilterOptionItem({
  filterKey,
  opt,
  allowMultiple,
  checked,
  currentValues,
  onFilterChange,
}: Readonly<FilterOptionItemProps>) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (allowMultiple) {
      onFilterChange?.(
        filterKey,
        e.target.checked
          ? [...currentValues, opt.value]
          : currentValues.filter((v) => v !== opt.value)
      );
    } else {
      onFilterChange?.(filterKey, e.target.checked ? [opt.value] : []);
    }
  }
  return (
    <label className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5">
      <input
        type={allowMultiple ? 'checkbox' : 'radio'}
        name={filterKey}
        value={opt.value}
        checked={checked}
        onChange={handleChange}
        className="accent-primary"
      />
      <span className="text-foreground text-sm">{opt.label}</span>
    </label>
  );
}

export function FilterToolbar(props: FilterToolbarProps) {
  const {
    title,
    total,
    displayed,
    isFetching,
    view,
    onViewChange,
    searchTerm,
    onSearchChange,
    onSearchClear,
    searchPlaceholder,
    sortField,
    sortDirection,
    sortOptions,
    onSortFieldChange,
    onSortDirectionToggle,
    limit,
    limitOptions,
    onLimitChange,
    onResetFilters,
    // Defaults on, but a caller that supplies no view state has nothing to
    // toggle — so the toggle hides itself rather than rendering dead controls.
    showViewToggle = true,
    showDateRange = true,
    dateRange,
    onDateRangeChange,
    minDate,
    maxDate,
    dateRangeHint,
    filterConfigs = [],
    activeFilters = {},
    onFilterChange,
    trailingAction,
  } = props;

  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filtersOpen) return;
    function handleOutside(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [filtersOpen]);

  const totalActiveFilters = useMemo(
    () => Object.values(activeFilters).reduce((sum, vals) => sum + vals.length, 0),
    [activeFilters]
  );

  return (
    <div className="elevated space-y-3 rounded-lg px-4 py-4 sm:px-6">
      {/* ── Row 1: Title/count | view toggle + reset + dates ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
        <div className="min-w-0">
          {/* h2, not h1: a page that does pass a title already has its own
              page-level h1 above this, and two h1s is a screen-reader ambiguity. */}
          {title && <h2 className="text-xl font-semibold tracking-tight">{title}</h2>}
          <p className={`text-muted-foreground text-sm ${title ? 'mt-0.5' : ''}`}>
            {isFetching ? t.common.loading : format(t.common.showingOf, { displayed, total })}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:shrink-0">
          {/* Table / Grid toggle — table first */}
          {showViewToggle && view && onViewChange && (
            <div className={`${CONTROL} flex h-10 items-center overflow-hidden`}>
              <button
                type="button"
                onClick={() => onViewChange('table')}
                aria-label={t.common.table}
                aria-pressed={view === 'table'}
                className={`flex h-full items-center justify-center px-3 transition-colors ${
                  view === 'table'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onViewChange('grid')}
                aria-label={t.common.grid}
                aria-pressed={view === 'grid'}
                className={`border-input flex h-full items-center justify-center border-l px-3 transition-colors ${
                  view === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Reset Filters */}
          <button
            type="button"
            onClick={onResetFilters}
            title={t.buttons.resetFilters}
            className={`${CONTROL} ${FOCUS} text-muted-foreground hover:bg-accent hover:text-foreground flex h-10 items-center gap-1 px-4 text-sm transition-colors`}
          >
            <X className="h-3.5 w-3.5 sm:hidden" />
            <span className="hidden sm:inline">{t.buttons.resetFilters}</span>
          </button>

          {/* Date range picker + optional info popover. The hint lives behind an
              (i) button so the calendar/reset cluster stays compact instead of the
              helper text wrapping awkwardly next to the controls (esp. on mobile). */}
          {showDateRange && onDateRangeChange && (
            <div className="flex shrink-0 items-center gap-1.5">
              <DateRangePicker
                value={dateRange}
                onChange={onDateRangeChange}
                minDate={minDate}
                maxDate={maxDate}
              />
              {dateRangeHint && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label={t.common.dateRangeInfo}
                      className={iconButton}
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64">
                    <p className="text-muted-foreground text-xs leading-snug">{dateRangeHint}</p>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Search | Filters ── */}
      <div className="flex items-center gap-2">
        <div
          className={`${CONTROL} focus-within:ring-ring/50 flex min-w-0 flex-1 items-center gap-2 px-3 py-2 transition focus-within:ring-[3px]`}
        >
          <Search className="text-muted-foreground h-4 w-4 shrink-0" />
          <input
            type="search"
            placeholder={searchPlaceholder ?? t.common.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={onSearchClear}
              aria-label={t.common.clearSearch}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters button — only rendered when the API provides filter configs */}
        {filterConfigs.length > 0 && (
          <div ref={filtersRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              // The visible text is hidden below `sm`, leaving only the icon.
              aria-label={t.buttons.filters}
              className={`${CONTROL} ${FOCUS} text-muted-foreground hover:text-foreground hover:bg-accent relative flex items-center gap-2 px-3 py-2 text-sm transition-colors`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">{t.buttons.filters}</span>
              {totalActiveFilters > 0 && (
                <span className="bg-primary text-primary-foreground flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[11px] font-semibold">
                  {totalActiveFilters}
                </span>
              )}
            </button>

            <MotionPopover
              open={filtersOpen}
              align="right"
              className="bg-popover text-popover-foreground absolute top-full right-0 z-50 mt-2 max-h-[480px] w-[calc(100vw-2rem)] max-w-[288px] overflow-y-auto rounded-lg border p-4 shadow-md sm:w-72"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">{t.buttons.filters}</span>
                {totalActiveFilters > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      filterConfigs.forEach((f) => onFilterChange?.(f.key, []));
                    }}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                  >
                    <X className="h-3 w-3" />
                    {t.common.clearFilters}
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {filterConfigs.map((filter, idx) => (
                  <div key={filter.key}>
                    {idx > 0 && <div className="my-3 border-t" />}
                    <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
                      {filter.label}
                    </p>
                    <div className="max-h-[160px] space-y-1.5 overflow-y-auto">
                      {/* The backend's ?type=parameters response has occasionally
                          duplicated an option value (e.g. "active" twice); dedupe
                          defensively so a backend data hiccup doesn't break the
                          dropdown or trip React's duplicate-key warning. */}
                      {dedupeByValue(filter.options).map((opt) => (
                        <FilterOptionItem
                          key={opt.value}
                          filterKey={filter.key}
                          opt={opt}
                          allowMultiple={filter.type === 'multi_select'}
                          checked={(activeFilters[filter.key] ?? []).includes(opt.value)}
                          currentValues={activeFilters[filter.key] ?? []}
                          onFilterChange={onFilterChange}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </MotionPopover>
          </div>
        )}
      </div>

      {/* ── Active filter chips ── */}
      {totalActiveFilters > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {filterConfigs.flatMap((filter) =>
              (activeFilters[filter.key] ?? []).map((val) => (
                <FilterChip
                  key={`${filter.key}-${val}`}
                  displayName={filter.label}
                  filterKey={filter.key}
                  value={val}
                  label={filter.options.find((o) => o.value === val)?.label ?? val}
                  activeFilters={activeFilters}
                  onFilterChange={onFilterChange}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Row 3: Page size + Sort ── */}
      <div className="flex flex-wrap items-center gap-3 pb-0.5">
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-muted-foreground text-sm font-medium">
            <span className="hidden sm:inline">{t.pagination.rowsPerPage}</span>
            <span className="sm:hidden">{t.common.pageShort}</span>
          </span>
          <NativeSelect
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            aria-label={t.pagination.rowsPerPage}
            className={selectClass}
          >
            {limitOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </NativeSelect>
        </div>

        {sortOptions.length > 0 && (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-muted-foreground text-sm font-medium">
              <span className="hidden sm:inline">{t.common.sortBy}</span>
              <span className="sm:hidden">{t.common.sortShort}</span>
            </span>
            <NativeSelect
              value={sortField}
              onChange={(e) => onSortFieldChange(e.target.value)}
              aria-label={t.common.sortBy}
              className={selectClass}
            >
              <option value="">{t.common.none}</option>
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </NativeSelect>
            {sortField && (
              <button
                type="button"
                onClick={onSortDirectionToggle}
                aria-label={t.common.sortDirection}
                title={sortDirection === 'asc' ? t.common.asc : t.common.desc}
                className={`${CONTROL} ${FOCUS} text-muted-foreground hover:bg-accent hover:text-foreground flex h-10 w-10 items-center justify-center rounded-lg transition-colors`}
              >
                {sortDirection === 'asc' ? (
                  <ArrowUp className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        )}

        {trailingAction && (
          <div className="w-full sm:ml-auto sm:w-auto [&>button]:w-full [&>button]:justify-center sm:[&>button]:w-auto">
            {trailingAction}
          </div>
        )}
      </div>
    </div>
  );
}
