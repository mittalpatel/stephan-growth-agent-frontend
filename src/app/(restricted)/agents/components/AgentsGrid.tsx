'use client';

import Link from 'next/link';
import { ArrowRight, Bot, Check } from 'lucide-react';

import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AGENT_TYPE_ACCENT_FALLBACK,
  AGENT_TYPE_ACCENTS,
  AGENT_TYPE_ICONS,
  isAgentTypeSlug,
} from '@/constants/agentTypes';
import { cn } from '@/lib/utils';
import { t } from '@/locales';
import type { AgentStatus } from '@/types/agent';

/** Shared with `AgentDetailView`'s header, so one agent reads the same in both. */
const STATUS_TONE: Record<AgentStatus, StatusTone> = {
  active: 'success',
  paused: 'warning',
  archived: 'neutral',
};

import type { AgentCatalogEntry } from '../hooks/useAgentCatalog';

type Props = Readonly<{ entries: readonly AgentCatalogEntry[] }>;

/**
 * The marketplace card grid, matching `ai-agents-platform`'s shape: icon
 * tile, status pill, description, capability checklist, and a footer
 * carrying the commercial level beside the open CTA.
 *
 * Every card is rendered whether or not the organization has that agent, so
 * the four-agent roadmap is visible in one place. Only a card whose type is
 * provisioned gets a link: the detail route resolves by type slug through
 * `GET /agents/by-type/<slug>/`, which 404s for a type no agent exists for.
 */
export function AgentsGrid({ entries }: Props) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {entries.map((entry) => {
        /* Narrowed inline rather than via a `known` boolean: a boolean does
           not carry the type guard, so the lookups below stop type-checking. */
        const { slug } = entry;
        const Icon = isAgentTypeSlug(slug) ? AGENT_TYPE_ICONS[slug] : Bot;
        const accent = isAgentTypeSlug(slug)
          ? AGENT_TYPE_ACCENTS[slug]
          : AGENT_TYPE_ACCENT_FALLBACK;

        return (
          <Card
            key={entry.slug}
            className="hover:ring-foreground/20 rounded-2xl py-6 transition-all hover:shadow-md"
          >
            <CardContent className="flex h-full flex-col px-6">
              <div className="mb-4 flex items-start justify-between">
                <span
                  className={cn(
                    'flex size-12 shrink-0 items-center justify-center rounded-xl',
                    accent
                  )}
                >
                  <Icon className="size-[22px]" aria-hidden />
                </span>
                {/* Three distinct states, deliberately not two. A kind the
                    backend ships but this organization has no agent of is a
                    provisioning gap, not a roadmap gap, and collapsing the two
                    into one "Coming soon" hides a fixable problem. */}
                {entry.agent ? (
                  <StatusBadge
                    label={t.agents.status[entry.agent.status]}
                    tone={STATUS_TONE[entry.agent.status]}
                  />
                ) : (
                  <StatusBadge
                    label={
                      entry.isAvailable
                        ? t.agents.marketplace.notProvisioned
                        : t.agents.types.comingSoon
                    }
                    tone={entry.isAvailable ? 'warning' : 'neutral'}
                  />
                )}
              </div>

              <h3 className="font-display text-lg font-bold">{entry.name}</h3>
              <p className="text-muted-foreground mt-1.5 mb-4 text-sm leading-relaxed">
                {entry.description}
              </p>

              {entry.capabilities.length > 0 && (
                <ul className="mb-5 grid grid-cols-2 gap-x-3 gap-y-2">
                  {entry.capabilities.map((capability) => (
                    <li
                      key={capability}
                      className="text-muted-foreground flex items-center gap-1.5 text-xs"
                    >
                      <Check className="text-success size-3 shrink-0" aria-hidden />
                      <span className="truncate">{capability}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto flex items-center justify-between gap-4 border-t pt-4">
                <div>
                  <p className="text-xs font-semibold">{t.agents.levelBasic}</p>
                  <p
                    className={
                      entry.agent
                        ? 'text-success-foreground text-xs'
                        : 'text-muted-foreground text-xs'
                    }
                  >
                    {entry.agent
                      ? t.agents.freeDuringTrial
                      : entry.isAvailable
                        ? t.agents.marketplace.notProvisionedNote
                        : t.agents.marketplace.comingSoonNote}
                  </p>
                </div>
                {entry.agent ? (
                  <Link
                    href={`/agents/${entry.slug}`}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    {t.agents.card.openAgent}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                ) : (
                  /* Same size and position as the real button, so a card with
                     no provisioned agent still keeps the row balanced instead
                     of leaving a gap where the action would be. Not a Link:
                     there is nowhere for it to honestly go yet. */
                  <span
                    aria-disabled
                    className="text-muted-foreground bg-muted inline-flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
                  >
                    {t.agents.card.openAgent}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
