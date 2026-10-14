'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowUpCircle, Bot, Settings2 } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { ConversationsListView } from '@/app/(restricted)/conversations/components/ConversationsListView';
import { LeadsListView } from '@/app/(restricted)/leads/components/LeadsListView';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
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
import { agentStatusBadge } from '@/app/(restricted)/agents/agentStatusBadge';

import { useAgentDetail } from '../hooks/useAgentDetail';
import { KnowledgeSourcesView } from '../knowledge/components/KnowledgeSourcesView';
import { AgentSettingsView } from '../settings/components/AgentSettingsView';
import { AgentDetailSkeleton } from './AgentDetailSkeleton';
import { AgentDraftTab } from './AgentDraftTab';
import { AgentOverviewTab } from './AgentOverviewTab';
import { AgentPublishTab } from './AgentPublishTab';
import { AgentSetupChecklist } from './AgentSetupChecklist';
import { AgentTestTab } from './AgentTestTab';

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
const AGENT_TABS = [
  'overview',
  'conversations',
  'prospects',
  'knowledge',
  'settings',
  'draft',
  'publish',
  'test',
] as const;
type AgentTab = (typeof AGENT_TABS)[number];

function isAgentTab(value: string | null): value is AgentTab {
  return AGENT_TABS.includes(value as AgentTab);
}

export function AgentDetailView({ agentTypeSlug }: Props) {
  const { agent, isLoading, isError, isNotFound, refetch } = useAgentDetail(agentTypeSlug);
  const { can } = usePermissions();
  const searchParamsTab = useSearchParams().get('tab');
  const canViewKnowledge = can('knowledge', 'view');
  const canViewConversations = can('conversation', 'view');
  const canViewLeads = can('lead', 'view');
  const canManage = can('agent', 'manage');
  const gatedTabs: Partial<Record<AgentTab, boolean>> = {
    conversations: canViewConversations,
    prospects: canViewLeads,
    knowledge: canViewKnowledge,
  };
  const isTabVisible = (candidate: AgentTab) => gatedTabs[candidate] ?? true;
  /* Mirrored into the URL so refreshing or sharing the link keeps whichever
     tab was open — the eight tabs here are effectively eight screens, and
     losing the current one on every reload was the reported complaint. Falls
     back to Overview for a missing, stale, or unpermitted
     `?tab=` value (an old bookmark, a typo, a link shared by someone with
     broader access) rather than rendering a tab with no content mounted. */
  const urlTab: AgentTab =
    isAgentTab(searchParamsTab) && isTabVisible(searchParamsTab) ? searchParamsTab : 'overview';
  /* The open tab is client state seeded from the URL, not read straight off it.
     `router.replace` re-requests the route from the server on every tab click,
     and `useSearchParams` only reports the new `?tab=` once that response
     commits. Deployed, that round-trip goes through the auth proxy and can be
     slow, or fail outright on an expired session, so the address bar changed
     while the panel stayed on the old tab. Locally the round-trip is instant,
     which is why it only ever showed on the server. */
  const [tab, setTab] = useState<AgentTab>(urlTab);
  /* Keeps the panel honest when the URL moves on its own: Back/Forward, or a
     permission gate retiring the tab that was open. Adjusted during render
     rather than in an effect, which is React's own answer for state that has
     to follow an external value (and what the lint rule asks for). */
  const [syncedUrlTab, setSyncedUrlTab] = useState<AgentTab>(urlTab);
  if (urlTab !== syncedUrlTab) {
    setSyncedUrlTab(urlTab);
    setTab(urlTab);
  }
  /* Radix unmounts the inactive tab's content, so leaving Draft with edits in
     flight discards them silently. The draft form reports its dirty state up
     here so the switch can be confirmed first — the natural next step after
     writing instructions is the Knowledge tab, and the checklist above sends
     people between tabs by design, so this was easy to hit. */
  const [isDraftDirty, setIsDraftDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const goToTab = useCallback((next: string) => {
    if (!isAgentTab(next)) return;
    setTab(next);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', next);
    /* `history.replaceState`, not `router.replace`: the tab is already switched
       above, so this only has to leave a shareable, reload-proof URL behind.
       Next syncs its own router state from the native History API, and no
       server request is made. `replaceState`, not `pushState`, because
       switching tabs is a view change, not a new page — pushing would add a
       Back-button stop per tab click. */
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, []);

  const requestTab = (next: string) => {
    if (tab === 'draft' && next !== 'draft' && isDraftDirty) {
      setPendingTab(next);
      return;
    }
    goToTab(next);
  };

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
      {/* No "Back to agents" link here: the header's Back and the
          "Agents" breadcrumb above already go there (client testing,
          14 Oct 2026: three back links on one screen). */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-6">
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
                  {...agentStatusBadge(agent.status, agent.published_version !== null)}
                />
                <span className="text-muted-foreground text-xs">{t.agents.levelBasic}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => requestTab('settings')}>
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

      {canManage && <AgentSetupChecklist agent={agent} onNavigate={requestTab} />}

      <Tabs value={tab} onValueChange={requestTab}>
        {/* Full-width underlined tab row, as the reference draws it. The
            triggers are `flex-none` because the stock `line` variant still
            inherits `flex-1`, which would stretch eight tabs across the page
            instead of leaving them at their natural width. */}
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto overflow-y-hidden rounded-none border-b [&>button]:flex-none"
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
        {t.agents.detail.tabPurpose[tab] && (
          <p className="text-muted-foreground mt-1 text-sm">{t.agents.detail.tabPurpose[tab]}</p>
        )}

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
            <KnowledgeSourcesView agentId={agent.id} agentTypeSlug={agentTypeSlug} />
          </TabsContent>
        )}
        <TabsContent value="settings">
          <AgentSettingsView agent={agent} />
        </TabsContent>
        <TabsContent value="draft">
          <AgentDraftTab agent={agent} onDirtyChange={setIsDraftDirty} />
        </TabsContent>
        <TabsContent value="publish">
          <AgentPublishTab agent={agent} onNavigate={requestTab} />
        </TabsContent>
        <TabsContent value="test">
          <AgentTestTab agent={agent} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={pendingTab !== null} onOpenChange={() => setPendingTab(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.agents.detail.draft.leaveConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.agents.detail.draft.leaveConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.agents.detail.draft.leaveConfirmStay}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingTab) goToTab(pendingTab);
                setPendingTab(null);
                setIsDraftDirty(false);
              }}
            >
              {t.agents.detail.draft.leaveConfirmDiscard}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
