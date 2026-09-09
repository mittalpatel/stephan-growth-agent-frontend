'use client';

import { Check, Circle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { t } from '@/locales';
import type { Agent } from '@/types/agent';

import { useAgentReadiness } from '../hooks/useAgentReadiness';

type Props = Readonly<{ agent: Agent; onNavigate: (tab: string) => void }>;

/**
 * The four steps a non-technical operator has no other way to discover are
 * required, in order, to see the widget live on their own site: edit the
 * draft, publish it, allow the site's domain, and generate an embed code.
 * Nothing before this pointed Draft/Publish at Settings, or Settings back at
 * Draft/Publish, so a user could publish and grab a snippet with no domain
 * ever allowed and get only a silent 403 in devtools.
 *
 * Reads `agent.draft_version`/`agent.published_version` (already on the
 * `Agent` the caller has) plus `useAgentReadiness` for the domain/key state,
 * and never mutates anything itself — each unfinished step just switches the
 * detail page's tab via `onNavigate`, reusing the same controlled `tab`
 * state the header's Configure button already drives.
 */
export function AgentSetupChecklist({ agent, onNavigate }: Props) {
  const { hasAllowedDomain, hasActiveKey, isLoading } = useAgentReadiness(agent.id);
  const copy = t.agents.detail.checklist;

  const steps = [
    { key: 'draft', label: copy.stepDraft, done: agent.draft_version !== null, tab: 'draft' },
    {
      key: 'publish',
      label: copy.stepPublish,
      done: agent.published_version !== null,
      tab: 'publish',
    },
    { key: 'domain', label: copy.stepDomain, done: hasAllowedDomain, tab: 'settings' },
    { key: 'embed', label: copy.stepEmbed, done: hasActiveKey, tab: 'settings' },
  ] as const;

  if (isLoading) return null;

  if (steps.every((step) => step.done)) {
    return (
      <div className="border-border bg-success flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm">
        <Check className="text-success-foreground size-4 shrink-0" aria-hidden />
        <span className="text-success-foreground">{copy.allDone}</span>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div>
          <h2 className="font-display text-sm font-bold">{copy.title}</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">{copy.description}</p>
        </div>
        <ul className="space-y-2">
          {steps.map((step) => (
            <li key={step.key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {step.done ? (
                  <Check className="text-success-foreground size-4 shrink-0" aria-hidden />
                ) : (
                  <Circle className="text-muted-foreground size-4 shrink-0" aria-hidden />
                )}
                <span className={cn('text-sm', step.done && 'text-muted-foreground line-through')}>
                  {step.label}
                </span>
              </div>
              {!step.done && (
                <Button variant="ghost" size="sm" onClick={() => onNavigate(step.tab)}>
                  {copy.goTo}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
