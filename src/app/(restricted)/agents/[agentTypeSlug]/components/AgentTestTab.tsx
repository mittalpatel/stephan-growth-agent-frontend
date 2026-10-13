'use client';

import { useEffect, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  ChevronDown,
  FileText,
  Lock,
  MessageSquareDashed,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { Markdown } from '@/components/common/Markdown';
import { MessageTime } from '@/components/common/MessageTime';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { RHFTextareaField } from '@/components/common/form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { format, plural } from '@/lib/i18n';
import { agentTestQuestionSchema, type AgentTestQuestionFormValues } from '@/lib/schemas/agent';
import { t } from '@/locales';
import type { Agent, AgentTestAskCitation, AgentTestAskResult } from '@/types/agent';

import { useAgentDraft } from '../hooks/useAgentDraft';
import { useAgentVersion } from '../hooks/useAgentVersion';
import { useAgentTestAsk, type TestTurn } from '../hooks/useAgentTestAsk';

const copy = t.agents.detail.test;

const DECISION_TONE: Record<AgentTestAskResult['confidence_decision'], StatusTone> = {
  answered: 'success',
  clarify: 'info',
  fallback: 'warning',
  handoff: 'warning',
};

type Props = Readonly<{ agent: Agent }>;

/**
 * A test console for the draft, or for the live version when there is no
 * draft. Client review (06 Oct 2026): publishing clears the draft, and the
 * tab then refused to test anything, which read as "testing stops once you
 * go live". The backend's test-ask falls back to the published version the
 * same way (`tested_version`). The empty state is left for an agent with
 * neither version.
 */
export function AgentTestTab({ agent }: Props) {
  const { can } = usePermissions();
  const canExecute = can('agent', 'execute');
  const draftState = useAgentDraft(agent.id);
  // Only fetched once the draft has settled as missing.
  const live = useAgentVersion(
    agent.id,
    !draftState.isLoading && !draftState.draft ? agent.published_version?.id : undefined
  );

  if (!canExecute) {
    return (
      <Card>
        <EmptyState
          icon={Lock}
          title={copy.noPermissionTitle}
          description={copy.noPermissionDescription}
        />
      </Card>
    );
  }

  if (draftState.isLoading || live.isLoading) {
    return (
      <Card className="space-y-4 p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </Card>
    );
  }

  // `useAgentDraft` reads any settled error as "no draft", which after a
  // publish is the expected state.
  const version = draftState.draft ?? live.version;
  if (!version) {
    return (
      <Card>
        <EmptyState
          icon={MessageSquareDashed}
          title={copy.noDraftTitle}
          description={copy.noDraftDescription}
          action={
            <Button
              size="sm"
              disabled={draftState.isCreatingDraft}
              onClick={() => void draftState.createDraft()}
            >
              {copy.createDraft}
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <TestConsole
      agentId={agent.id}
      isLive={!draftState.draft}
      versionNumber={version.version_number}
      greeting={version.localized_text[agent.default_language]?.greeting ?? ''}
      suggestions={version.behavior_config.suggested_questions ?? []}
    />
  );
}

type ConsoleProps = Readonly<{
  agentId: string;
  isLive: boolean;
  versionNumber: number;
  greeting: string;
  suggestions: string[];
}>;

function TestConsole({ agentId, isLive, versionNumber, greeting, suggestions }: ConsoleProps) {
  const { turns, ask, retry, clear, isPending } = useAgentTestAsk(agentId);
  const form = useForm<AgentTestQuestionFormValues>({
    resolver: zodResolver(agentTestQuestionSchema),
    defaultValues: { question: '' },
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scrolls the console only; `scrollIntoView` would drag the whole page.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  const submit = form.handleSubmit((values) => {
    form.reset({ question: '' });
    void ask(values.question);
  });

  return (
    <Card className="flex flex-col gap-0 overflow-hidden p-0">
      <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b px-6 py-5">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-bold">{copy.title}</h2>
            <StatusBadge
              label={format(isLive ? copy.liveVersion : copy.draftVersion, {
                version: versionNumber,
              })}
              tone={isLive ? 'success' : 'neutral'}
            />
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm">
            {isLive ? copy.liveDescription : copy.description}
          </p>
        </div>
        {turns.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear} disabled={isPending}>
            <RotateCcw className="size-4" aria-hidden />
            {copy.clear}
          </Button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="bg-muted/30 flex max-h-150 min-h-95 flex-col gap-5 overflow-y-auto px-6 py-6"
      >
        {turns.length === 0 ? (
          <EmptyIntro
            greeting={greeting}
            suggestions={suggestions}
            disabled={isPending}
            onPick={(question) => void ask(question)}
          />
        ) : (
          turns.map((turn) => (
            <TurnView
              key={turn.id}
              turn={turn}
              onRetry={() => void retry(turn.id)}
              disabled={isPending}
            />
          ))
        )}
      </div>

      <FormProvider {...form}>
        <form
          onSubmit={submit}
          onKeyDown={(event) => {
            // Enter asks, Shift+Enter keeps its newline; an IME composing a
            // character must not submit halfway through.
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing &&
              event.target instanceof HTMLTextAreaElement
            ) {
              event.preventDefault();
              if (!isPending) void submit();
            }
          }}
          className="border-border space-y-2 border-t px-6 py-4"
        >
          <RHFTextareaField<AgentTestQuestionFormValues>
            name="question"
            label={copy.questionLabel}
            placeholder={copy.questionPlaceholder}
            rows={2}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs">
              {copy.keyboardHint} {copy.independentNote}
            </p>
            <Button type="submit" size="sm" disabled={isPending}>
              <SendHorizontal className="size-4" aria-hidden />
              {isPending ? copy.asking : copy.submit}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Card>
  );
}

function EmptyIntro({
  greeting,
  suggestions,
  disabled,
  onPick,
}: Readonly<{
  greeting: string;
  suggestions: string[];
  disabled: boolean;
  onPick: (question: string) => void;
}>) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div className="text-center">
        <p className="font-semibold">{copy.emptyTitle}</p>
        <p className="text-muted-foreground text-sm">{copy.emptyDescription}</p>
      </div>

      {greeting && (
        <AgentBubble label={copy.greetingLabel}>
          <p className="whitespace-pre-wrap">{greeting}</p>
        </AgentBubble>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">{copy.suggestionsLabel}</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((question) => (
              <Button
                key={question}
                type="button"
                variant="outline"
                size="sm"
                className="h-auto rounded-full py-1.5 text-left whitespace-normal"
                disabled={disabled}
                onClick={() => onPick(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AgentBubble({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex justify-start">
      <div className="bg-card border-border max-w-[85%] rounded-2xl rounded-bl-sm border px-4 py-3 text-sm leading-relaxed shadow-xs">
        <p className="text-primary-strong mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold">
          <Sparkles className="size-3" aria-hidden />
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

function TurnView({
  turn,
  onRetry,
  disabled,
}: Readonly<{ turn: TestTurn; onRetry: () => void; disabled: boolean }>) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm">
          <p className="text-primary-foreground/70 mb-1 flex items-center gap-1.5 text-[11px] font-semibold">
            <UserRound className="size-3" aria-hidden />
            {copy.youLabel}
          </p>
          <p className="whitespace-pre-wrap">{turn.question}</p>
          <MessageTime value={turn.askedAt} className="text-primary-foreground/70" />
        </div>
      </div>

      {turn.status === 'pending' && (
        <AgentBubble label={copy.agentLabel}>
          <output className="block w-64 space-y-2" aria-label={copy.asking}>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </output>
        </AgentBubble>
      )}

      {turn.status === 'error' && (
        <div className="flex justify-start">
          <div className="border-destructive/30 bg-destructive/5 flex max-w-[85%] flex-wrap items-center gap-3 rounded-2xl rounded-bl-sm border px-4 py-3 text-sm">
            <AlertTriangle className="text-destructive size-4 shrink-0" aria-hidden />
            <p className="text-destructive">{turn.errorMessage || copy.errorFallback}</p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={disabled}>
              <RotateCcw className="size-3.5" aria-hidden />
              {copy.retry}
            </Button>
          </div>
        </div>
      )}

      {turn.status === 'done' && <AnswerView result={turn.result} answeredAt={turn.answeredAt} />}
    </div>
  );
}

function AnswerView({
  result,
  answeredAt,
}: Readonly<{ result: AgentTestAskResult; answeredAt: Date }>) {
  const decision = result.confidence_decision;
  return (
    <AgentBubble label={copy.agentLabel}>
      <Markdown className="text-sm leading-relaxed">{result.answer}</Markdown>

      <div className="border-border mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
        <StatusBadge label={copy.confidence[decision]} tone={DECISION_TONE[decision]} />
        <p className="text-muted-foreground text-xs">{copy.confidenceHelp[decision]}</p>
      </div>

      {result.citations.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-xs">{copy.noCitations}</p>
      ) : (
        <Collapsible className="mt-2">
          <CollapsibleTrigger className="text-muted-foreground hover:text-foreground group flex items-center gap-1 text-xs font-medium">
            <FileText className="size-3.5" aria-hidden />
            {plural(result.citations.length, copy.citationsCount)}
            <ChevronDown
              className="size-3.5 transition-transform group-data-[state=open]:rotate-180"
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-2 space-y-2">
              {result.citations.map((citation, index) => (
                <CitationItem key={`${citation.source_url}-${index}`} citation={citation} />
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
      <MessageTime value={answeredAt} className="text-muted-foreground" />
    </AgentBubble>
  );
}

function CitationItem({ citation }: Readonly<{ citation: AgentTestAskCitation }>) {
  const title = citation.source_url ? (
    <a
      href={citation.source_url}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:no-underline"
    >
      {citation.source_title}
    </a>
  ) : (
    citation.source_title
  );

  return (
    <li className="bg-muted/50 border-border rounded-lg border p-3 text-xs">
      <p className="font-medium">
        {title}
        {/* A PDF source has no `source_url` but does carry a `page_number`;
            a website source is the reverse. */}
        {citation.page_number !== null && (
          <span className="text-muted-foreground font-normal">
            {' '}
            ({format(copy.citationPage, { page: citation.page_number })})
          </span>
        )}
      </p>
      <Markdown className="text-muted-foreground mt-1">{citation.excerpt}</Markdown>
    </li>
  );
}
