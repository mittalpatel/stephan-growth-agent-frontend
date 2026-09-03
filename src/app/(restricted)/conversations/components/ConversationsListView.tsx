'use client';

import { useState } from 'react';
import { Building2, Gauge, Send, Sparkles, Target } from 'lucide-react';

import {
  MOCK_CONVERSATIONS,
  type ConversationIntent,
} from '@/app/(restricted)/conversations/mockConversations';
import { PreviewBanner } from '@/components/common/PreviewBanner';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

const INTENT_LABEL: Record<ConversationIntent, string> = {
  High: t.conversations.intent.high,
  Medium: t.conversations.intent.medium,
  Low: t.conversations.intent.low,
};

const INTENT_TONE: Record<ConversationIntent, StatusTone> = {
  High: 'warning',
  Medium: 'info',
  Low: 'success',
};

/**
 * Sprint 1 static preview of the operator inbox, matching
 * `ai-agents-platform`'s `ConversationsView` three-pane layout and mock data
 * (frontend-plan-v3.md §3.1, §5). Swap for `useConversationsList()` once
 * `GET /api/v1/agents/{id}/conversations/` ships, and drop `PreviewBanner`.
 */
export function ConversationsListView() {
  const [activeId, setActiveId] = useState(MOCK_CONVERSATIONS[0].id);
  const active = MOCK_CONVERSATIONS.find((c) => c.id === activeId) ?? MOCK_CONVERSATIONS[0];

  return (
    <div className="flex flex-col gap-6">
      <PreviewBanner note={t.conversations.previewNotice} />

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t.conversations.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.conversations.description}</p>
      </div>

      <div className="border-border bg-card grid h-[640px] overflow-hidden rounded-2xl border lg:grid-cols-[300px_1fr_280px]">
        {/* List */}
        <div className="border-border overflow-y-auto border-r">
          {MOCK_CONVERSATIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(c.id)}
              className={cn(
                'border-border w-full border-b px-4 py-3.5 text-left transition-colors',
                activeId === c.id ? 'bg-primary/10' : 'hover:bg-muted'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{c.visitorName}</p>
                {c.unread && <span className="bg-primary size-2 shrink-0 rounded-full" />}
              </div>
              <p className="text-muted-foreground mt-0.5 truncate text-xs">{c.topic}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground text-[11px]">{c.timeAgo}</span>
                <StatusBadge label={INTENT_LABEL[c.intent]} tone={INTENT_TONE[c.intent]} />
              </div>
            </button>
          ))}
        </div>

        {/* Transcript */}
        <div className="flex min-w-0 flex-col">
          <div className="border-border flex items-center justify-between border-b px-5 py-4">
            <div>
              <p className="font-semibold">{active.visitorName}</p>
              <p className="text-muted-foreground text-xs">{active.company}</p>
            </div>
            <StatusBadge label={t.conversations.active} tone="success" />
          </div>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
            {active.messages.map((m, i) => (
              <div
                key={`${active.id}-${i}`}
                className={cn('flex', m.from === 'agent' ? 'justify-start' : 'justify-end')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    m.from === 'agent'
                      ? 'bg-muted rounded-bl-sm'
                      : 'bg-primary text-primary-foreground rounded-br-sm'
                  )}
                >
                  {m.from === 'agent' && (
                    <div className="text-primary mb-1 flex items-center gap-1.5 text-[11px] font-semibold">
                      <Sparkles className="size-[11px]" /> {t.conversations.agentName}
                    </div>
                  )}
                  <p>{m.text}</p>
                  <p
                    className={cn(
                      'mt-1 text-[10px]',
                      m.from === 'agent' ? 'text-muted-foreground' : 'text-primary-foreground/60'
                    )}
                  >
                    {m.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-border flex items-center gap-2 border-t px-5 py-3.5">
            <input
              disabled
              placeholder={t.conversations.readOnlyPlaceholder}
              className="bg-muted text-muted-foreground flex-1 rounded-lg px-3.5 py-2.5 text-sm"
            />
            <button
              disabled
              type="button"
              className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg"
            >
              <Send className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Prospect panel */}
        <div className="border-border flex flex-col gap-5 overflow-y-auto border-l p-5">
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
              {t.conversations.prospectPanel.heading}
            </p>
            <p className="font-semibold">{active.visitorName}</p>
            <p className="text-muted-foreground text-sm">{active.company}</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-muted flex items-center gap-2.5 rounded-lg px-3 py-2.5">
              <Target className="text-muted-foreground size-3.5" />
              <div>
                <p className="text-muted-foreground text-[11px]">
                  {t.conversations.prospectPanel.intent}
                </p>
                <p className="text-sm font-semibold">{INTENT_LABEL[active.intent]}</p>
              </div>
            </div>
            <div className="bg-muted flex items-center gap-2.5 rounded-lg px-3 py-2.5">
              <Building2 className="text-muted-foreground size-3.5" />
              <div>
                <p className="text-muted-foreground text-[11px]">
                  {t.conversations.prospectPanel.interest}
                </p>
                <p className="text-sm font-semibold">{active.topic}</p>
              </div>
            </div>
            <div className="bg-muted flex items-center gap-2.5 rounded-lg px-3 py-2.5">
              <Gauge className="text-muted-foreground size-3.5" />
              <div>
                <p className="text-muted-foreground text-[11px]">
                  {t.conversations.prospectPanel.score}
                </p>
                <p className="text-sm font-semibold">{active.score} / 100</p>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <Button variant="outline" size="sm">
              {t.conversations.prospectPanel.viewProspect}
            </Button>
            <Button size="sm">{t.conversations.prospectPanel.generateFollowUp}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
