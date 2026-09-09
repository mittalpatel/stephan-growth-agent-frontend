'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ArrowUpCircle, Bot, Settings2 } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { ConversationsListView } from '@/app/(restricted)/conversations/components/ConversationsListView';
import { LeadsListView } from '@/app/(restricted)/leads/components/LeadsListView';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AGENT_TYPE_ACCENT_FALLBACK,
  AGENT_TYPE_ACCENTS,
  AGENT_TYPE_ICONS,
  AGENT_TYPE_ROADMAP,
  isAgentTypeSlug,
} from '@/constants/agentTypes';
import { cn } from '@/lib/utils';
import { t } from '@/locales';
import type { AgentStatus } from '@/types/agent';

import { useAgentDetail } from '../hooks/useAgentDetail';
import { KnowledgeSourcesView } from '../knowledge/components/KnowledgeSourcesView';
import { AgentSettingsView } from '../settings/components/AgentSettingsView';
import { AgentDetailSkeleton } from './AgentDetailSkeleton';
import { AgentDraftTab } from './AgentDraftTab';
import { AgentOverviewTab } from './AgentOverviewTab';
import { AgentPublishTab } from './AgentPublishTab';
import { AgentSetupChecklist } from './AgentSetupChecklist';
import { AgentTestTab } from './AgentTestTab';

const STATUS_TONE: Record<AgentStatus, StatusTone> = {
  active: 'success',
  paused: 'warning',
  archived: 'neutral',
};

type Props = Readonly<{ agentTypeSlug: string }>;

/**
 * One agent, addressed by its type slug and laid out as tabs, matching the
 * reference platform's agent workspace.
 *
 * Conversations, Prospects, Knowledge and Settings were four separate places
 * before this: two nested routes (`/agents/[id]/knowledge`, `.../settings`)
 * and two org-wide pages. They are the same components, reused here with the
 * agent pinned, so there is still exactly one implementation of each screen
 * and `/conversations` and `/leads` keep working org-wide.
 *
 * Draft, Publish and Test have no counterpart in the reference, which mocks
 * its configuration screen. They are real here (versioned config, publish and
 * rollback, test-ask against the draft) and are kept alongside the reference's
 * own tabs rather than dropped to match it.
 */
export function AgentDetailView({ agentTypeSlug }: Props) {
  const { agent, isLoading, isError, isNotFound, refetch } = useAgentDetail(agentTypeSlug);
  const { can } = usePermissions();
  /* Controlled so the header's Configure button can jump to Settings, the way
     the reference's header does. Every other tab switch still goes through
     Radix untouched. */
  const [tab, setTab] = useState('overview');
  const canViewKnowledge = can('knowledge', 'view');
  const canViewConversations = can('conversation', 'view');
  const canViewLeads = can('lead', 'view');
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

  const Icon = isAgentTypeSlug(agentTypeSlug) ? AGENT_TYPE_ICONS[agentTypeSlug] : Bot;
  const accent = isAgentTypeSlug(agentTypeSlug)
    ? AGENT_TYPE_ACCENTS[agentTypeSlug]
    : AGENT_TYPE_ACCENT_FALLBACK;
  /*
   * Not `agent.agent_type?.description`: that field is the backend's
   * engineering commentary ("Sprint 1's Agent 1..."), not marketing copy —
   * same drift fixed in `useAgentCatalog.ts` for the marketplace card. The
   * roadmap entry carries the description actually written for display.
   */
  const description =
    AGENT_TYPE_ROADMAP.find((entry) => entry.slug === agentTypeSlug)?.description ??
    agent.agent_type?.description;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/agents"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t.agents.detail.backToList}
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <span
              className={cn(
                'flex size-14 shrink-0 items-center justify-center rounded-2xl',
                accent
              )}
            >
              <Icon className="size-6" aria-hidden />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">{agent.name}</h1>
              {description && (
                <p className="text-muted-foreground mt-1 max-w-xl text-[15px] leading-relaxed">
                  {description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <StatusBadge
                  label={t.agents.status[agent.status]}
                  tone={STATUS_TONE[agent.status]}
                />
                <span className="text-muted-foreground text-xs">{t.agents.levelBasic}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setTab('settings')}>
              <Settings2 aria-hidden />
              {t.agents.detail.configure}
            </Button>
            <Button size="sm" asChild>
              <Link href="/organization/billing">
                <ArrowUpCircle aria-hidden />
                {t.agents.detail.upgrade}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {canManage && <AgentSetupChecklist agent={agent} onNavigate={setTab} />}

      <Tabs value={tab} onValueChange={setTab}>
        {/* Full-width underlined tab row, as the reference draws it. The
            triggers are `flex-none` because the stock `line` variant still
            inherits `flex-1`, which would stretch eight tabs across the page
            instead of leaving them at their natural width. */}
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto rounded-none border-b [&>button]:flex-none"
        >
          <TabsTrigger value="overview">{t.agents.detail.tabs.overview}</TabsTrigger>
          {canViewConversations && (
            <TabsTrigger value="conversations">{t.agents.detail.tabs.conversations}</TabsTrigger>
          )}
          {canViewLeads && (
            <TabsTrigger value="prospects">{t.agents.detail.tabs.prospects}</TabsTrigger>
          )}
          {canViewKnowledge && (
            <TabsTrigger value="knowledge">{t.agents.detail.tabs.knowledge}</TabsTrigger>
          )}
          <TabsTrigger value="settings">{t.agents.detail.tabs.settings}</TabsTrigger>
          <TabsTrigger value="draft">{t.agents.detail.tabs.draft}</TabsTrigger>
          <TabsTrigger value="publish">{t.agents.detail.tabs.publish}</TabsTrigger>
          <TabsTrigger value="test">{t.agents.detail.tabs.test}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AgentOverviewTab agent={agent} />
        </TabsContent>
        {canViewConversations && (
          <TabsContent value="conversations">
            <ConversationsListView agentId={agent.id} />
          </TabsContent>
        )}
        {canViewLeads && (
          <TabsContent value="prospects">
            <LeadsListView agentId={agent.id} />
          </TabsContent>
        )}
        {canViewKnowledge && (
          <TabsContent value="knowledge">
            <KnowledgeSourcesView agentId={agent.id} />
          </TabsContent>
        )}
        <TabsContent value="settings">
          <AgentSettingsView agent={agent} />
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
