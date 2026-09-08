'use client';

import { MetricCard } from '@/components/common/MetricCard';
import { PageHeader } from '@/components/common/PageHeader';
import { PreviewBanner } from '@/components/common/PreviewBanner';
import { t } from '@/locales';

const MOCK_SUMMARY = [
  { label: t.analytics.metrics.conversations, value: '128' },
  { label: t.analytics.metrics.messages, value: '742' },
  { label: t.analytics.metrics.escalations, value: '9' },
  { label: t.analytics.metrics.leads, value: '64' },
  { label: t.analytics.metrics.unresolvedTopics, value: '7' },
] as const;

/**
 * Sprint 1 static preview of the analytics summary (frontend-plan-v3.md §3.1,
 * §5, D1). Swap for `useAnalyticsSummary()` once
 * `GET /api/v1/agents/{id}/analytics/summary/` ships, and drop
 * `PreviewBanner`. Five counts, not four (D1) — `message_count` alongside
 * `conversation_count` is the only ratio the payload gives for whether
 * conversations are going anywhere.
 */
export function AnalyticsView() {
  return (
    <div className="flex flex-col gap-6">
      <PreviewBanner note={t.analytics.previewNotice} />

      <PageHeader
        title={t.analytics.title}
        description={t.analytics.description}
        actions={
          <span className="border-border text-muted-foreground rounded-lg border px-3 py-1.5 text-sm">
            {t.analytics.range.last7Days}
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {MOCK_SUMMARY.map(({ label, value }) => (
          <MetricCard key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}
