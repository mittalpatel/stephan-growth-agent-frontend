'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { RHFTextareaField } from '@/components/common/form';
import { Button } from '@/components/ui/button';
import { applyApiError } from '@/lib/apiError';
import { operatorMessageSchema, type OperatorMessageFormValues } from '@/lib/schemas/conversation';
import { t } from '@/locales';

import { useConversationActions } from '../hooks/useConversationActions';

/**
 * An operator's own reply into a conversation.
 *
 * Sending is what actually takes a conversation over: the backend flips
 * `handoff_requested` to `handoff_active` on the first reply, which is the
 * signal that silences the AI. Assignment alone does not, so this is
 * deliberately separate from the assign control in the side panel.
 */
export function OperatorReplyComposer({ conversationId }: Readonly<{ conversationId: string }>) {
  const { sendMessage, isSendingMessage } = useConversationActions(conversationId);
  const form = useForm<OperatorMessageFormValues>({
    resolver: zodResolver(operatorMessageSchema),
    defaultValues: { content: '' },
  });

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

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="border-border flex flex-col gap-2 border-t px-5 py-4">
        <RHFTextareaField<OperatorMessageFormValues>
          name="content"
          label={t.conversations.reply.label}
          placeholder={t.conversations.reply.placeholder}
          rows={2}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isSendingMessage}>
            {isSendingMessage ? t.conversations.reply.sending : t.conversations.reply.send}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
