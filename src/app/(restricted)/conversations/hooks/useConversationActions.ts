'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { getAxiosError } from '@/lib/helper';
import { t } from '@/locales';
import {
  CONVERSATIONS_LIST_KEY,
  conversationAssignEndpoint,
  conversationDetailKey,
  conversationGenerateFollowupEndpoint,
  conversationMessageSendEndpoint,
  conversationMessagesPrefixKey,
} from '@/services/conversations';
import type { ApiResponse } from '@/types/api';
import type { Conversation, Message } from '@/types/conversation';

/** Conversation-level operator actions: assign, generate a follow-up, and
 * reply into the transcript. Each invalidates the detail read on success
 * rather than patching it locally, matching `useKnowledgeSourceActions`. */
export function useConversationActions(conversationId: string) {
  const queryClient = useQueryClient();

  const assignMutation = useAuthMutation<ApiResponse<Conversation>, { operator_id: string }>({
    onSuccess: () => {
      toast.success(t.conversations.toast.assigned);
      void queryClient.invalidateQueries({ queryKey: conversationDetailKey(conversationId) });
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  // Always 202: the backend only queues the work, and the result surfaces
  // later as a row in the approvals inbox rather than in this response.
  const generateFollowupMutation = useAuthMutation<ApiResponse<null>, undefined>({
    onSuccess: () => toast.success(t.conversations.toast.followupQueued),
    onError: (error) => toast.error(getAxiosError(error)),
  });

  // No `onError`: the composer awaits this and binds field errors inline via
  // `applyApiError`, so a toast here would double-report.
  const sendMessageMutation = useAuthMutation<ApiResponse<Message>, { content: string }>({
    onSuccess: () => {
      // The transcript, because the reply is a new message; the detail read,
      // because a first reply flips `handoff_requested` to `handoff_active`
      // server-side; the list, because that same status is a column and a
      // filter on it.
      void queryClient.invalidateQueries({
        queryKey: conversationMessagesPrefixKey(conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: conversationDetailKey(conversationId) });
      void queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_LIST_KEY] });
    },
  });

  return {
    // Fire-and-forget, like `generateFollowup` below: `mutate` never rejects,
    // so no caller is left with an unhandled rejection for an error `onError`
    // has already toasted.
    assign: (operatorId: string) =>
      assignMutation.mutate({
        url: conversationAssignEndpoint(conversationId),
        body: { operator_id: operatorId },
      }),
    isAssigning: assignMutation.isPending,
    // `mutate`, not `mutateAsync`: nothing awaits this, and an un-awaited
    // `mutateAsync` leaves its rejection unhandled even though `onError`
    // already reported it.
    generateFollowup: () =>
      generateFollowupMutation.mutate({
        url: conversationGenerateFollowupEndpoint(conversationId),
      }),
    isGeneratingFollowup: generateFollowupMutation.isPending,

    // `mutateAsync`: the composer awaits it to clear the textarea only on a
    // real success, and to bind a field error inline on failure.
    sendMessage: (content: string) =>
      sendMessageMutation.mutateAsync({
        url: conversationMessageSendEndpoint(conversationId),
        body: { content },
      }),
    isSendingMessage: sendMessageMutation.isPending,
  };
}
