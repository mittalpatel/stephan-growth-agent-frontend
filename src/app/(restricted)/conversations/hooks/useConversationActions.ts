'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { getAxiosError } from '@/lib/helper';
import { t } from '@/locales';
import { conversationAssignEndpoint, conversationDetailKey } from '@/services/conversations';
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

  return {
    assign: (operatorId: string) =>
      assignMutation.mutateAsync({
        url: conversationAssignEndpoint(conversationId),
        body: { operator_id: operatorId },
      }),
    isAssigning: assignMutation.isPending,
  };
}
