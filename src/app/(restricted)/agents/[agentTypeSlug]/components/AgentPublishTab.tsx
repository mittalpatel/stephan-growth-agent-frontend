'use client';

import { useState } from 'react';
import { FlaskConical, Globe, PencilLine, Rocket } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { format, formatDate, formatDateTime } from '@/lib/i18n';
import { t } from '@/locales';
import type { Agent } from '@/types/agent';

import { useAgentActions } from '../hooks/useAgentActions';
import { useAgentVersions } from '../hooks/useAgentVersions';

type Props = Readonly<{ agent: Agent; onNavigate: (tab: string) => void }>;

const copy = t.agents.detail.publish;

export function AgentPublishTab({ agent, onNavigate }: Props) {
  const { can } = usePermissions();
  const canExecute = can('agent', 'execute');
  const { publish, isPublishing, rollback, isRollingBack } = useAgentActions(agent.id);
  const publishedVersion = agent.published_version;
  const draftVersion = agent.draft_version;

  // Fetched only once the rollback dialog is opened: `GET /versions/` is
  // unbounded and never cached server-side, so there's no reason to pay for
  // it before the picker is actually in view.
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [targetVersionId, setTargetVersionId] = useState<string | null>(null);
  const versions = useAgentVersions(agent.id, rollbackDialogOpen);
  const rollbackChoices = versions.versions.filter((v) => v.id !== publishedVersion?.id);

  function renderVersionPicker() {
    if (versions.isLoading) return <Skeleton className="h-9 w-full" />;

    if (versions.isError) {
      return (
        <div className="flex items-center justify-between gap-2">
          <p className="text-destructive text-sm">{copy.rollbackPickerErrorTitle}</p>
          <Button variant="outline" size="sm" onClick={() => void versions.refetch()}>
            {copy.rollbackPickerRetry}
          </Button>
        </div>
      );
    }

    if (rollbackChoices.length === 0) {
      return <p className="text-muted-foreground text-sm">{copy.rollbackPickerEmpty}</p>;
    }

    return (
      <Select value={targetVersionId ?? ''} onValueChange={setTargetVersionId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={copy.rollbackPickerPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {rollbackChoices.map((version) => (
            <SelectItem key={version.id} value={version.id}>
              {version.published_by_email
                ? format(copy.rollbackVersionByEmail, {
                    number: version.version_number,
                    email: version.published_by_email,
                  })
                : format(copy.rollbackVersionUnpublished, {
                    number: version.version_number,
                    date: formatDate(version.created_at),
                  })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-bold">{copy.title}</h2>
        <p className="text-muted-foreground text-sm">{copy.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="text-muted-foreground size-4" aria-hidden />
              <p className="text-sm font-medium">{copy.publishedStatus}</p>
            </div>
            {publishedVersion ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-2xl font-bold">
                    {format(copy.versionLabel, { number: publishedVersion.version_number })}
                  </p>
                  {/* "Live", not the agent's own status label: a published
                      version is live even while the agent is paused, and the
                      two are different claims. */}
                  <StatusBadge label={copy.liveBadge} tone="success" />
                </div>
                {publishedVersion.published_at && (
                  <p className="text-muted-foreground text-xs">
                    {format(copy.publishedAt, {
                      date: formatDateTime(publishedVersion.published_at),
                    })}
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">{copy.noPublished}</p>
            )}
          </CardContent>
        </Card>

        <Card className={draftVersion ? 'border-primary/40' : undefined}>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <PencilLine className="text-muted-foreground size-4" aria-hidden />
              <p className="text-sm font-medium">{copy.draftStatus}</p>
            </div>
            {draftVersion ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-2xl font-bold">
                    {format(copy.versionLabel, { number: draftVersion.version_number })}
                  </p>
                  <StatusBadge label={copy.unpublishedBadge} tone="warning" />
                </div>
                <p className="text-muted-foreground text-xs">{copy.draftHint}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => onNavigate('test')}>
                    <FlaskConical aria-hidden />
                    {copy.testFirst}
                  </Button>
                  {canExecute && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" disabled={isPublishing}>
                          <Rocket aria-hidden />
                          {copy.publishAction}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{copy.publishConfirmTitle}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {copy.publishConfirmDescription}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t.agents.detail.overview.cancel}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => publish()}>
                            {t.agents.actions.publish}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">{copy.noDraft}</p>
                <Button variant="outline" size="sm" onClick={() => onNavigate('draft')}>
                  <PencilLine aria-hidden />
                  {copy.startDraft}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {canExecute && publishedVersion && (
        <Card>
          <CardHeader>
            <CardTitle>{copy.historyTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">
                {format(copy.versionLabel, {
                  number: publishedVersion.version_number,
                })}
              </p>
              <AlertDialog
                open={rollbackDialogOpen}
                onOpenChange={(open) => {
                  setRollbackDialogOpen(open);
                  if (!open) setTargetVersionId(null);
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isRollingBack}>
                    {t.agents.actions.rollback}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{copy.rollbackConfirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {copy.rollbackConfirmDescription}
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">{copy.rollbackPickerLabel}</p>
                    {renderVersionPicker()}
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.agents.detail.overview.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={!targetVersionId}
                      onClick={() => targetVersionId && rollback(targetVersionId)}
                    >
                      {copy.rollbackAction}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
