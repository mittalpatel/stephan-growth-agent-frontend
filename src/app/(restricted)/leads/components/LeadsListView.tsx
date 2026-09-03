'use client';

import { useState } from 'react';
import { MessagesSquare, Users2 } from 'lucide-react';

import {
  LEAD_PIPELINE,
  MOCK_LEADS,
  MOCK_PROSPECTS,
  type LeadStatus,
} from '@/app/(restricted)/leads/mockLeads';
import { PreviewBanner } from '@/components/common/PreviewBanner';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

const TABS = [
  { key: 'prospects', label: t.leads.tabs.websiteProspects, icon: MessagesSquare },
  { key: 'outreach', label: t.leads.tabs.outreachLeads, icon: Users2 },
] as const;

const PROSPECT_INTENT_TONE: Record<'High' | 'Medium' | 'Low', StatusTone> = {
  High: 'warning',
  Medium: 'info',
  Low: 'success',
};

const PROSPECT_STATUS_TONE: Record<string, StatusTone> = {
  Qualified: 'success',
  Converted: 'success',
  Engaged: 'info',
  'Follow-up': 'warning',
  New: 'neutral',
};

type Metric = { label: string; value: string; delta?: string };

const METRICS: readonly Metric[] = [
  { label: t.leads.metrics.totalLeads, value: '64', delta: '+18.2%' },
  { label: t.leads.metrics.qualified, value: '38', delta: '+11.4%' },
  { label: t.leads.metrics.websiteProspects, value: '5' },
  { label: t.leads.metrics.conversion, value: '59.4%', delta: '+4.1%' },
];

const STATUS_TONE: Record<LeadStatus, StatusTone> = {
  new: 'neutral',
  contacted: 'info',
  qualified: 'success',
  enriched: 'info',
  validated: 'info',
  scored: 'success',
};

/**
 * Sprint 1 static preview of the leads list, matching `ai-agents-platform`'s
 * `Leads` page — metric row, pipeline funnel, and outreach-leads table
 * (frontend-plan-v3.md §3.1, §5). Swap for `useLeadsList()` once
 * `GET /api/v1/leads/` ships, and drop `PreviewBanner`.
 */
export function LeadsListView() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('outreach');
  const maxCount = Math.max(...LEAD_PIPELINE.map((s) => s.count));

  return (
    <div className="flex flex-col gap-6">
      <PreviewBanner note={t.leads.previewNotice} />

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t.leads.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.leads.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {METRICS.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm font-medium">{metric.label}</span>
              <span className="font-display text-3xl font-bold tracking-tight">{metric.value}</span>
              {metric.delta && (
                <span className="text-success text-xs font-semibold">{metric.delta}</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-muted flex w-fit items-center gap-1 rounded-lg p-1">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            onClick={() => setTab(tabItem.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
              tab === tabItem.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            <tabItem.icon className="size-3.5" />
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === 'outreach' ? (
        <div className="flex flex-col gap-5">
          <Card>
            <CardContent>
              <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
                {LEAD_PIPELINE.map((stage, i) => (
                  <div key={stage.stageKey} className="flex shrink-0 items-center">
                    <div className="flex min-w-[110px] flex-col items-center gap-2">
                      <div
                        className="bg-primary/10 text-primary font-display flex size-16 items-center justify-center rounded-2xl text-lg font-bold"
                        style={{ opacity: 0.55 + (stage.count / maxCount) * 0.45 }}
                      >
                        {stage.count}
                      </div>
                      <span className="text-center text-xs leading-snug font-medium">
                        {t.leads.pipeline[stage.stageKey as keyof typeof t.leads.pipeline]}
                      </span>
                    </div>
                    {i < LEAD_PIPELINE.length - 1 && (
                      <svg width="28" height="2" className="mt-[-24px] shrink-0" aria-hidden>
                        <line
                          x1="0"
                          y1="1"
                          x2="28"
                          y2="1"
                          className="stroke-border"
                          strokeDasharray="4 3"
                        />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="border-border overflow-hidden rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.leads.table.lead}</TableHead>
                  <TableHead>{t.leads.table.company}</TableHead>
                  <TableHead>{t.leads.table.source}</TableHead>
                  <TableHead>{t.leads.table.score}</TableHead>
                  <TableHead>{t.leads.table.status}</TableHead>
                  <TableHead>{t.leads.table.lastContact}</TableHead>
                  <TableHead>{t.leads.table.owner}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_LEADS.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <p className="font-semibold">{lead.name}</p>
                      <p className="text-muted-foreground text-xs">{lead.role}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{lead.company}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.source}</TableCell>
                    <TableCell className="font-semibold">{lead.score}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={t.leads.status[lead.status]}
                        tone={STATUS_TONE[lead.status]}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{lead.lastContact}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.owner}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.leads.prospectTable.name}</TableHead>
                <TableHead>{t.leads.prospectTable.company}</TableHead>
                <TableHead>{t.leads.prospectTable.intent}</TableHead>
                <TableHead>{t.leads.prospectTable.score}</TableHead>
                <TableHead>{t.leads.prospectTable.source}</TableHead>
                <TableHead>{t.leads.prospectTable.lastActivity}</TableHead>
                <TableHead>{t.leads.prospectTable.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_PROSPECTS.map((prospect) => (
                <TableRow key={prospect.id}>
                  <TableCell>
                    <p className="font-semibold">{prospect.name}</p>
                    <p className="text-muted-foreground text-xs">{prospect.role}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{prospect.company}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={prospect.intent}
                      tone={PROSPECT_INTENT_TONE[prospect.intent]}
                    />
                  </TableCell>
                  <TableCell className="font-semibold">{prospect.score}</TableCell>
                  <TableCell className="text-muted-foreground">{prospect.source}</TableCell>
                  <TableCell className="text-muted-foreground">{prospect.lastActivity}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={prospect.status}
                      tone={PROSPECT_STATUS_TONE[prospect.status] ?? 'neutral'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
