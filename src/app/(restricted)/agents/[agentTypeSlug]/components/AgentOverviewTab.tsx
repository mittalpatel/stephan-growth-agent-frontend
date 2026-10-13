'use client';

import { AlertTriangle, Check } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { MetricCard } from '@/components/common/MetricCard';
import { WorkflowDiagram } from '@/components/common/WorkflowDiagram';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AGENT_TYPE_ROADMAP } from '@/constants/agentTypes';
import { formatNumber } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { t } from '@/locales';
import type { AnalyticsRange } from '@/types/conversation';
import type { Agent } from '@/types/agent';

import { useAgentPerformance } from '../hooks/useAgentPerformance';
import { AgentUpgradeCard } from './AgentUpgradeCard';

type Props = Readonly<{ agent: Agent }>;

const RANGES: readonly AnalyticsRange[] = ['7d', '30d', '90d'];

/** Labels in payload order, so the loading skeleton is the shape of the result. */
const METRIC_KEYS = ['conversations', 'leads', 'escalations', 'unresolvedTopics'] as const;

/**
 * The Overview tab: what this agent has actually done, what it can do, and
 * how it works. Mirrors the reference platform's agent overview, with the
 * difference that the numbers here are real (`GET
 * /agents/{id}/analytics/summary/`) rather than the reference's fixtures.
 *
 * The agent's editable fields moved to the Settings tab in the same change
 * that introduced this layout. Capabilities and the workflow come from
 * `AGENT_TYPE_ROADMAP`, not the API: `AgentTypeSerializer` exposes no
 * `AgentTypeCapability` rows, so there is nothing to read them from.
 */
export function AgentOverviewTab({ agent }: Props) {
  const performance = useAgentPerformance(agent.id);
  const roadmap = AGENT_TYPE_ROADMAP.find((entry) => entry.slug === agent.agent_type?.slug);

  const metrics = performance.summary
    ? [
        { label: t.analytics.metrics.conversations, value: performance.summary.conversation_count },
        { label: t.analytics.metrics.leads, value: performance.summary.lead_count },
        { label: t.analytics.metrics.escalations, value: performance.summary.escalation_count },
        {
          label: t.analytics.metrics.unresolvedTopics,
          value: performance.summary.unresolved_topic_count,
        },
      ]
    : [];

  function renderMetrics() {
    if (performance.isLoading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRIC_KEYS.map((key) => (
            <MetricCard key={key} label={t.analytics.metrics[key]} value="" isLoading />
          ))}
        </div>
      );
    }

    if (performance.isError) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title={t.agents.detail.overview.performanceError}
          action={
            <Button variant="outline" onClick={() => void performance.refetch()}>
              {t.buttons.tryAgain}
            </Button>
          }
        />
      );
    }

    // All zeros is the normal state for a new agent, and a row of 0s alone
    // reads like a broken counter rather than "nothing has happened yet".
    const noActivity = metrics.every((metric) => metric.value === 0);

    return (
      <div className="space-y-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={formatNumber(metric.value)}
            />
          ))}
        </div>
        {noActivity && (
          <p className="text-muted-foreground text-sm">{t.agents.detail.overview.noActivity}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">
            {t.agents.detail.overview.performanceTitle}
          </h2>
          <div
            role="group"
            aria-label={t.analytics.range.label}
            className="bg-muted flex items-center gap-1 rounded-lg p-1"
          >
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                aria-pressed={performance.range === range}
                onClick={() => performance.setRange(range)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                  performance.range === range
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t.dashboard.range[range]}
              </button>
            ))}
          </div>
        </div>
        {renderMetrics()}
      </section>

      {roadmap && roadmap.capabilities.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">
            {t.agents.detail.overview.capabilitiesTitle}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roadmap.capabilities.map((capability) => (
              <li
                key={capability}
                className="bg-card flex items-center gap-2.5 rounded-xl border px-4 py-3"
              >
                <span className="bg-success/15 text-success-foreground flex size-7 shrink-0 items-center justify-center rounded-full">
                  <Check className="size-3.5" aria-hidden />
                </span>
                <span className="text-sm font-medium">{capability}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {roadmap && roadmap.workflow.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">
            {t.agents.detail.overview.howItWorksTitle}
          </h2>
          <Card className="py-5">
            <CardContent className="px-5">
              <WorkflowDiagram
                steps={roadmap.workflow}
                label={t.agents.detail.overview.howItWorksTitle}
              />
            </CardContent>
          </Card>
        </section>
      )}

      {roadmap && (
        <AgentUpgradeCard
          title={roadmap.upgrade.title}
          bullets={roadmap.upgrade.bullets}
          cta={roadmap.upgrade.cta}
        />
      )}
    </div>
  );
}
