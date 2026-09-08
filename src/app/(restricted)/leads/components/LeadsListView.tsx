'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { ListPagination } from '@/components/common/ListPagination';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
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

import { LEAD_STATUS_TONE } from '../leadStatusTone';
import { useLeadsList } from '../hooks/useLeadsList';
import { LeadDetailSheet } from './LeadDetailSheet';

type Props = Readonly<{
  /**
   * Pins the list to one agent and drops the page header, for the agent
   * detail page's Prospects tab. Omitted on the org-wide `/leads` page.
   */
  agentId?: string;
}>;

/**
 * Sprint 1 Phase 3: the leads list, wired to `GET /api/v1/leads/`.
 * The Sprint 1 static preview's metric row and "website prospects" tab had
 * no backend equivalent (no leads-summary endpoint, no prospect/outreach
 * split in the data model) — collapsed to a single real table per the plan.
 */
export function LeadsListView({ agentId }: Props = {}) {
  const list = useLeadsList(agentId);
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
          title={t.leads.list.errorTitle}
          description={t.leads.list.errorDescription}
          action={
            <Button variant="outline" onClick={() => void list.refetch()}>
              {t.buttons.tryAgain}
            </Button>
          }
        />
      );
    }

    if (list.leads.length === 0) {
      return list.hasActiveFilters ? (
        <EmptyState
          title={t.leads.list.emptyFilteredTitle}
          description={t.leads.list.emptyFilteredDescription}
          action={
            <Button variant="outline" onClick={list.onResetFilters}>
              {t.buttons.resetFilters}
            </Button>
          }
        />
      ) : (
        <EmptyState title={t.leads.list.emptyTitle} description={t.leads.list.emptyDescription} />
      );
    }

    return (
      <DataTable minWidth={640}>
        <thead>
          <tr className={dataTableHeadRow}>
            <th className={dataTableTh}>{t.leads.table.lead}</th>
            <th className={dataTableTh}>{t.leads.table.status}</th>
            <th className={`${dataTableTh} hidden md:table-cell`}>{t.leads.table.consent}</th>
            <th className={`${dataTableTh} hidden md:table-cell`}>{t.leads.table.lastContact}</th>
          </tr>
        </thead>
        <DataTableBody>
          {list.leads.map((lead) => (
            <DataTableRow key={lead.id} onClick={() => setSelectedId(lead.id)}>
              <td className={`${dataTableTd} font-medium`}>
                <p>{lead.name || lead.email}</p>
                <p className="text-muted-foreground text-xs">{lead.email}</p>
              </td>
              <td className={dataTableTd}>
                <StatusBadge
                  label={t.leads.status[lead.status]}
                  tone={LEAD_STATUS_TONE[lead.status]}
                />
              </td>
              <td className={`${dataTableTd} text-muted-foreground hidden text-sm md:table-cell`}>
                {lead.consent_given ? t.leads.consent.given : t.leads.consent.notGiven}
              </td>
              <td className={`${dataTableTd} text-muted-foreground hidden text-sm md:table-cell`}>
                {formatDate(lead.created_at)}
              </td>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {!agentId && <PageHeader title={t.leads.title} description={t.leads.description} />}

      <FilterToolbar
        title={t.leads.title}
        total={list.total}
        displayed={list.leads.length}
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

      <LeadDetailSheet leadId={selectedId} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  );
}
