'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, BookOpen, Settings } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { t } from '@/locales';
import type { AgentStatus } from '@/types/agent';

import { useAgentDetail } from '../hooks/useAgentDetail';
import { AgentDetailSkeleton } from './AgentDetailSkeleton';
import { AgentDraftTab } from './AgentDraftTab';
import { AgentOverviewTab } from './AgentOverviewTab';
import { AgentPublishTab } from './AgentPublishTab';
import { AgentTestTab } from './AgentTestTab';

const STATUS_TONE: Record<AgentStatus, StatusTone> = {
  active: 'success',
  paused: 'warning',
  archived: 'neutral',
};

type Props = Readonly<{ agentId: string }>;

export function AgentDetailView({ agentId }: Props) {
  const { agent, isLoading, isError, isNotFound, refetch } = useAgentDetail(agentId);
  const { can } = usePermissions();
  const canViewKnowledge = can('knowledge', 'view');
  const canManage = can('agent', 'manage');

  if (isLoading) return <AgentDetailSkeleton />;

  if (isNotFound) {
    return (
      <EmptyState
        title={t.agents.detail.notFound.title}
        description={t.agents.detail.notFound.description}
        action={
          <Button variant="outline" asChild>
            <Link href="/agents">{t.agents.detail.backToList}</Link>
          </Button>
        }
      />
    );
  }

  if (isError || !agent) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={t.agents.detail.errorTitle}
        description={t.agents.detail.errorDescription}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            {t.buttons.tryAgain}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/agents"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          {t.agents.detail.backToList}
        </Link>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight">{agent.name}</h1>
            <StatusBadge label={t.agents.status[agent.status]} tone={STATUS_TONE[agent.status]} />
          </div>
          <div className="flex items-center gap-2">
            {canViewKnowledge && (
              <Button variant="outline" asChild>
                <Link href={`/agents/${agentId}/knowledge`}>
                  <BookOpen className="size-4" aria-hidden />
                  {t.knowledge.title}
                </Link>
              </Button>
            )}
            {canManage && (
              <Button variant="outline" asChild>
                <Link href={`/agents/${agentId}/settings`}>
                  <Settings className="size-4" aria-hidden />
                  {t.agents.settings.title}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t.agents.detail.tabs.overview}</TabsTrigger>
          <TabsTrigger value="draft">{t.agents.detail.tabs.draft}</TabsTrigger>
          <TabsTrigger value="publish">{t.agents.detail.tabs.publish}</TabsTrigger>
          <TabsTrigger value="test">{t.agents.detail.tabs.test}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <AgentOverviewTab agent={agent} />
        </TabsContent>
        <TabsContent value="draft">
          <AgentDraftTab agent={agent} />
        </TabsContent>
        <TabsContent value="publish">
          <AgentPublishTab agent={agent} />
        </TabsContent>
        <TabsContent value="test">
          <AgentTestTab agent={agent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
