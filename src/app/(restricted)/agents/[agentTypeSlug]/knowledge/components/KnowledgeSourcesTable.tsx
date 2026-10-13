'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import {
  DataTable,
  DataTableBody,
  DataTableRow,
  dataTableHeadRow,
  dataTableTd,
  dataTableTh,
} from '@/components/common/DataTable';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, formatDate } from '@/lib/i18n';
import { progressLine } from '@/lib/knowledgeProgress';
import { t } from '@/locales';
import type { KnowledgeSourceListItem, KnowledgeSourceStatus } from '@/types/knowledge';

import { useKnowledgeSourceActions } from '../hooks/useKnowledgeSourceActions';
import { RenameSourceDialog } from './RenameSourceDialog';

const STATUS_TONE: Record<KnowledgeSourceStatus, StatusTone> = {
  pending: 'neutral',
  processing: 'warning',
  ready: 'success',
  failed: 'danger',
  disabled: 'neutral',
};

type Props = Readonly<{ agentTypeSlug: string; sources: KnowledgeSourceListItem[] }>;

export function KnowledgeSourcesTable({ agentTypeSlug, sources }: Props) {
  const { can } = usePermissions();
  const canManage = can('knowledge', 'manage');
  const canExecute = can('knowledge', 'execute');
  const { remove, reprocess, recrawl, disable, enable } = useKnowledgeSourceActions();
  const [renameTarget, setRenameTarget] = useState<KnowledgeSourceListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeSourceListItem | null>(null);

  return (
    <>
      <DataTable minWidth={720}>
        <thead>
          <tr className={dataTableHeadRow}>
            <th className={dataTableTh}>{t.knowledge.columns.displayName}</th>
            <th className={dataTableTh}>{t.knowledge.columns.sourceType}</th>
            <th className={dataTableTh}>{t.knowledge.columns.status}</th>
            <th className={`${dataTableTh} hidden md:table-cell`}>
              {t.knowledge.columns.updatedAt}
            </th>
            <th className={`${dataTableTh} w-0`} />
          </tr>
        </thead>
        <DataTableBody>
          {sources.map((source) => {
            const websiteSourceId = source.website_source_id;
            return (
              <DataTableRow key={source.id}>
                <td className={`${dataTableTd} font-medium`}>{source.display_name}</td>
                <td className={dataTableTd}>{t.knowledge.sourceType[source.source_type]}</td>
                <td className={dataTableTd}>
                  <StatusBadge
                    label={t.knowledge.status[source.status]}
                    tone={STATUS_TONE[source.status]}
                  />
                  {/* A bare "Pending" left testers unsure whether anything was
                      happening, or for how long. With `progress` (backend
                      2026-10-13) it says which step, with live counts, and a
                      website waiting on the user gets a button to act. */}
                  {(source.status === 'pending' || source.status === 'processing') && (
                    <SourceProgressHint
                      source={source}
                      pagesHref={
                        websiteSourceId
                          ? `/agents/${agentTypeSlug}/knowledge/${websiteSourceId}`
                          : null
                      }
                    />
                  )}
                  {/* A website that failed used to give no reason and no way
                      back short of the overflow menu (client testing, 13 Oct
                      2026). The usual cause is an address with no readable
                      pages, so say that and offer the retry right here. */}
                  {source.status === 'failed' && websiteSourceId && (
                    <div className="mt-1 max-w-56 space-y-1.5">
                      <p className="text-muted-foreground text-xs">{t.knowledge.list.failedHint}</p>
                      {canExecute && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => recrawl(websiteSourceId)}
                        >
                          {t.knowledge.list.retry}
                        </Button>
                      )}
                    </div>
                  )}
                </td>
                <td className={`${dataTableTd} text-muted-foreground hidden text-sm md:table-cell`}>
                  {formatDate(source.updated_at)}
                </td>
                <td className={dataTableTd}>
                  <div className="flex items-center justify-end gap-1">
                    {/* Promoted out of the overflow menu: this is the only way
                        to see what a crawl actually fetched, and behind a
                        three-dot menu it read as "there are no options here".
                        Viewing needs no execute right either — the panel's own
                        recrawl button is what's privileged, not the list. */}
                    {websiteSourceId && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/agents/${agentTypeSlug}/knowledge/${websiteSourceId}`}>
                          {t.knowledge.actions.viewPages}
                        </Link>
                      </Button>
                    )}
                    {(canManage || canExecute) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={format(t.knowledge.actions.moreActions, {
                              name: source.display_name,
                            })}
                          >
                            <MoreHorizontal className="size-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canManage && (
                            <DropdownMenuItem onClick={() => setRenameTarget(source)}>
                              {t.knowledge.actions.edit}
                            </DropdownMenuItem>
                          )}
                          {canExecute && (
                            <DropdownMenuItem onClick={() => reprocess(source.id)}>
                              {t.knowledge.actions.reprocess}
                            </DropdownMenuItem>
                          )}
                          {canExecute && websiteSourceId && (
                            <DropdownMenuItem onClick={() => recrawl(websiteSourceId)}>
                              {t.knowledge.actions.recrawl}
                            </DropdownMenuItem>
                          )}
                          {canManage &&
                            (source.status === 'disabled' ? (
                              <DropdownMenuItem onClick={() => enable(source.id)}>
                                {t.knowledge.actions.enable}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => disable(source.id)}>
                                {t.knowledge.actions.disable}
                              </DropdownMenuItem>
                            ))}
                          {canManage && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(source)}
                            >
                              {t.knowledge.actions.delete}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </td>
              </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTable>

      <RenameSourceDialog
        source={renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.knowledge.deleteConfirm.title}</AlertDialogTitle>
            <AlertDialogDescription>{t.knowledge.deleteConfirm.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.knowledge.deleteConfirm.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  if (deleteTarget) await remove(deleteTarget.id);
                  setDeleteTarget(null);
                } catch {
                  // Already surfaced by the mutation's error toast. Caught so
                  // the rejection is not left unhandled; the dialog stays open
                  // on failure, as it did before.
                }
              }}
            >
              {t.knowledge.deleteConfirm.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** The in-progress line under a source's status badge. */
function SourceProgressHint({
  source,
  pagesHref,
}: Readonly<{ source: KnowledgeSourceListItem; pagesHref: string | null }>) {
  const progress = source.progress;
  if (!progress) {
    return (
      <p className="text-muted-foreground mt-1 max-w-56 text-xs">{t.knowledge.list.pendingHint}</p>
    );
  }
  const line = progressLine(progress, progress.stage);

  return (
    <div className="mt-1 max-w-56 space-y-1.5">
      <p className="text-muted-foreground text-xs tabular-nums">{line.text}</p>
      {line.percent !== null && (
        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-[width] duration-500"
            style={{ width: `${line.percent}%` }}
          />
        </div>
      )}
      {progress.stage === 'choosing' && pagesHref && (
        <Button size="sm" asChild>
          <Link href={pagesHref}>{t.knowledge.list.choosePages}</Link>
        </Button>
      )}
    </div>
  );
}
