'use client';

import Link from 'next/link';
import { ArrowRight, Bot, Circle, CircleCheck, Sparkles, TrendingUp } from 'lucide-react';

import { useAgentsList } from '@/app/(restricted)/agents/hooks/useAgentsList';
import { useUser } from '@/app/(restricted)/context/UserContext';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDate } from '@/lib/i18n';
import { t } from '@/locales';
import { LEADS_LIST_KEY, buildLeadListParams, leadsListUrl } from '@/services/leads';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import type { ApiResponse } from '@/types/api';
import type { LeadListItem } from '@/types/lead';

import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics';
import { useSetupChecklist, type SetupChecklistItemKey } from '../hooks/useSetupChecklist';

/**
 * Where each outstanding setup step is actually completed. A checklist that
 * only reports state makes the user hunt for the page; these turn each
 * remaining step into one click. `organization_created` has no entry: it is
 * always already done by the time anyone can see this.
 */
const CHECKLIST_HREF: Partial<Record<SetupChecklistItemKey, string>> = {
  team_member_invited: '/organization/members',
  agent_created: '/agents',
  agent_published: '/agents',
  knowledge_source_added: '/agents',
};

const RECENT_LEADS_QUERY = {
  page: 1,
  limit: 5,
  search: [],
  search_by: '',
  sort: 'created_at',
  sort_direction: 'desc' as const,
  filter: [],
  filter_by: [],
};

/**
 * Sprint 1 Phase 3: the app home wired to real aggregates. `useDashboardAnalytics`
 * sums each agent's `analytics/summary` (no org-wide endpoint exists); the
 * agent grid reuses Phase 1's `useAgentsList`; recent activity is the org's
 * most recently captured leads. The trial-promo panel and business-value
 * trend chart from the Sprint 1 static preview had no backend equivalent and
 * were fabricated numbers, so both were dropped rather than wired to nothing.
 */
export function DashboardView() {
  const { session } = useUser();
  const firstName = session.user.full_name?.split(' ')[0] ?? '';
  const {
    summary,
    perAgent,
    range,
    setRange,
    isLoading: analyticsLoading,
  } = useDashboardAnalytics();
  const agentsList = useAgentsList();
  const {
    items: checklistItems,
    isLoading: checklistLoading,
    isComplete,
    completedCount,
  } = useSetupChecklist();

  const recentLeadsQuery = useAuthQuery<ApiResponse<LeadListItem[]>>(
    [LEADS_LIST_KEY, buildLeadListParams(RECENT_LEADS_QUERY)],
    leadsListUrl(RECENT_LEADS_QUERY)
  );
  const recentLeads = recentLeadsQuery.data?.data ?? [];

  const metrics = [
    { label: t.dashboard.metrics.activeAgents, value: String(agentsList.total) },
    { label: t.dashboard.metrics.conversations, value: String(summary.conversation_count) },
    { label: t.dashboard.metrics.escalations, value: String(summary.escalation_count) },
    { label: t.dashboard.metrics.leadsCaptured, value: String(summary.lead_count) },
    { label: t.dashboard.metrics.unresolvedTopics, value: String(summary.unresolved_topic_count) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight">
            {firstName ? format(t.dashboard.greeting, { name: firstName }) : t.dashboard.title}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-[15px]">{t.dashboard.welcome}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-muted flex items-center gap-1 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  range === r ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {t.dashboard.range[r]}
              </button>
            ))}
          </div>
          <Button variant="outline" className="gap-1.5" asChild>
            <Link href="/analytics">
              <TrendingUp className="size-[15px]" />
              {t.dashboard.actions.viewAnalytics}
            </Link>
          </Button>
          <Button className="gap-1.5" asChild>
            <Link href="/agents">
              <Sparkles className="size-[15px]" />
              {t.dashboard.actions.exploreAgents}
            </Link>
          </Button>
        </div>
      </div>

      {!checklistLoading && !isComplete && checklistItems.length > 0 && (
        <Card>
          <CardContent>
            <h3 className="font-display mb-1 font-bold">{t.dashboard.checklist.title}</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {format(t.dashboard.checklist.progress, {
                done: completedCount,
                total: checklistItems.length,
              })}
            </p>
            <div className="flex flex-col divide-y">
              {checklistItems.map((item) => {
                const href = CHECKLIST_HREF[item.key];
                return (
                  <div key={item.key} className="flex items-center gap-3 py-2.5">
                    {item.done ? (
                      <CircleCheck className="text-success size-4 shrink-0" aria-hidden />
                    ) : (
                      <Circle className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    )}
                    {/* A done step is a record, not an action, so only the
                        outstanding ones link anywhere. */}
                    {item.done || !href ? (
                      <span className="text-muted-foreground text-sm line-through">
                        {t.dashboard.checklist.items[item.key]}
                      </span>
                    ) : (
                      <Link href={href} className="text-sm font-medium hover:underline">
                        {t.dashboard.checklist.items[item.key]}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {metrics.map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-3">
              <span className="text-muted-foreground text-sm font-medium">{label}</span>
              {analyticsLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <span className="font-display text-3xl font-bold tracking-tight">{value}</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{t.dashboard.agentPerformance.title}</h2>
          <Link href="/agents" className="text-primary text-sm font-semibold hover:underline">
            {t.dashboard.agentPerformance.viewAll}
          </Link>
        </div>
        {perAgent.length === 0 && !agentsList.isLoading ? (
          <EmptyState icon={Bot} title={t.dashboard.agentPerformance.empty} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {perAgent.map(({ agent, summary: agentSummary, isLoading }) => (
              <Card key={agent.id}>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-brand-accent/15 text-brand-accent flex size-10 shrink-0 items-center justify-center rounded-xl">
                        <Bot className="size-[19px]" />
                      </span>
                      <div>
                        <p className="text-[15px] leading-tight font-semibold">{agent.name}</p>
                      </div>
                    </div>
                    <StatusBadge
                      label={t.agents.status[agent.status]}
                      tone={agent.status === 'active' ? 'success' : 'neutral'}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted rounded-xl px-3 py-2.5">
                      <p className="text-muted-foreground text-[11px]">
                        {t.dashboard.agentPerformance.conversations}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold">
                        {isLoading ? '–' : agentSummary.conversation_count}
                      </p>
                    </div>
                    <div className="bg-muted rounded-xl px-3 py-2.5">
                      <p className="text-muted-foreground text-[11px]">
                        {t.dashboard.agentPerformance.leads}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold">
                        {isLoading ? '–' : agentSummary.lead_count}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <Link
                      href={`/agents/${agent.id}`}
                      className="text-primary inline-flex items-center gap-1 text-sm font-semibold hover:gap-1.5"
                    >
                      {t.dashboard.agentPerformance.viewAgent} <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardContent>
          <h3 className="font-display mb-4 font-bold">{t.dashboard.activity.title}</h3>
          {recentLeads.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t.dashboard.activity.empty}</p>
          ) : (
            <div className="flex flex-col divide-y">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{lead.name || lead.email}</p>
                    <p className="text-muted-foreground text-xs">{lead.status}</p>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatDate(lead.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
