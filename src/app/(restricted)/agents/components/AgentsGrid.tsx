'use client';

import Link from 'next/link';
import { ArrowRight, Bot } from 'lucide-react';

import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { format, formatDate } from '@/lib/i18n';
import { t } from '@/locales';
import type { AgentListItem, AgentStatus } from '@/types/agent';

const STATUS_TONE: Record<AgentStatus, StatusTone> = {
  active: 'success',
  paused: 'warning',
  archived: 'neutral',
};

type Props = Readonly<{ agents: AgentListItem[] }>;

/**
 * Card grid, matching `ai-agents-platform`'s marketplace card shape (icon
 * tile, status pill, footer CTA) rather than a plain data table. The
 * reference's per-card capability checklist has no API-exposed equivalent
 * (`AgentTypeCapability` rows aren't serialized anywhere), so the card body
 * carries what real data we do have: `agent_type.name` as the closest thing
 * to the reference's category label, inbox email, and last-updated.
 */
export function AgentsGrid({ agents }: Props) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {agents.map((agent) => (
        <Card key={agent.id} className="transition-shadow hover:shadow-md">
          <CardContent className="flex h-full flex-col">
            <div className="mb-4 flex items-start justify-between">
              <span className="bg-brand-accent/15 text-brand-accent flex size-12 shrink-0 items-center justify-center rounded-xl">
                <Bot className="size-[22px]" />
              </span>
              <StatusBadge label={t.agents.status[agent.status]} tone={STATUS_TONE[agent.status]} />
            </div>

            {agent.agent_type && (
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {agent.agent_type.name}
              </p>
            )}
            <h3 className="font-display text-lg font-bold">{agent.name}</h3>
            <p className="text-muted-foreground mt-1.5 mb-4 text-sm leading-relaxed">
              {format(t.agents.card.routesTo, { email: agent.human_inbox_email })}
            </p>

            <div className="mt-auto flex items-center justify-between border-t pt-4">
              <div>
                <p className="text-sm font-semibold">{t.agents.levelBasic}</p>
                <p className="text-success text-xs">{t.agents.freeDuringTrial}</p>
              </div>
              <Link
                href={`/agents/${agent.id}`}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
              >
                {t.agents.card.openAgent}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>

            <p className="text-muted-foreground mt-3 text-xs">
              {format(t.agents.card.updated, { date: formatDate(agent.updated_at) })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
