'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { conversationDetailEndpoint, conversationDetailKey } from '@/services/conversations';
import type { ApiResponse } from '@/types/api';
import type { Conversation } from '@/types/conversation';

/** One conversation, with its messages and citations. */
export function useConversationDetail(conversationId: string | null) {
  const query = useAuthQuery<ApiResponse<Conversation>>(
    conversationDetailKey(conversationId ?? ''),
    conversationDetailEndpoint(conversationId ?? ''),
    { enabled: Boolean(conversationId) }
  );

  return {
    conversation: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
