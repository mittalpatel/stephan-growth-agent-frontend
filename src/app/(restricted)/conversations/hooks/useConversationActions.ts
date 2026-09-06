'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { getAxiosError } from '@/lib/helper';
import { t } from '@/locales';
import {
  conversationAssignEndpoint,
  conversationDetailKey,
  conversationGenerateFollowupEndpoint,
} from '@/services/conversations';
import type { ApiResponse } from '@/types/api';
import type { Conversation } from '@/types/conversation';

/** Assign an operator to a conversation. Invalidates the detail read on
 * success rather than patching it locally, matching `useKnowledgeSourceActions`. */
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
  };
}
