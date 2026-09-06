'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { ListPagination } from '@/components/common/ListPagination';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';

import { useAgentsList } from '../hooks/useAgentsList';
import CreateAgentDialog from './CreateAgentDialog';
import { AgentsGrid } from './AgentsGrid';
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

    return <AgentsGrid agents={list.agents} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t.agents.title}
        description={t.agents.description}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/agents/types">{t.agents.types.browseLink}</Link>
            </Button>
            {canCreate && <CreateAgentDialog onCreated={list.refetch} />}
          </div>
        }
      />

      <div className="space-y-4">
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
