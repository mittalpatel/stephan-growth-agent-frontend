'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Headset, Lock, UserRound } from 'lucide-react';

import { useUser } from '@/app/(restricted)/context/UserContext';
import { RHFTextareaField } from '@/components/common/form';
import { Button } from '@/components/ui/button';
import { applyApiError } from '@/lib/apiError';
import { format } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { operatorMessageSchema, type OperatorMessageFormValues } from '@/lib/schemas/conversation';
import { t } from '@/locales';
import type { ConversationStatus } from '@/types/conversation';

import { useConversationActions } from '../hooks/useConversationActions';
import { useConversationHandoff } from '../hooks/useConversationHandoff';

const CLOSED_STATUSES: readonly ConversationStatus[] = ['resolved', 'abandoned'];

type Props = Readonly<{
  conversationId: string;
  status: ConversationStatus;
  assignedOperatorEmail: string | null;
  onTyping: () => void;
}>;

/**
 * An operator's own reply into a conversation.
 *
 * The textarea only unlocks once this operator holds the conversation, which
 * is server state (`handoff_active` and assigned to them), reached through an
 * explicit claim. There is no lock: a colleague's conversation still offers
 * "take over", it just says whose it is first.
 */
export function OperatorReplyComposer({
  conversationId,
  status,
  assignedOperatorEmail,
  onTyping,
}: Props) {
  const myEmail = useUser().session.user.email;
  const { sendMessage, isSendingMessage } = useConversationActions(conversationId);
  const { claim, isClaiming } = useConversationHandoff(conversationId);
  const form = useForm<OperatorMessageFormValues>({
    resolver: zodResolver(operatorMessageSchema),
    defaultValues: { content: '' },
  });

  const isClosed = CLOSED_STATUSES.includes(status);
  const isClaimedByMe = status === 'handoff_active' && assignedOperatorEmail === myEmail;
  // A push that closes the conversation must not throw away a half-written
  // reply, so a dirty form stays on screen, read-only in effect.
  const keepDraft = isClosed && form.formState.isDirty;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await sendMessage(values.content);
      form.reset({ content: '' });
    } catch (error) {
      applyApiError<OperatorMessageFormValues>(error, {
        setError: form.setError,
        fields: ['content'],
      });
    }
  });

  if (isClosed && !keepDraft) {
    return (
      <div className="border-border text-muted-foreground flex items-center justify-center gap-2 border-t px-5 py-4 text-xs">
        <Lock className="size-3.5" aria-hidden />
        {t.conversations.reply.closedDescription}
      </div>
    );
  }

  if (!isClaimedByMe && !keepDraft) {
    return (
      <TakeOverPrompt
        status={status}
        assignedOperatorEmail={assignedOperatorEmail}
        isClaiming={isClaiming}
        onClaim={claim}
      />
    );
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={onSubmit}
        onInput={onTyping}
        className="border-border flex flex-col gap-2 border-t px-5 py-4"
      >
        {keepDraft && (
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <Lock className="size-3.5" aria-hidden />
            {t.conversations.reply.closedDescription}
          </p>
        )}
        <RHFTextareaField<OperatorMessageFormValues>
          name="content"
          label={t.conversations.reply.label}
          placeholder={t.conversations.reply.placeholder}
          rows={2}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isSendingMessage || keepDraft}>
            {isSendingMessage ? t.conversations.reply.sending : t.conversations.reply.send}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

type PromptProps = Readonly<{
  status: ConversationStatus;
  assignedOperatorEmail: string | null;
  isClaiming: boolean;
  onClaim: () => void;
}>;

function promptCopy(status: ConversationStatus, heldBy: string | null) {
  const prompt = t.conversations.reply.prompt;
  if (heldBy) {
    return {
      title: format(prompt.otherTitle, { name: heldBy }),
      description: prompt.otherDescription,
    };
  }
  if (status === 'handoff_requested') {
    return { title: prompt.requestedTitle, description: prompt.requestedDescription };
  }
  if (status === 'handoff_active') {
    return { title: prompt.pausedTitle, description: prompt.pausedDescription };
  }
  return { title: prompt.openTitle, description: prompt.openDescription };
}

/**
 * Says what state the conversation is in before offering to take it over.
 * Styled urgent only when a visitor is waiting on a person and nobody is
 * replying, since that is the one case where taking over is plainly the next
 * step; otherwise it stays quiet so it does not nag.
 */
function TakeOverPrompt({ status, assignedOperatorEmail, isClaiming, onClaim }: PromptProps) {
  const heldBy = status === 'handoff_active' ? assignedOperatorEmail : null;
  const urgent = !heldBy && (status === 'handoff_requested' || status === 'handoff_active');
  const { title, description } = promptCopy(status, heldBy);

  let label: string = t.conversations.reply.takeOver;
  if (isClaiming) label = t.conversations.reply.takingOver;
  else if (heldBy) label = format(t.conversations.reply.takeOverFromOther, { name: heldBy });

  const Icon = urgent ? Headset : UserRound;

  return (
    <div className="border-border border-t p-4">
      <div
        className={cn(
          'flex flex-wrap items-center gap-3 rounded-xl border p-3.5',
          urgent ? 'border-warning-foreground/20 bg-warning' : 'border-border bg-muted/50'
        )}
      >
        <span
          className={cn(
            'bg-background flex size-9 shrink-0 items-center justify-center rounded-full',
            urgent ? 'text-warning-foreground' : 'text-muted-foreground'
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-semibold', urgent && 'text-warning-foreground')}>
            {title}
          </p>
          <p
            className={cn(
              'text-xs',
              urgent ? 'text-warning-foreground/80' : 'text-muted-foreground'
            )}
          >
            {description}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={urgent ? 'default' : 'outline'}
          onClick={onClaim}
          disabled={isClaiming}
        >
          {label}
        </Button>
      </div>
    </div>
  );
}
