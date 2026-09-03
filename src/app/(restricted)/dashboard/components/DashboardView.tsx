'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Bot, Cog, Plug, Sparkles, TrendingUp, User } from 'lucide-react';

import { AGENT_CATALOG } from '@/app/(restricted)/agents/agentCatalog';
import { useUser } from '@/app/(restricted)/context/UserContext';
import { PreviewBanner } from '@/components/common/PreviewBanner';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from '@/lib/i18n';
import { t } from '@/locales';

import { BusinessValueChart } from './BusinessValueChart';

type Metric = { label: string; value: string; delta?: string; sublabel?: string };

const METRICS: readonly Metric[] = [
  {
    label: t.dashboard.metrics.activeAgents,
    value: '4',
    delta: '+1',
    sublabel: t.dashboard.metrics.thisMonth,
  },
  { label: t.dashboard.metrics.prospectsEngaged, value: '128', delta: '+24.6%' },
  { label: t.dashboard.metrics.leadsCaptured, value: '64', delta: '+18.2%' },
  {
    label: t.dashboard.metrics.contentGenerated,
    value: '18',
    sublabel: t.dashboard.metrics.thisMonth,
  },
  { label: t.dashboard.metrics.estimatedValue, value: '$18,420', delta: '+12.8%' },
];

type ActivityActor = 'Agent' | 'User' | 'System' | 'Integration';

const ACTOR_ICON: Record<ActivityActor, typeof Bot> = {
  Agent: Bot,
  User: User,
  System: Cog,
  Integration: Plug,
};

const MOCK_ACTIVITY: readonly { text: string; time: string; actor: ActivityActor }[] = [
  { time: '14:32', actor: 'Agent', text: 'AI generated follow-up for Sarah Miller' },
  { time: '14:29', actor: 'User', text: 'Content draft approved by Alex Morgan' },
  {
    time: '14:11',
    actor: 'Integration',
    text: 'New Meta lead imported — Grace Liu, Cascade Robotics',
  },
  { time: '13:54', actor: 'System', text: 'Knowledge base updated — company site re-crawled' },
  { time: '13:42', actor: 'Agent', text: 'SEvO completed website analysis' },
  { time: '13:20', actor: 'Agent', text: 'Lead Outreach qualified Elena Petrova (score 88)' },
];

const BUSINESS_VALUE_STATS = [
  { label: t.dashboard.businessValue.leads, value: '64' },
  { label: t.dashboard.businessValue.qualifiedProspects, value: '42' },
  { label: t.dashboard.businessValue.contentOutput, value: '18' },
  { label: t.dashboard.businessValue.estSavings, value: '$16.2k' },
] as const;

/**
 * Sprint 1 static preview (frontend-plan-v3.md §3.1, §5) of the app home,
 * matching `ai-agents-platform`'s Overview page layout, data, and copy. All
 * data below is inline mock — swap for `useDashboard()` once the backend
 * ships an aggregate endpoint, and drop `PreviewBanner`.
 */
