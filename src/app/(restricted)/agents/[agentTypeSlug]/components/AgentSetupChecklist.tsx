'use client';

import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  const [open, setOpen] = useState(false);

  const steps = [
    // Publishing clears `draft_version` (the draft *becomes* the published
    // version), so a published agent has finished this step too. Checking
    // the draft alone un-ticked it on publish and capped the list at 4 of 5.
    {
      key: 'draft',
      label: copy.stepDraft,
      done: agent.draft_version !== null || agent.published_version !== null,
      tab: 'draft',
    },
    ...(canViewKnowledge
      ? [
          {
            key: 'knowledge',
            label: copy.stepKnowledge,
            hint: copy.stepKnowledgeHint,
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
      <div className="border-border bg-success flex items-center gap-2 rounded-md border px-4 py-2 text-sm">
        <Check className="text-success-foreground size-4 shrink-0" aria-hidden />
        <span className="text-success-foreground">{copy.allDone}</span>
      </div>
    );
  }

  const doneCount = steps.filter((step) => step.done).length;
  // The bar names only the first unfinished step: that is the one thing the
  // operator needs, and the full list stays one click away.
  const next = steps.find((step) => !step.done);

  // A single slim row by default. The full five-row card sat above the tabs
  // and pushed the page's actual content below the fold on every visit, even
  // with one step left (client review, 14 Oct 2026).
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border-border bg-card rounded-lg border"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <ol className="hidden items-center gap-1 sm:flex" aria-hidden>
          {steps.map((step) => (
            <li
              key={step.key}
              className={cn(
                'size-2 rounded-full',
                step.done ? 'bg-primary' : step.key === next?.key ? 'bg-foreground' : 'bg-muted'
              )}
            />
          ))}
        </ol>
        <p className="min-w-0 flex-1 text-sm">
          <span className="text-muted-foreground">
            {format(copy.progress, { done: doneCount, total: steps.length })}
          </span>
          {next && (
            <>
              <span className="text-muted-foreground px-1.5" aria-hidden>
                ·
              </span>
              <span className="font-medium">{format(copy.next, { step: next.label })}</span>
            </>
          )}
        </p>
        <div className="flex items-center gap-1">
          {next && (
            <Button size="sm" onClick={() => onNavigate(next.tab)}>
              {copy.goTo}
              <ArrowRight aria-hidden />
            </Button>
          )}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" aria-label={open ? copy.hideAll : copy.showAll}>
              <span className="hidden sm:inline">{open ? copy.hideAll : copy.showAll}</span>
              <ChevronDown
                className={cn('transition-transform', open && 'rotate-180')}
                aria-hidden
              />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent>
        <ol className="border-border space-y-0.5 border-t px-2 py-2">
          {steps.map((step, index) => (
            <li
              key={step.key}
              className={cn(
                'flex items-center justify-between gap-3 rounded-md px-2 py-1',
                step.key === next?.key && 'bg-muted/60'
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {step.done ? (
                  <span className="bg-success text-success-foreground flex size-5 shrink-0 items-center justify-center rounded-full">
                    <Check className="size-3" aria-hidden />
                  </span>
                ) : (
                  <span className="border-border text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold">
                    {index + 1}
                  </span>
                )}
                <div className="min-w-0">
                  <p className={cn('text-sm', step.done && 'text-muted-foreground line-through')}>
                    {step.label}
                  </p>
                  {'hint' in step && !step.done && (
                    <p className="text-muted-foreground text-xs">{step.hint}</p>
                  )}
                </div>
              </div>
              {/* Finished steps stay reachable: client testing asked to be
                  able to go back to a step once it was done. */}
              <Button variant="ghost" size="sm" onClick={() => onNavigate(step.tab)}>
                {step.done ? copy.review : copy.goTo}
              </Button>
            </li>
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}
