'use client';

import { AlertTriangle, Plug } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/locales';

import { useIntegrations } from '../hooks/useIntegrations';

export function IntegrationsView() {
  const { integrations, isLoading, isError, refetch, connect, disconnect, isConnecting } =
    useIntegrations();
  const { can } = usePermissions();
  const canManage = can('integration', 'manage');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.integrations.title} description={t.integrations.description} />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : isError ? (
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
      ) : integrations.length === 0 ? (
        <EmptyState icon={Plug} title={t.integrations.emptyTitle} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {t.integrations.category[integration.category]}
                    </p>
                  </div>
                  <StatusBadge
                    label={
                      integration.status === 'connected'
                        ? t.integrations.status.connected
                        : t.integrations.status.notConnected
                    }
                    tone={integration.status === 'connected' ? 'success' : 'neutral'}
                  />
                </div>
                <p className="text-muted-foreground text-sm">{integration.description}</p>
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isConnecting}
                    onClick={() =>
                      void (integration.status === 'connected'
                        ? disconnect(integration.id)
                        : connect(integration.id))
                    }
                  >
                    {integration.status === 'connected'
                      ? t.integrations.actions.disconnect
                      : t.integrations.actions.connect}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
