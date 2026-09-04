'use client';

import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { ListPagination } from '@/components/common/ListPagination';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';

import { useKnowledgeSources } from '../hooks/useKnowledgeSources';
import { AddPdfDialog } from './AddPdfDialog';
import { AddWebsiteDialog } from './AddWebsiteDialog';
import { IndexVersionsPanel } from './IndexVersionsPanel';
import { KnowledgeSourcesSkeleton } from './KnowledgeSourcesSkeleton';
import { KnowledgeSourcesTable } from './KnowledgeSourcesTable';

type Props = Readonly<{ agentId: string }>;

/**
 * An agent's knowledge sources: list + add-website/add-pdf flows + the
 * index build history. Net-new page, no mock precedent — nested under the
 * agent per the plan's routing decision.
 */
export function KnowledgeSourcesView({ agentId }: Props) {
  const list = useKnowledgeSources(agentId);
  const { can } = usePermissions();
  const canManage = can('knowledge', 'manage');

  function renderBody() {
    if (list.isLoading) {
      return <KnowledgeSourcesSkeleton rows={list.limit} />;
    }

    if (list.isError) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title={t.knowledge.list.errorTitle}
          description={t.knowledge.list.errorDescription}
          action={
            <Button variant="outline" onClick={() => void list.refetch()}>
              {t.buttons.tryAgain}
            </Button>
          }
        />
      );
    }

    if (list.sources.length === 0) {
      return list.hasActiveFilters ? (
        <EmptyState
          title={t.knowledge.list.emptyFilteredTitle}
          description={t.knowledge.list.emptyFilteredDescription}
          action={
            <Button variant="outline" onClick={list.onResetFilters}>
              {t.buttons.resetFilters}
            </Button>
          }
        />
      ) : (
        <EmptyState
          title={t.knowledge.list.emptyTitle}
          description={t.knowledge.list.emptyDescription}
        />
      );
    }

    return <KnowledgeSourcesTable agentId={agentId} sources={list.sources} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/agents/${agentId}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t.knowledge.backToAgent}
        </Link>
        <h1 className="font-display mt-2 text-2xl font-bold tracking-tight">{t.knowledge.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.knowledge.description}</p>
      </div>

      <div className="space-y-4">
        {canManage && (
          <div className="flex justify-end gap-2">
            <AddPdfDialog agentId={agentId} />
            <AddWebsiteDialog agentId={agentId} />
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

      <IndexVersionsPanel agentId={agentId} />
    </div>
  );
}
