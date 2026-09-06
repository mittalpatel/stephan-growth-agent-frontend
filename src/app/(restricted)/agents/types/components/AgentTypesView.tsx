'use client';

import { AlertTriangle, Bot } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { t } from '@/locales';

import { useAgentTypes } from '../../hooks/useAgentTypes';
import { AgentTypesSkeleton } from './AgentTypesSkeleton';

/**
 * Informational browse page for the platform's full `AgentType` catalog
 * (`?include_unavailable=true`) — the closest real equivalent to
 * `ai-agents-platform`'s marketplace page. Deliberately has no create
 * action or CTA button anywhere: unlike the reference, agents aren't
 * created from a type picker in this app, so each card just states whether
 * that kind of agent is available yet.
 */
export function AgentTypesView() {
  const { agentTypes, isLoading, isError, refetch } = useAgentTypes();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.agents.types.title} description={t.agents.types.description} />

      {isLoading ? (
        <AgentTypesSkeleton />
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title={t.agents.types.errorTitle}
          description={t.agents.types.errorDescription}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              {t.buttons.tryAgain}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {agentTypes.map((agentType) => (
            <Card key={agentType.id}>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <span className="bg-brand-accent/15 text-brand-accent flex size-12 shrink-0 items-center justify-center rounded-xl">
                    <Bot className="size-[22px]" />
                  </span>
                  <StatusBadge
                    label={
                      agentType.is_available ? t.agents.types.available : t.agents.types.comingSoon
                    }
                    tone={agentType.is_available ? 'success' : 'neutral'}
                  />
                </div>

                <div>
                  <h3 className="font-display text-lg font-bold">{agentType.name}</h3>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    {agentType.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
