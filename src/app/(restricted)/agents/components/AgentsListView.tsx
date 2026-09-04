'use client';

import { AlertTriangle } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { ListPagination } from '@/components/common/ListPagination';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';

import { useAgentsList } from '../hooks/useAgentsList';
import CreateAgentDialog from './CreateAgentDialog';
import { AgentsTable } from './AgentsTable';
import { AgentsTableSkeleton } from './AgentsTableSkeleton';

/**
 * The agents list, wired to `GET /api/v1/agents/`.
 *
 * Four states, all designed rather than incidental — see `ProjectsList` for
 * the pattern this mirrors. Replaces the Sprint 1 static preview that rendered
 * the fixed `AGENT_CATALOG` marketplace card grid.
 */
export function AgentsListView() {
  const list = useAgentsList();
  const { can } = usePermissions();
  const canCreate = can('agent', 'create');

  function renderBody() {
    if (list.isLoading) {
      return <AgentsTableSkeleton rows={list.limit} />;
    }

    if (list.isError) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title={t.agents.list.errorTitle}
          description={t.agents.list.errorDescription}
          action={
            <Button variant="outline" onClick={() => void list.refetch()}>
              {t.buttons.tryAgain}
            </Button>
          }
        />
      );
    }

    if (list.agents.length === 0) {
      return list.hasActiveFilters ? (
        <EmptyState
          title={t.agents.list.emptyFilteredTitle}
          description={t.agents.list.emptyFilteredDescription}
          action={
            <Button variant="outline" onClick={list.onResetFilters}>
              {t.buttons.resetFilters}
            </Button>
          }
        />
      ) : (
        <EmptyState
          title={t.agents.list.emptyTitle}
          description={t.agents.list.emptyDescription}
          action={canCreate ? <CreateAgentDialog onCreated={list.refetch} /> : undefined}
        />
      );
    }

    return <AgentsTable agents={list.agents} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t.agents.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.agents.description}</p>
      </div>

      <div className="space-y-4">
        {canCreate && (
          <div className="flex justify-end">
            <CreateAgentDialog onCreated={list.refetch} />
          </div>
        )}

        <FilterToolbar
          title={list.title}
          total={list.total}
          displayed={list.displayed}
          isFetching={list.isFetching}
          searchTerm={list.searchTerm}
          onSearchChange={list.onSearchChange}
          onSearchClear={list.onSearchClear}
          searchPlaceholder={list.searchPlaceholder}
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
      </div>
    </div>
  );
}