export function DashboardView() {
  const { session } = useUser();
  const firstName = session.user.full_name?.split(' ')[0] ?? '';

  return (
    <div className="flex flex-col gap-8">
      <PreviewBanner note={t.dashboard.previewNotice} />

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight">
            {firstName ? format(t.dashboard.greeting, { name: firstName }) : t.dashboard.title}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-[15px]">{t.dashboard.welcome}</p>
        </div>
        <div className="flex items-center gap-3">
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {METRICS.map(({ label, value, delta, sublabel }) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-3">
              <span className="text-muted-foreground text-sm font-medium">{label}</span>
              <span className="font-display text-3xl font-bold tracking-tight">{value}</span>
              {(delta ?? sublabel) && (
                <div className="flex items-center gap-1.5 text-xs">
                  {delta && (
                    <span className="text-success inline-flex items-center gap-0.5 font-semibold">
                      <ArrowUpRight className="size-[13px]" />
                      {delta}
                    </span>
                  )}
                  {sublabel && <span className="text-muted-foreground">{sublabel}</span>}
                </div>
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {AGENT_CATALOG.map((agent) => (
            <Card key={agent.id}>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="bg-brand-accent/15 text-brand-accent flex size-10 shrink-0 items-center justify-center rounded-xl">
                      <agent.icon className="size-[19px]" />
                    </span>
                    <div>
                      <p className="text-[15px] leading-tight font-semibold">{agent.name}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">{t.agents.levelBasic}</p>
                    </div>
                  </div>
                  <StatusBadge label={t.agents.status.active} tone="success" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted rounded-xl px-3 py-2.5">
                    <p className="text-muted-foreground text-[11px]">{agent.metricALabel}</p>
                    <p className="mt-0.5 text-sm font-semibold">{agent.metricAValue}</p>
                  </div>
                  <div className="bg-muted rounded-xl px-3 py-2.5">
                    <p className="text-muted-foreground text-[11px]">{agent.metricBLabel}</p>
                    <p className="mt-0.5 text-sm font-semibold">{agent.metricBValue}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-muted-foreground text-[11px]">
                      {t.dashboard.agentPerformance.valueGenerated}
                    </p>
                    <p className="font-display font-bold">{agent.valueGenerated}</p>
                  </div>
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
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-1">
              <h3 className="font-display font-bold">{t.dashboard.businessValue.title}</h3>
              <p className="text-muted-foreground text-sm">{t.dashboard.businessValue.subtitle}</p>
              <BusinessValueChart />
              <div className="border-border mt-4 grid grid-cols-4 gap-3 border-t pt-4">
                {BUSINESS_VALUE_STATS.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-muted-foreground text-[11px]">{stat.label}</p>
                    <p className="mt-0.5 text-sm font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-display mb-4 font-bold">{t.dashboard.activity.title}</h3>
              <div className="flex flex-col">
                {MOCK_ACTIVITY.map((item, i) => {
                  const Icon = ACTOR_ICON[item.actor];
                  return (
                    <div key={item.text} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="bg-muted text-muted-foreground z-10 flex size-7 shrink-0 items-center justify-center rounded-full">
                          <Icon className="size-[13px]" />
                        </div>
                        {i < MOCK_ACTIVITY.length - 1 && <div className="bg-border w-px flex-1" />}
                      </div>
                      <div className="min-w-0 pb-5">
                        <p className="text-sm leading-snug">{item.text}</p>
                        <p className="text-muted-foreground mt-1 text-xs">{item.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-primary text-primary-foreground ring-0">
          <CardContent className="flex h-full flex-col gap-5">
            <p className="text-primary-foreground/60 text-xs font-semibold tracking-wider uppercase">
              {t.dashboard.trialPanel.eyebrow}
            </p>
            <p className="font-display -mt-3 text-2xl font-bold">
              {format(t.dashboard.trialPanel.daysRemaining, { days: '21' })}
            </p>
            <div className="bg-primary-foreground/20 h-1.5 w-full overflow-hidden rounded-full">
              <div className="bg-primary-foreground h-full w-[70%] rounded-full" />
            </div>
            <p className="text-primary-foreground/80 text-sm">
              {format(t.dashboard.trialPanel.summary, { agents: '4' })}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-lg font-bold">128</p>
                <p className="text-primary-foreground/60 text-xs">
                  {t.dashboard.trialPanel.conversations}
                </p>
              </div>
              <div>
                <p className="text-lg font-bold">64</p>
                <p className="text-primary-foreground/60 text-xs">{t.dashboard.trialPanel.leads}</p>
              </div>
              <div>
                <p className="text-lg font-bold">18</p>
                <p className="text-primary-foreground/60 text-xs">
                  {t.dashboard.trialPanel.contentPieces}
                </p>
              </div>
              <div>
                <p className="text-lg font-bold">$18,420</p>
                <p className="text-primary-foreground/60 text-xs">
                  {t.dashboard.trialPanel.estValue}
                </p>
              </div>
            </div>
            <div className="mt-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                asChild
              >
                <Link href="/analytics">{t.dashboard.trialPanel.viewUsage}</Link>
              </Button>
              <Button
                size="sm"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                {t.dashboard.trialPanel.upgrade}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
