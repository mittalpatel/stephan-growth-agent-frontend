'use client';

import { NativeSelect } from './NativeSelect';
import { format } from '@/lib/i18n';
import { t } from '@/locales';

type ListPaginationProps = Readonly<{
  currentPage: number;
  totalPages: number;
  limit: number;
  limitOptions: number[];
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}>;

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

export function ListPagination({
  currentPage,
  totalPages,
  limit,
  limitOptions,
  onPageChange,
  onLimitChange,
}: ListPaginationProps) {
  const pages = buildPageNumbers(currentPage, totalPages);

  const btnBase =
    'border-input focus-visible:ring-ring/50 rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40';
  const btnIdle = 'bg-background hover:bg-accent';
  const btnActive = 'bg-primary text-primary-foreground border-primary';

  const sizeSelect = (
    <NativeSelect
      value={limit}
      onChange={(e) => onLimitChange(Number(e.target.value))}
      aria-label={t.pagination.rowsPerPage}
      className="h-8 py-0"
    >
      {limitOptions.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </NativeSelect>
  );

  return (
    <nav aria-label={t.pagination.rowsPerPage} className="bg-card rounded-lg border px-4 py-3">
      {/* ── Mobile layout ── */}
      <div className="flex flex-col gap-2 sm:hidden">
        {/* Prev / page info / Next */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`${btnBase} ${btnIdle}`}
          >
            {t.pagination.previous}
          </button>
          <span className="text-muted-foreground text-xs">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`${btnBase} ${btnIdle}`}
          >
            {t.pagination.next}
          </button>
        </div>
        {/* Rows per page on its own line */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-muted-foreground text-xs">{t.pagination.rowsPerPage}</span>
          {sizeSelect}
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden items-center justify-between gap-4 sm:flex">
        {/* Left: page info */}
        <span className="text-muted-foreground shrink-0 text-xs">
          {format(t.pagination.pageOf, { current: currentPage, total: totalPages })}
        </span>

        {/* Center: page buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className={`${btnBase} ${btnIdle}`}
          >
            {t.pagination.first}
          </button>
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`${btnBase} ${btnIdle}`}
          >
            {t.pagination.previous}
          </button>

          {pages.map((page, i) =>
            page === '...' ? (
              <span
                key={`ellipsis-before-${pages[i + 1] ?? 'end'}`}
                className="text-muted-foreground px-2 text-xs select-none"
              >
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                className={`${btnBase} ${page === currentPage ? btnActive : btnIdle}`}
              >
                {page}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`${btnBase} ${btnIdle}`}
          >
            {t.pagination.next}
          </button>
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className={`${btnBase} ${btnIdle}`}
          >
            {t.pagination.last}
          </button>
        </div>

        {/* Right: rows per page */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-muted-foreground text-xs">{t.pagination.rowsPerPage}</span>
          {sizeSelect}
        </div>
      </div>
    </nav>
  );
}
