'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { FilterToolbar, type ViewMode } from '@/components/common/FilterToolbar';
import { ListPagination } from '@/components/common/ListPagination';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';

import { useProjectsList } from '../hooks/useProjectsList';
import CreateProjectDialog from './CreateProjectDialog';
import { ProjectsGrid } from './ProjectsGrid';
import { ProjectsGridSkeleton, ProjectsTableSkeleton } from './ProjectsSkeleton';
import { ProjectsTable } from './ProjectsTable';

/**
 * The projects list.
 *
 * Four states, all designed rather than incidental: loading (a skeleton shaped
 * like the result), error (with a retry), empty (distinguishing "nothing exists"
 * from "nothing matched"), and populated. A list page that only handles the last
 * one is the most common way a screen looks broken in production.
 *
 * View mode is the one piece of state that is *not* in the URL. It is a personal
 * display preference, not part of what the link points at — putting it in the URL
 * means sharing a link imposes your layout on the recipient.
 */
export function ProjectsList() {
  const list = useProjectsList();
  const [view, setView] = useState<ViewMode>('table');
  const { can } = usePermissions();
  const canCreate = can('project', 'create');

  function renderBody() {
    if (list.isLoading) {
      return view === 'table' ? (
        <ProjectsTableSkeleton rows={list.limit} />
      ) : (
        <ProjectsGridSkeleton cards={list.limit} />
      );
    }

    if (list.isError) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title={t.projects.list.errorTitle}
          description={t.projects.list.errorDescription}
          action={
            <Button variant="outline" onClick={() => void list.refetch()}>
              {t.buttons.tryAgain}
            </Button>
          }
        />
      );
    }

    if (list.projects.length === 0) {
      // "No results for your filters" and "you have no projects" need different
      // copy and different actions — offering "clear filters" to someone with no
      // filters set is noise, and offering "create one" to someone whose search
      // simply missed is misleading.
      return list.hasActiveFilters ? (
        <EmptyState
          title={t.projects.list.emptyFilteredTitle}
          description={t.projects.list.emptyFilteredDescription}
          action={
            <Button variant="outline" onClick={list.onResetFilters}>
              {t.buttons.resetFilters}
            </Button>
          }
        />
      ) : (
        <EmptyState
          title={t.projects.list.emptyTitle}
          description={t.projects.list.emptyDescription}
          action={canCreate ? <CreateProjectDialog onCreated={list.refetch} /> : undefined}
        />
      );
    }

    return view === 'table' ? (
      <ProjectsTable projects={list.projects} />
    ) : (
      <ProjectsGrid projects={list.projects} />
    );
  }

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <CreateProjectDialog onCreated={list.refetch} />
        </div>
      )}

      <FilterToolbar
        title={list.title}
        total={list.total}
        displayed={list.displayed}
        isFetching={list.isFetching}
        view={view}
        onViewChange={setView}
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
        // The demo has no date column worth ranging over. Turn this on once your
        // list has one, and the toolbar wires `start_date`/`end_date` for free.
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
  );
}
