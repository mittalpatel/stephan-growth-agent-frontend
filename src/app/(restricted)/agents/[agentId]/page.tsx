import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { PreviewBanner } from '@/components/common/PreviewBanner';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/locales';

const CHECKLIST = [
  { label: t.agents.overview.checklist.addKnowledge, done: true },
  { label: t.agents.overview.checklist.setLanguages, done: true },
  { label: t.agents.overview.checklist.brand, done: false },
  { label: t.agents.overview.checklist.runTest, done: false },
  { label: t.agents.overview.checklist.publish, done: false },
] as const;

/**
 * Sprint 1 static preview of the agent overview screen
 * (frontend-plan-v3.md §3.1, §5). The real page reads `agentId` to fetch the
 * agent; this preview renders the same shell with fixed content so the layout
 * — tabs, setup checklist — can be reviewed ahead of the backend.
 */
export default async function AgentOverviewPage({
  params,
}: Readonly<{
  params: Promise<{ agentId: string }>;
}>) {
  const { agentId } = await params;
  const name = agentId
    .split('-')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="flex flex-col gap-6">
      <PreviewBanner note={t.agents.previewNotice} />

      <div>
        <Link
          href="/agents"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          {t.agents.overview.backToList}
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight">{name}</h1>
          <StatusBadge label={t.agents.status.draft} tone="neutral" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.values(t.agents.overview.tabs).map((tab, index) => (
          <span
            key={tab}
            className={
              index === 0
                ? 'bg-brand-accent/15 text-brand-accent rounded-lg px-3 py-1.5 text-sm font-medium'
                : 'text-muted-foreground rounded-lg px-3 py-1.5 text-sm font-medium'
            }
          >
            {tab}
          </span>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.agents.overview.setupChecklist}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-border -mt-1 divide-y">
            {CHECKLIST.map((item) => (
              <li key={item.label} className="flex items-center gap-3 py-2.5 text-sm">
                <span
                  aria-hidden
                  className={
                    item.done
                      ? 'bg-success flex size-5 shrink-0 items-center justify-center rounded-full text-xs text-white'
                      : 'border-border flex size-5 shrink-0 items-center justify-center rounded-full border'
                  }
                >
                  {item.done ? '✓' : ''}
                </span>
                <span className={item.done ? 'text-muted-foreground line-through' : ''}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
