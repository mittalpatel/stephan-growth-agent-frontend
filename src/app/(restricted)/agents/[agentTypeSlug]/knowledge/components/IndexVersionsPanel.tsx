'use client';

import { AlertTriangle, Database, Loader2 } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDateTime, formatNumber } from '@/lib/i18n';
import { t } from '@/locales';
import type { IndexVersionStatus } from '@/types/knowledge';

import { useIndexVersions } from '../hooks/useIndexVersions';

const STATUS_TONE: Record<IndexVersionStatus, StatusTone> = {
  building: 'warning',
  ready: 'success',
  failed: 'danger',
};

const copy = t.knowledge.index;

type Props = Readonly<{ agentId: string }>;

export function IndexVersionsPanel({ agentId }: Props) {
  const { can } = usePermissions();
  const canBuild = can('knowledge', 'execute');
  const {
    versions,
    isLoading,
    isError,
    refetch,
    currentPage,
    totalPages,
    onPageChange,
    buildIndex,
    isBuilding,
    buildingVersion,
  } = useIndexVersions(agentId);
  // Newest first on page 1; a later page's top row is not the latest build.
  const latest = currentPage === 1 ? versions[0] : undefined;

  function renderBody() {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-10 w-full" />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">{copy.error}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t.buttons.tryAgain}
          </Button>
        </div>
      );
    }

    if (versions.length === 0) {
      return (
        <div className="border-border flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
          <Database className="text-muted-foreground size-5" aria-hidden />
          <p className="text-sm font-medium">{copy.empty}</p>
          <p className="text-muted-foreground max-w-sm text-xs">{copy.emptyDescription}</p>
        </div>
      );
    }

    return (
      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
            <tr>
              <th className="px-3 py-2 font-medium">{copy.columns.version}</th>
              <th className="px-3 py-2 font-medium">{copy.columns.status}</th>
              <th className="px-3 py-2 text-right font-medium">{copy.columns.chunkCount}</th>
              <th className="hidden px-3 py-2 font-medium sm:table-cell">{copy.columns.builtAt}</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {versions.map((version) => (
              <tr key={version.id}>
                <td className="px-3 py-2 font-medium">
                  {format(copy.versionLabel, { number: version.version_number })}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge
                    label={copy.status[version.status]}
                    tone={STATUS_TONE[version.status]}
                  />
                  {version.status === 'failed' && (
                    <p className="text-muted-foreground mt-1 max-w-xs text-xs">
                      {copy.failure[version.failure_reason || 'unexpected']}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {formatNumber(version.chunk_count)}
                </td>
                <td className="text-muted-foreground hidden px-3 py-2 sm:table-cell">
                  {version.built_at ? formatDateTime(version.built_at) : copy.notBuilt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div className="min-w-0">
          <CardTitle>{copy.title}</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">{copy.description}</p>
        </div>
        {canBuild && (
          <Button onClick={() => buildIndex()} disabled={isBuilding} variant="outline" size="sm">
            {isBuilding && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {isBuilding ? copy.building : copy.buildAction}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {buildingVersion !== null && (
          <p
            role="status"
            className="bg-info text-info-foreground flex items-start gap-2 rounded-md px-3 py-2 text-xs"
          >
            <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin" aria-hidden />
            {format(copy.buildingNotice, { number: buildingVersion })}
          </p>
        )}
        {/* The newest build failing is the one that matters: it says why
            and offers the retry right there, not only in the header. */}
        {latest?.status === 'failed' && buildingVersion === null && (
          <div
            role="alert"
            className="border-destructive/40 flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2"
          >
            <p className="flex items-start gap-2 text-xs">
              <AlertTriangle className="text-destructive mt-0.5 size-3.5 shrink-0" aria-hidden />
              {format(copy.latestFailed, {
                number: latest.version_number,
                reason: copy.failure[latest.failure_reason || 'unexpected'],
              })}
            </p>
            {canBuild && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => buildIndex()}
                disabled={isBuilding}
              >
                {copy.retry}
              </Button>
            )}
          </div>
        )}
        {renderBody()}

        {/* Page size is fixed by the hook, so this is a plain pager rather
            than `ListPagination`, whose page-size menu would do nothing. */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs">
              {format(t.pagination.pageOf, { current: currentPage, total: totalPages })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                {t.pagination.previous}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                {t.pagination.next}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
