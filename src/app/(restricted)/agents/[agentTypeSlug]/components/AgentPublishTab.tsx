'use client';

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
import { StatusBadge } from '@/components/common/StatusBadge';
import { format, formatDateTime } from '@/lib/i18n';
import { t } from '@/locales';
import type { Agent } from '@/types/agent';

import { useAgentActions } from '../hooks/useAgentActions';

type Props = Readonly<{ agent: Agent; onNavigate: (tab: string) => void }>;

const copy = t.agents.detail.publish;

export function AgentPublishTab({ agent, onNavigate }: Props) {
  const { can } = usePermissions();
  const canExecute = can('agent', 'execute');
  const { publish, isPublishing, rollback, isRollingBack } = useAgentActions(agent.id);
  const publishedVersion = agent.published_version;
  const draftVersion = agent.draft_version;

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
              <AlertDialog>
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
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.agents.detail.overview.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => rollback(publishedVersion.id)}>
                      {t.agents.actions.rollback}
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
