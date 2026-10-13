'use client';

import Link from 'next/link';
import { Download, Lock } from 'lucide-react';

import { useDashboardAnalytics } from '@/app/(restricted)/dashboard/hooks/useDashboardAnalytics';
import { MetricCard } from '@/components/common/MetricCard';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/i18n';
import { t } from '@/locales';
import type { AnalyticsRange } from '@/types/conversation';

const RANGES: readonly AnalyticsRange[] = ['7d', '30d', '90d'];

/** Placeholder rows under the blur. Shapes only, never numbers: the client
 * asked for the fabricated sample figures to go (06 Oct 2026), so the teaser
 * must not reintroduce them. */
const LOCKED_ROW_COUNT = 4;

/**
 * Real org-wide analytics, summed from each agent's
 * `GET /agents/{id}/analytics/summary/` by `useDashboardAnalytics` (the same
 * hook, and therefore the same numbers, as the dashboard). This replaced a
 * static preview with hardcoded sample figures that testers mistook for real
 * data.
 *
 * Below the live figures sits the subscription teaser the client asked for:
 * a blurred "detailed reports" panel and a locked Export, both pointing at
 * billing. What is blurred is placeholder shapes, so nothing paid is ever
 * sent to the browser.
 */
export function AnalyticsView() {
  const { summary, perAgent, range, setRange, isLoading, isError } = useDashboardAnalytics();

  const metrics = [
    { label: t.analytics.metrics.conversations, value: summary.conversation_count },
    { label: t.analytics.metrics.messages, value: summary.message_count },
    { label: t.analytics.metrics.escalations, value: summary.escalation_count },
    { label: t.analytics.metrics.leads, value: summary.lead_count },
    { label: t.analytics.metrics.unresolvedTopics, value: summary.unresolved_topic_count },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t.analytics.title}
        description={t.analytics.description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="bg-muted flex items-center gap-1 rounded-lg p-1"
              role="group"
              aria-label={t.analytics.range.label}
            >
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  aria-pressed={range === r}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    range === r ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  {t.analytics.range[r]}
                </button>
              ))}
            </div>
            <Button variant="outline" className="gap-1.5" asChild>
              <Link href="/organization/billing" title={t.analytics.locked.exportLocked}>
                <Lock className="size-3.5" aria-hidden />
                <Download className="size-3.5" aria-hidden />
                {t.analytics.locked.export}
              </Link>
            </Button>
          </div>
        }
      />

      {isError && (
        <p className="bg-warning text-warning-foreground rounded-md px-4 py-2.5 text-sm">
          {t.analytics.error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {metrics.map(({ label, value }) => (
            <MetricCard
              key={label}
              label={label}
              value={formatNumber(value)}
              isLoading={isLoading}
            />
          ))}
        </div>
        {!isLoading && !isError && summary.conversation_count === 0 && (
          <p className="text-muted-foreground text-sm">{t.analytics.empty}</p>
        )}
      </div>

      {perAgent.length > 0 && (
        <Card>
          <CardContent className="space-y-3">
            <h2 className="font-display font-bold">{t.analytics.byAgent.title}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground text-left text-xs">
                  <tr>
                    <th className="py-2 pr-4 font-medium">{t.analytics.byAgent.agent}</th>
                    <th className="py-2 pr-4 font-medium">{t.analytics.byAgent.conversations}</th>
                    <th className="py-2 pr-4 font-medium">{t.analytics.byAgent.leads}</th>
                    <th className="py-2 font-medium">{t.analytics.byAgent.escalations}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {perAgent.map(({ agent, summary: agentSummary, isLoading: rowLoading }) => (
                    <tr key={agent.id}>
                      <td className="py-2.5 pr-4 font-medium">{agent.name}</td>
                      {[
                        agentSummary.conversation_count,
                        agentSummary.lead_count,
                        agentSummary.escalation_count,
                      ].map((value, index) => (
                        <td key={index} className="py-2.5 pr-4 tabular-nums">
                          {rowLoading ? <Skeleton className="h-4 w-8" /> : formatNumber(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="relative min-h-60 overflow-hidden">
        <CardContent className="space-y-3">
          <h2 className="font-display font-bold">{t.analytics.locked.title}</h2>
          <div className="space-y-3 blur-sm select-none" aria-hidden>
            {Array.from({ length: LOCKED_ROW_COUNT }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-4 w-1/3 animate-none" />
                <Skeleton className="h-4 flex-1 animate-none" />
                <Skeleton className="h-4 w-16 animate-none" />
              </div>
            ))}
          </div>
        </CardContent>
        <div className="bg-card/70 absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <Lock className="text-muted-foreground size-5" aria-hidden />
          <p className="text-muted-foreground max-w-md text-sm">{t.analytics.locked.description}</p>
          <Button variant="cta" asChild>
            <Link href="/organization/billing">{t.analytics.locked.cta}</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
