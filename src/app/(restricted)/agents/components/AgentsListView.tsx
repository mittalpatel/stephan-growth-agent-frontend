'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

import { AGENT_CATALOG, type AgentCategory } from '@/app/(restricted)/agents/agentCatalog';
import { PreviewBanner } from '@/components/common/PreviewBanner';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

const FILTERS: readonly { key: AgentCategory | 'all'; label: string }[] = [
  { key: 'all', label: t.agents.filters.all },
  { key: 'sales', label: t.agents.filters.sales },
  { key: 'marketing', label: t.agents.filters.marketing },
  { key: 'growth', label: t.agents.filters.growth },
  { key: 'automation', label: t.agents.filters.automation },
];

/**
 * Sprint 1 static preview of the agents list, matching `ai-agents-platform`'s
 * `AgentsMarketplace` layout, copy, and the four Sprint 1 agents
 * (frontend-plan-v3.md §3.1). Swap `AGENT_CATALOG` for `useAgentsList()` once
 * `GET /api/v1/agents/` ships, and drop `PreviewBanner`.
 */
export function AgentsListView() {
  const [filter, setFilter] = useState<AgentCategory | 'all'>('all');
  const filtered =
    filter === 'all' ? AGENT_CATALOG : AGENT_CATALOG.filter((a) => a.category === filter);

  return (
    <div className="flex flex-col gap-6">
      <PreviewBanner note={t.agents.previewNotice} />

      <div>
        <span className="text-brand-accent mb-2 block text-xs font-semibold tracking-wider uppercase">
          {t.agents.eyebrow}
        </span>
        <h1 className="font-display max-w-2xl text-[28px] leading-tight font-bold tracking-tight">
          {t.agents.heading}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-[15px] leading-relaxed">
          {t.agents.subheading}
        </p>
      </div>

      <div className="bg-muted flex w-fit items-center gap-1 rounded-lg p-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors',
              filter === f.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {filtered.map((agent) => (
          <Card key={agent.id}>
            <CardContent className="flex flex-col">
              <div className="mb-4 flex items-start justify-between">
                <span className="bg-brand-accent/15 text-brand-accent flex size-12 items-center justify-center rounded-xl">
                  <agent.icon className="size-[22px]" />
                </span>
                <StatusBadge label={t.agents.status.active} tone="success" />
              </div>

              <h3 className="font-display text-lg font-bold">{agent.name}</h3>
              <p className="text-muted-foreground mt-1.5 mb-4 text-sm leading-relaxed">
                {agent.description}
              </p>

              <div className="mb-5 grid grid-cols-2 gap-x-3 gap-y-2">
                {agent.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-1.5 text-xs">
                    <Check className="text-success size-3 shrink-0" />
                    <span className="truncate">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="border-border mt-auto flex items-center justify-between border-t pt-4">
                <div>
                  <p className="text-xs font-semibold">{t.agents.levelBasic}</p>
                  <p className="text-success text-xs">{t.agents.freeDuringTrial}</p>
                </div>
                <Button size="sm" className="gap-1.5" asChild>
                  <Link href={`/agents/${agent.id}`}>
                    {t.agents.openAgent} <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-foreground text-background flex flex-wrap items-center justify-between gap-6 rounded-2xl p-7">
        <div>
          <p className="text-background/50 mb-1.5 text-xs font-semibold tracking-wider uppercase">
            {t.agents.customTier.eyebrow}
          </p>
          <h3 className="font-display mb-1.5 text-xl font-bold">{t.agents.customTier.heading}</h3>
          <p className="text-background/70 max-w-lg text-sm">{t.agents.customTier.description}</p>
        </div>
        <Button
          className="bg-background text-foreground hover:bg-background/90 shrink-0"
          size="default"
        >
          {t.agents.customTier.cta}
        </Button>
      </div>
    </div>
  );
}
