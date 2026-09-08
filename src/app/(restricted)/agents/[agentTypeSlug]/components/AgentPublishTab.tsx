'use client';

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
import { format, formatDate } from '@/lib/i18n';
import { t } from '@/locales';
import type { Agent } from '@/types/agent';

import { useAgentActions } from '../hooks/useAgentActions';

type Props = Readonly<{ agent: Agent }>;

export function AgentPublishTab({ agent }: Props) {
  const { can } = usePermissions();
  const canExecute = can('agent', 'execute');
  const { publish, isPublishing, rollback, isRollingBack } = useAgentActions(agent.id);
  const publishedVersion = agent.published_version;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.agents.detail.publish.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t.agents.detail.publish.draftStatus}</p>
              {agent.draft_version ? (
                <p className="text-muted-foreground text-sm">
                  {format(t.agents.detail.publish.versionLabel, {
                    number: agent.draft_version.version_number,
                  })}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">{t.agents.detail.publish.noDraft}</p>
              )}
            </div>
            {canExecute && agent.draft_version && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isPublishing}>{t.agents.detail.publish.publishAction}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t.agents.detail.publish.publishConfirmTitle}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t.agents.detail.publish.publishConfirmDescription}
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

          <div className="border-border border-t pt-4">
            <p className="text-sm font-medium">{t.agents.detail.publish.publishedStatus}</p>
            {agent.published_version ? (
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge label={t.agents.status.active} tone="success" />
                <p className="text-muted-foreground text-sm">
                  {format(t.agents.detail.publish.versionLabel, {
                    number: agent.published_version.version_number,
                  })}{' '}
                  · {formatDate(agent.published_version.published_at)}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground mt-1 text-sm">
                {t.agents.detail.publish.noPublished}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {canExecute && publishedVersion && (
        <Card>
          <CardHeader>
            <CardTitle>{t.agents.detail.publish.historyTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">
                {format(t.agents.detail.publish.versionLabel, {
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
                    <AlertDialogTitle>
                      {t.agents.detail.publish.rollbackConfirmTitle}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t.agents.detail.publish.rollbackConfirmDescription}
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
