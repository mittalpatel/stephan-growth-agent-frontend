'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { ListPagination } from '@/components/common/ListPagination';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  DataTableBody,
  DataTableRow,
  dataTableHeadRow,
  dataTableTd,
  dataTableTh,
} from '@/components/common/DataTable';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/i18n';
import { t } from '@/locales';
import type { ApprovalStatus } from '@/types/approval';

import { useApprovalsList } from '../hooks/useApprovalsList';
import { ApprovalDetailSheet } from './ApprovalDetailSheet';

const STATUS_TONE: Record<ApprovalStatus, StatusTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

/** The org-wide approvals inbox, wired to `GET /api/v1/approvals/`. */
export function ApprovalsListView() {
  const list = useApprovalsList();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function renderBody() {
    if (list.isLoading) {
      return (
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      );
    }

    if (list.isError) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title={t.approvals.list.errorTitle}
          description={t.approvals.list.errorDescription}
          action={
            <Button variant="outline" onClick={() => void list.refetch()}>
              {t.buttons.tryAgain}
            </Button>
          }
        />
      );
    }

    if (list.approvals.length === 0) {
      return list.hasActiveFilters ? (
        <EmptyState
          title={t.approvals.list.emptyFilteredTitle}
          description={t.approvals.list.emptyFilteredDescription}
          action={
            <Button variant="outline" onClick={list.onResetFilters}>
              {t.buttons.resetFilters}
            </Button>
          }
        />
      ) : (
        <EmptyState
          title={t.approvals.list.emptyTitle}
          description={t.approvals.list.emptyDescription}
        />
      );
    }

    return (
      <DataTable minWidth={640}>
        <thead>
          <tr className={dataTableHeadRow}>
            <th className={dataTableTh}>{t.approvals.table.title}</th>
            <th className={dataTableTh}>{t.approvals.table.status}</th>
            <th className={`${dataTableTh} hidden md:table-cell`}>{t.approvals.table.risk}</th>
            <th className={`${dataTableTh} hidden md:table-cell`}>{t.approvals.table.created}</th>
          </tr>
        </thead>
        <DataTableBody>
          {list.approvals.map((approval) => (
            <DataTableRow key={approval.id} onClick={() => setSelectedId(approval.id)}>
              <td className={`${dataTableTd} font-medium`}>{approval.title}</td>
              <td className={dataTableTd}>
                <StatusBadge
                  label={t.approvals.status[approval.status]}
                  tone={STATUS_TONE[approval.status]}
                />
              </td>
              <td className={`${dataTableTd} text-muted-foreground hidden text-sm md:table-cell`}>
                {t.approvals.risk[approval.risk]}
              </td>
              <td className={`${dataTableTd} text-muted-foreground hidden text-sm md:table-cell`}>
                {formatDate(approval.created_at)}
              </td>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.approvals.title} description={t.approvals.description} />

      <FilterToolbar
        title={t.approvals.title}
        total={list.total}
        displayed={list.approvals.length}
        isFetching={list.isFetching}
        searchTerm=""
        onSearchChange={() => {}}
        onSearchClear={() => {}}
        sortField={list.sortField}
        sortDirection={list.sortDirection}
        sortOptions={list.sortOptions}
        onSortFieldChange={list.onSortFieldChange}
        onSortDirectionToggle={list.onSortDirectionToggle}
        limit={list.limit}
        limitOptions={list.limitOptions}
        onLimitChange={list.onLimitChange}
        onResetFilters={list.onResetFilters}
        filterConfigs={list.filterConfigs}
        activeFilters={list.activeFilters}
        onFilterChange={list.onFilterChange}
        showDateRange={false}
      />

      {renderBody()}

      {list.totalPages > 1 && (
        <ListPagination
          currentPage={list.currentPage}
          totalPages={list.totalPages}
          limit={list.limit}
          limitOptions={list.limitOptions}
          onPageChange={list.onPageChange}
          onLimitChange={list.onLimitChange}
        />
      )}

      <ApprovalDetailSheet
        approvalId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}
