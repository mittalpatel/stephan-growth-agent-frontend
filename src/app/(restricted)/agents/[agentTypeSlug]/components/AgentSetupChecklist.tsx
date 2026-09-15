'use client';

import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { t } from '@/locales';
import type { Agent } from '@/types/agent';

import { useAgentReadiness } from '../hooks/useAgentReadiness';

type Props = Readonly<{ agent: Agent; onNavigate: (tab: string) => void }>;

/**
 * The steps a non-technical operator has no other way to discover are
 * required, in order, to see a *useful* widget live on their own site: edit
 * the draft, give it something to answer from, publish it, allow the site's
 * domain, and generate an embed code. Nothing before this pointed
 * Draft/Publish at Settings, or Settings back at Draft/Publish, so a user
 * could publish and grab a snippet with no domain ever allowed and get only a
 * silent 403 in devtools.
 *
 * The knowledge step was added 2026-09-10 for the same class of reason: these
 * agents answer strictly from retrieved sources, so following this list to the
 * end with no knowledge added produced a widget that embedded correctly,
 * looked healthy, and fell back on every single question. It sits before
 * "publish" because a published version with nothing to retrieve is the
 * failure being prevented, not a later refinement.
 *
 * Reads `agent.draft_version`/`agent.published_version` (already on the
 * `Agent` the caller has) plus `useAgentReadiness` for the knowledge/domain/key
 * state, and never mutates anything itself — each unfinished step just
 * switches the detail page's tab via `onNavigate`, reusing the same controlled
 * `tab` state the header's Configure button already drives.
 */
export function AgentSetupChecklist({ agent, onNavigate }: Props) {
  const { canViewKnowledge, hasReadyKnowledge, hasAllowedDomain, hasActiveKey, isLoading } =
    useAgentReadiness(agent.id);
  const copy = t.agents.detail.checklist;

  const steps = [
    { key: 'draft', label: copy.stepDraft, done: agent.draft_version !== null, tab: 'draft' },
    ...(canViewKnowledge
      ? [
          {
            key: 'knowledge',
            label: copy.stepKnowledge,
            done: hasReadyKnowledge,
            tab: 'knowledge',
          },
        ]
      : []),
    {
      key: 'publish',
      label: copy.stepPublish,
      done: agent.published_version !== null,
      tab: 'publish',
    },
    { key: 'domain', label: copy.stepDomain, done: hasAllowedDomain, tab: 'settings' },
    { key: 'embed', label: copy.stepEmbed, done: hasActiveKey, tab: 'settings' },
  ];

  if (isLoading) return null;

  if (steps.every((step) => step.done)) {
    return (
      <div className="border-border bg-success flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm">
        <Check className="text-success-foreground size-4 shrink-0" aria-hidden />
        <span className="text-success-foreground">{copy.allDone}</span>
      </div>
    );
  }

  const doneCount = steps.filter((step) => step.done).length;
  // Only the first unfinished step gets the filled button, so the checklist
  // says what to do next rather than offering five equal choices.
  const nextKey = steps.find((step) => !step.done)?.key;

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-bold">{copy.title}</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">{copy.description}</p>
          </div>
          <p className="text-muted-foreground text-xs font-medium">
            {format(copy.progress, { done: doneCount, total: steps.length })}
          </p>
        </div>
        <div
          className="bg-muted h-1.5 overflow-hidden rounded-full"
          role="progressbar"
          aria-label={copy.title}
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={doneCount}
        >
          <div
            className="bg-primary h-full rounded-full transition-[width]"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
        <ol className="space-y-1">
          {steps.map((step, index) => (
            <li
              key={step.key}
              className={cn(
                'flex items-center justify-between gap-3 rounded-lg px-2 py-1.5',
                step.key === nextKey && 'bg-muted/60'
              )}
            >
              <div className="flex items-center gap-3">
                {step.done ? (
                  <span className="bg-success text-success-foreground flex size-6 shrink-0 items-center justify-center rounded-full">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                ) : (
                  <span className="border-border text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                    {index + 1}
                  </span>
                )}
                <span className={cn('text-sm', step.done && 'text-muted-foreground line-through')}>
                  {step.label}
                </span>
              </div>
              {!step.done && (
                <Button
                  variant={step.key === nextKey ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onNavigate(step.tab)}
                >
                  {copy.goTo}
                </Button>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
