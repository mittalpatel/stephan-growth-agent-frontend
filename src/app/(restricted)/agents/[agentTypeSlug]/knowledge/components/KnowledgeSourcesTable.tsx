'use client';

import { useState } from 'react';
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
import { formatDate } from '@/lib/i18n';
import { t } from '@/locales';
import type { KnowledgeSourceListItem, KnowledgeSourceStatus } from '@/types/knowledge';

import { useKnowledgeSourceActions } from '../hooks/useKnowledgeSourceActions';
import { KnowledgeSourcePagesPanel } from './KnowledgeSourcePagesPanel';
import { RenameSourceDialog } from './RenameSourceDialog';

const STATUS_TONE: Record<KnowledgeSourceStatus, StatusTone> = {
  pending: 'neutral',
  processing: 'warning',
  ready: 'success',
  failed: 'danger',
  disabled: 'neutral',
};

type Props = Readonly<{ sources: KnowledgeSourceListItem[] }>;

export function KnowledgeSourcesTable({ sources }: Props) {
  const { can } = usePermissions();
  const canManage = can('knowledge', 'manage');
  const canExecute = can('knowledge', 'execute');
  const { remove, reprocess, recrawl } = useKnowledgeSourceActions();
  const [renameTarget, setRenameTarget] = useState<KnowledgeSourceListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeSourceListItem | null>(null);
  const [pagesTarget, setPagesTarget] = useState<KnowledgeSourceListItem | null>(null);

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
                </td>
                <td className={`${dataTableTd} text-muted-foreground hidden text-sm md:table-cell`}>
                  {formatDate(source.updated_at)}
                </td>
                <td className={dataTableTd}>
                  {(canManage || canExecute) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
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
                        {canExecute && websiteSourceId && (
                          <DropdownMenuItem onClick={() => setPagesTarget(source)}>
                            {t.knowledge.actions.managePages}
                          </DropdownMenuItem>
                        )}
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

      <KnowledgeSourcePagesPanel
        source={pagesTarget}
        onOpenChange={(open) => !open && setPagesTarget(null)}
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
