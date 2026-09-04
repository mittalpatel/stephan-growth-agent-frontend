'use client';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { ListPagination } from '@/components/common/ListPagination';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDate } from '@/lib/i18n';
import { t } from '@/locales';
import type { IndexVersionStatus } from '@/types/knowledge';
import { ROW_LIMIT_OPTIONS } from '@/constants/data';

import { useIndexVersions } from '../hooks/useIndexVersions';

const STATUS_TONE: Record<IndexVersionStatus, StatusTone> = {
  building: 'warning',
  ready: 'success',
  failed: 'danger',
};

type Props = Readonly<{ agentId: string }>;

export function IndexVersionsPanel({ agentId }: Props) {
  const { can } = usePermissions();
  const canBuild = can('knowledge', 'execute');
  const { versions, isLoading, currentPage, totalPages, onPageChange, buildIndex, isBuilding } =
    useIndexVersions(agentId);

  function renderBody() {
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      );
    }

    if (versions.length === 0) {
      return <EmptyState title={t.knowledge.index.empty} />;
    }

    return (
      <div className="space-y-2">
        {versions.map((version) => (
          <div
            key={version.id}
            className="border-border flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span className="font-medium">
              {format(t.knowledge.index.versionLabel, { number: version.version_number })}
            </span>
            <StatusBadge
              label={t.knowledge.index.status[version.status]}
              tone={STATUS_TONE[version.status]}
            />
            <span className="text-muted-foreground">{version.chunk_count}</span>
            <span className="text-muted-foreground">
              {version.built_at ? formatDate(version.built_at) : '–'}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle>{t.knowledge.index.title}</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">{t.knowledge.index.description}</p>
        </div>
        {canBuild && (
          <Button onClick={() => void buildIndex()} disabled={isBuilding} variant="outline">
            {isBuilding ? t.knowledge.index.building : t.knowledge.index.buildAction}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {renderBody()}

        {totalPages > 1 && (
          <ListPagination
            currentPage={currentPage}
            totalPages={totalPages}
            limit={ROW_LIMIT_OPTIONS[0]}
            limitOptions={ROW_LIMIT_OPTIONS}
            onPageChange={onPageChange}
            onLimitChange={() => {}}
          />
        )}
      </CardContent>
    </Card>
  );
}
