'use client';

import Link from 'next/link';
import { BarChart3, Bot, MessagesSquare, Sparkles, TrendingUp, UserPlus } from 'lucide-react';

import { useUser } from '@/app/(restricted)/context/UserContext';
import { PreviewBanner } from '@/components/common/PreviewBanner';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from '@/lib/i18n';
import { t } from '@/locales';

const MOCK_METRICS = [
  { label: t.dashboard.metrics.activeAgents, value: '4', icon: Bot },
  { label: t.dashboard.metrics.conversations, value: '128', icon: MessagesSquare },
  { label: t.dashboard.metrics.leadsCaptured, value: '64', icon: UserPlus },
  { label: t.dashboard.metrics.escalations, value: '3', icon: TrendingUp },
  { label: t.dashboard.metrics.unresolvedTopics, value: '7', icon: TrendingUp },
] as const;

const MOCK_AGENTS = [
  { name: 'Sales Concierge', type: t.agents.type.sales, conversations: 62, tone: 'success' },
  { name: 'Support Desk', type: t.agents.type.support, conversations: 41, tone: 'success' },
  { name: 'Onboarding Guide', type: t.agents.type.support, conversations: 18, tone: 'warning' },
  { name: 'Renewals Assistant', type: t.agents.type.sales, conversations: 7, tone: 'neutral' },
] as const;

const MOCK_ACTIVITY = [
  { text: 'Support Desk resolved an escalation from a visitor on /pricing', time: '12m ago' },
  { text: 'Sales Concierge captured a new lead: jordan@northwind.example', time: '48m ago' },
  { text: 'Onboarding Guide finished a website crawl (42 pages included)', time: '2h ago' },
  { text: 'Renewals Assistant was published to version 3', time: '5h ago' },
] as const;

/**
 * Sprint 1 static preview (frontend-plan-v3.md §3.1, §5) of the app home:
 * metric summary, per-agent conversation volume, and a recent-activity feed.
 * All data below is inline mock — swap for `useDashboard()` once the backend
 * ships an aggregate endpoint, and drop `PreviewBanner`.
 */
export function DashboardView() {
  const { session } = useUser();
  const firstName = session.user.full_name?.split(' ')[0] ?? '';

  return (
    <div className="flex flex-col gap-6">
      <PreviewBanner note={t.dashboard.previewNotice} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {firstName ? format(t.dashboard.greeting, { name: firstName }) : t.dashboard.title}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-[15px]">{t.dashboard.welcome}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-1.5" asChild>
            <Link href="/analytics">
              <BarChart3 className="size-4" />
              {t.dashboard.actions.viewAnalytics}
            </Link>
          </Button>
          <Button className="gap-1.5" asChild>
            <Link href="/agents">
              <Sparkles className="size-4" />
              {t.dashboard.actions.exploreAgents}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {MOCK_METRICS.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">{label}</p>
                <p className="font-display mt-1 text-2xl font-bold tracking-tight">{value}</p>
              </div>
              <span className="bg-brand-accent/15 text-brand-accent flex size-9 items-center justify-center rounded-lg">
                <Icon className="size-4.5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{t.dashboard.agentPerformance.title}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {MOCK_AGENTS.map((agent) => (
            <Card key={agent.name}>
              <CardHeader>
                <CardTitle>{agent.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">{agent.type}</p>
                <StatusBadge
                  label={`${agent.conversations} ${t.dashboard.metrics.conversations.toLowerCase()}`}
                  tone={agent.tone}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.activity.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-border -mt-1 divide-y">
            {MOCK_ACTIVITY.map((item) => (
              <li key={item.text} className="flex items-center justify-between gap-4 py-2.5">
                <p className="text-sm">{item.text}</p>
                <span className="text-muted-foreground shrink-0 text-xs">{item.time}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
