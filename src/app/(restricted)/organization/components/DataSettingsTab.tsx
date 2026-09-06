'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/i18n';
import { t } from '@/locales';
import type { OrgDataExportStatus } from '@/types/settings';

import { useOrganizationDataSettings } from '../hooks/useOrganizationDataSettings';

const STATUS_TONE: Record<OrgDataExportStatus, StatusTone> = {
  pending: 'neutral',
  processing: 'warning',
  ready: 'success',
  failed: 'danger',
};

export function DataSettingsTab() {
  const {
    exports,
    isLoading,
    isError,
    refetch,
    canExport,
    canDelete,
    requestExport,
    downloadExport,
    downloadingId,
    requestDelete,
    isPending,
  } = useOrganizationDataSettings();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Neither section is visible to a member holding only `organization:view`,
  // which would leave an empty tab body with no explanation.
  if (!canExport && !canDelete) {
    return (
      <p className="text-muted-foreground text-sm">
        {t.organizations.settingsTabs.data.noPermission}
      </p>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      {canExport && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{t.organizations.settingsTabs.data.exportTitle}</h3>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => void requestExport()}
            >
              {t.organizations.settingsTabs.data.requestExport}
            </Button>
          </div>

          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : isError ? (
            <EmptyState
              icon={AlertTriangle}
              title={t.organizations.settingsTabs.data.exportsErrorTitle}
              description={t.organizations.settingsTabs.data.exportsErrorDescription}
              action={
                <Button variant="outline" onClick={() => void refetch()}>
                  {t.buttons.tryAgain}
                </Button>
              }
            />
          ) : exports.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t.organizations.settingsTabs.data.noExports}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {exports.map((exp) => (
                <div
                  key={exp.id}
                  className="border-border flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <StatusBadge
                      label={t.organizations.settingsTabs.data.exportStatus[exp.status]}
                      tone={STATUS_TONE[exp.status]}
                    />
                    <span className="text-muted-foreground text-xs">
                      {formatDate(exp.created_at)}
                    </span>
                    {/* The backend records why a job failed; showing it here is
                        the only place a user can find out. */}
                    {exp.status === 'failed' && exp.error_message ? (
                      <span className="text-destructive truncate text-xs">{exp.error_message}</span>
                    ) : null}
                  </div>
                  {exp.status === 'ready' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={downloadingId === exp.id}
                      onClick={() => downloadExport(exp.id)}
                    >
                      {downloadingId === exp.id
                        ? t.organizations.settingsTabs.data.downloading
                        : t.organizations.settingsTabs.data.download}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {canDelete && (
        <section className="border-destructive/40 space-y-3 rounded-lg border p-6">
          <h3 className="text-destructive text-sm font-medium">
            {t.organizations.settingsTabs.data.deleteTitle}
          </h3>
          <p className="text-muted-foreground text-sm">
            {t.organizations.settingsTabs.data.deleteDescription}
          </p>
          <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
            {t.organizations.settingsTabs.data.deleteAction}
          </Button>
        </section>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        destructive
        title={t.organizations.settingsTabs.data.deleteConfirmTitle}
        message={t.organizations.settingsTabs.data.deleteConfirmEmailBody}
        loading={isPending}
        onConfirm={() => {
          void requestDelete();
          setConfirmingDelete(false);
        }}
        onOpenChange={setConfirmingDelete}
      />
    </div>
  );
}
