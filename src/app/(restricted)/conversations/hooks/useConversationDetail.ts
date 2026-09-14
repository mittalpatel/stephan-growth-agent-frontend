'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { conversationDetailEndpoint, conversationDetailKey } from '@/services/conversations';
import type { ApiResponse } from '@/types/api';
import type { Conversation } from '@/types/conversation';

/** Poll cadence while a conversation is in a handoff state, matching
 * `useConversationMessages`' own: the two are read side by side, and a
 * transcript that advances under a stale status badge is worse than either
 * being stale alone. */
const LIVE_REFETCH_MS = 5000;

/**
 * One conversation, with its messages and citations.
 *
 * `live` polls the record while a human is handling it, so the status badge
 * follows the same transitions the transcript is already showing: the first
 * operator reply moving `handoff_requested` to `handoff_active`, and an
 * escalation resolved elsewhere returning the conversation to `open`.
 */
export function useConversationDetail(
  conversationId: string | null,
  { live = false }: { live?: boolean } = {}
) {
  const query = useAuthQuery<ApiResponse<Conversation>>(
    conversationDetailKey(conversationId ?? ''),
    conversationDetailEndpoint(conversationId ?? ''),
    { enabled: Boolean(conversationId), refetchInterval: live ? LIVE_REFETCH_MS : false }
  );

  return {
    conversation: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
