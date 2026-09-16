'use client';

import { useEffect, useRef } from 'react';
import { Headset, Sparkles } from 'lucide-react';

import { Markdown } from '@/components/common/Markdown';
import { MessageTime } from '@/components/common/MessageTime';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatNumber } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { t } from '@/locales';
import type { TranscriptState } from '@/hooks/useTranscriptQuery';

type Props = Readonly<
  TranscriptState & {
    /** Overrides the default `flex-1` fill on whichever state branch renders.
     * The conversations pane owns its own height and wants the fill; the lead
     * sheet is already scrolling, so it passes a bounded height instead. */
    className?: string;
  }
>;

/**
 * One conversation's full transcript, as a pure presenter.
 *
 * It takes transcript state rather than fetching, so the same rendering serves
 * both endpoints that return it: the operator conversations pane
 * (`useConversationMessages`) and the lead detail sheet
 * (`useLeadConversationMessages`), which read the same rows through
 * differently authorized routes.
 */
export function ConversationTranscript({
  messages,
  total,
  isLoading,
  isError,
  refetch,
  hasOlder,
  loadOlder,
  isLoadingOlder,
  className,
}: Props) {
  // The backend persists an empty-content turn each time a visitor writes again
  // while already waiting for a human: it keeps the transcript's turn count
  // honest without re-sending the same "someone is coming" line to the visitor.
  // There is nothing to read in one, so it renders as a blank bubble here.
  const visible = messages.filter((m) => m.content.trim().length > 0);

  // Follow new turns only while the reader is already at the bottom, so
  // someone scrolled up reading history is not yanked away. Loading older
  // pages leaves the newest id unchanged and so never scrolls.
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);
  const newestId = visible.at(-1)?.id;
  useEffect(() => {
    const node = scrollRef.current;
    if (node && pinnedToBottom.current) node.scrollTop = node.scrollHeight;
  }, [newestId]);

  if (isLoading) {
    return (
      <div className={cn('flex flex-1 flex-col gap-4 px-5 py-5', className)}>
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-16 w-3/4 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-3 px-5 py-5',
          className
        )}
      >
        <p className="text-muted-foreground text-sm">{t.conversations.detail.transcriptError}</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          {t.buttons.tryAgain}
        </Button>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className={cn('flex flex-1 items-center justify-center px-5 py-5', className)}>
        <p className="text-muted-foreground text-sm">{t.conversations.detail.noMessages}</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={(event) => {
        const node = event.currentTarget;
        pinnedToBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
      }}
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 py-5 [scrollbar-color:var(--border)_transparent] scrollbar-gutter-stable scrollbar-thin',
        className
      )}
    >
      {/* Older turns load upward, so the control that fetches them belongs at
          the top of the scroll region, above the oldest message on screen. */}
      {hasOlder && (
        <div className="flex flex-col items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={loadOlder} disabled={isLoadingOlder}>
            {isLoadingOlder
              ? t.conversations.detail.loadingOlder
              : t.conversations.detail.loadOlder}
          </Button>
          <p className="text-muted-foreground text-[11px]">
            {format(t.conversations.detail.transcriptCount, {
              shown: formatNumber(visible.length),
              total: formatNumber(total),
            })}
          </p>
        </div>
      )}
      {visible.map((m) =>
        // A system turn is a state change (a handoff was requested, a human
        // was notified), not something anyone said. Rendering it as a chat
        // bubble implies an author it does not have.
        m.role === 'system' ? (
          <div key={m.id} className="flex items-center gap-3 px-2" role="note">
            <span className="bg-border h-px flex-1" aria-hidden />
            <p className="text-muted-foreground max-w-[75%] text-center text-[11px]">
              {m.content}
              <MessageTime value={m.created_at} className="mt-0.5 text-center" />
            </p>
            <span className="bg-border h-px flex-1" aria-hidden />
          </div>
        ) : (
          <div
            key={m.id}
            className={cn('flex', m.role === 'visitor' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                m.role === 'visitor' && 'bg-primary text-primary-foreground rounded-br-sm',
                m.role === 'agent' && 'bg-muted rounded-bl-sm',
                // A human reply gets its own surface, not the AI's: "who am I
                // reading, the bot or a colleague" is the question this whole
                // screen exists to answer during a handoff.
                m.role === 'operator' &&
                  'bg-accent text-accent-foreground border-border rounded-bl-sm border'
              )}
            >
              {m.role === 'agent' && (
                <div className="text-primary-strong mb-1 flex items-center gap-1.5 text-[11px] font-semibold">
                  <Sparkles className="size-[11px]" aria-hidden /> {t.conversations.detail.aiLabel}
                </div>
              )}
              {m.role === 'operator' && (
                <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-[11px] font-semibold">
                  <Headset className="size-[11px]" />
                  {/* `sent_by_email` is null on anything older than the backend
                      change that started recording it, so the role stays the
                      fallback label rather than showing an empty byline. */}
                  {m.sent_by_email ?? t.conversations.detail.operatorFallback}
                </div>
              )}
              {/* Only the agent side is backend-composed markdown; a visitor's
                  own message is exactly what they typed, so it renders as plain
                  text rather than being parsed (and avoids `text-primary` links
                  landing on this bubble's `bg-primary` fill). An operator types
                  into a plain textarea, so the same holds there. */}
              {m.role === 'agent' ? (
                <Markdown>{m.content}</Markdown>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
              {m.citations.length > 0 && (
                <p
                  className={cn(
                    'mt-1 text-[10px]',
                    m.role === 'visitor' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                  )}
                >
                  {t.conversations.detail.citationsLabel}:{' '}
                  {m.citations.map((c, index) => (
                    <span key={`${c.source_url}-${index}`}>
                      {index > 0 && ', '}
                      {c.source_url ? (
                        <a
                          href={c.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:no-underline"
                        >
                          {c.source_title}
                        </a>
                      ) : (
                        c.source_title
                      )}
                      {/* A PDF source has no `source_url` (no per-page route to
                          link to) but does carry `page_number`; a website
                          source is the reverse. Showing the page number here
                          is the one way a PDF citation says which part of the
                          document it came from. */}
                      {c.page_number !== null &&
                        ` (${format(t.conversations.detail.citationPage, { page: c.page_number })})`}
                    </span>
                  ))}
                </p>
              )}
              <MessageTime
                value={m.created_at}
                className={
                  m.role === 'visitor' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}
