'use client';

import { AlertTriangle } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { ListPagination } from '@/components/common/ListPagination';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';

import { useKnowledgeSources } from '../hooks/useKnowledgeSources';
import { useKnowledgeTargets } from '../hooks/useKnowledgeTargets';
import { AddPdfDialog } from './AddPdfDialog';
import { AddWebsiteDialog } from './AddWebsiteDialog';
import { IndexVersionsPanel } from './IndexVersionsPanel';
import { KnowledgeHealthPanel } from './KnowledgeHealthPanel';
import { KnowledgeSourcesSkeleton } from './KnowledgeSourcesSkeleton';
import { KnowledgeSourcesTable } from './KnowledgeSourcesTable';
import { KnowledgeTargetsPanel } from './KnowledgeTargetsPanel';

type Props = Readonly<{ agentId: string; agentTypeSlug: string }>;

/**
 * The organization's shared knowledge sources, plus the parts that belong to
 * one agent: its health summary, its narrowing set, and its index builds.
 *
 * Still scoped to an agent even though the sources themselves are now
 * org-wide. Two reasons, both practical: crawl-job progress is only readable
 * through an agent-scoped route, so the add-website flow needs an agent id to
 * poll at all; and narrowing is the thing an operator is usually here to
 * adjust, which is meaningless without one. The list is labelled as shared so
 * the scope is not mistaken for per-agent.
 *
 * Renders as the agent detail page's Knowledge tab. It owned the
 * `/agents/[id]/knowledge` route until that page moved to the reference
 * platform's tabbed layout, which is why it carries no header of its own.
 */
export function KnowledgeSourcesView({ agentId, agentTypeSlug }: Props) {
  const list = useKnowledgeSources();
  const { includeSource } = useKnowledgeTargets(agentId);
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

    return <KnowledgeSourcesTable agentTypeSlug={agentTypeSlug} sources={list.sources} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <KnowledgeHealthPanel agentId={agentId} />

      <KnowledgeTargetsPanel agentId={agentId} />

      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">{t.knowledge.list.sharedNotice}</p>

        {canManage && (
          <div className="flex justify-end gap-2">
            {/* `includeSource` keeps a narrowed agent from creating a source
                it cannot then see — and, before that, from 404ing on its own
                crawl-job poll. It is a no-op for an un-narrowed agent. */}
            <AddPdfDialog onCreated={includeSource} />
            <AddWebsiteDialog
              agentId={agentId}
              agentTypeSlug={agentTypeSlug}
              onCreated={includeSource}
            />
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
