'use client';

import { AlertTriangle, Plug } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDate } from '@/lib/i18n';
import { t } from '@/locales';

import { useIntegrations } from '../hooks/useIntegrations';

/**
 * The integrations catalog. A pure presenter over `useIntegrations` with the
 * four designed states, same shape as every other list screen here.
 *
 * The backend app makes no real external calls yet (connect/disconnect only
 * flip a status flag and store an opaque credential reference), so the page
 * says so rather than implying a live sync is running.
 */
export function IntegrationsView() {
  const { integrations, isLoading, isError, refetch, connect, disconnect, pendingId } =
    useIntegrations();
  const { can } = usePermissions();
  const canManage = can('integration', 'manage');

  function renderBody() {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title={t.integrations.errorTitle}
          description={t.integrations.errorDescription}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              {t.buttons.tryAgain}
            </Button>
          }
        />
      );
    }

    if (integrations.length === 0) {
      return (
        <EmptyState
          icon={Plug}
          title={t.integrations.emptyTitle}
          description={t.integrations.emptyDescription}
        />
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => {
          const isConnected = integration.status === 'connected';
          const isPending = pendingId === integration.id;

          return (
            <Card key={integration.id}>
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {t.integrations.category[integration.category]}
                    </p>
                  </div>
                  <StatusBadge
                    label={
                      isConnected
                        ? t.integrations.status.connected
                        : t.integrations.status.notConnected
                    }
                    tone={isConnected ? 'success' : 'neutral'}
                  />
                </div>

                <p className="text-muted-foreground text-sm">{integration.description}</p>

                {/* `detail` is whatever the connect call stored (an account
                    name, a workspace) — shown only when there is one. */}
                {integration.detail ? (
                  <p className="text-sm font-medium">{integration.detail}</p>
                ) : null}

                {isConnected && integration.connected_at ? (
                  <p className="text-muted-foreground text-xs">
                    {format(t.integrations.connectedAt, {
                      date: formatDate(integration.connected_at),
                    })}
                  </p>
                ) : null}

                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-auto self-start"
                    disabled={isPending}
                    onClick={() =>
                      isConnected ? disconnect(integration.id) : connect(integration.id)
                    }
                  >
                    {isConnected
                      ? t.integrations.actions.disconnect
                      : t.integrations.actions.connect}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.integrations.title} description={t.integrations.description} />
      {renderBody()}
    </div>
  );
}
