'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { getAxiosError } from '@/lib/helper';
import { t } from '@/locales';
import {
  CONVERSATIONS_LIST_KEY,
  conversationDetailKey,
  conversationHandoffClaimEndpoint,
  conversationHandoffReleaseEndpoint,
  conversationResolveEndpoint,
} from '@/services/conversations';
import type { ApiResponse } from '@/types/api';
import type { Conversation } from '@/types/conversation';

/**
 * Explicit control transfer: claim (human takes over), release (back to the
 * AI), resolve (closed).
 *
 * Each response is the full updated conversation, so it is written straight
 * into the detail cache instead of refetched. Deliberately no `onMutate`
 * optimism: a 5s poll that started before the click could land after it and
 * flip the status back for a cycle. The list is invalidated rather than
 * patched because status is a server-side filter, so the row may now belong
 * on a different page or none.
 */
export function useConversationHandoff(conversationId: string) {
  const queryClient = useQueryClient();

  const applyResult = (response: ApiResponse<Conversation>, message: string) => {
    queryClient.setQueryData(conversationDetailKey(conversationId), response);
    void queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_LIST_KEY] });
    toast.success(message);
  };

  const claimMutation = useAuthMutation<ApiResponse<Conversation>, undefined>({
    onSuccess: (response) => applyResult(response, t.conversations.toast.claimed),
    onError: (error) => toast.error(getAxiosError(error)),
  });

  const releaseMutation = useAuthMutation<ApiResponse<Conversation>, undefined>({
    onSuccess: (response) => applyResult(response, t.conversations.toast.released),
    onError: (error) => toast.error(getAxiosError(error)),
  });

  const resolveMutation = useAuthMutation<ApiResponse<Conversation>, undefined>({
    onSuccess: (response) => applyResult(response, t.conversations.toast.resolved),
    onError: (error) => toast.error(getAxiosError(error)),
  });

  return {
    // `mutate` throughout: `onError` already toasts, and nothing needs to
    // await these; the composer unlocks from the patched cache, not a promise.
    claim: () => claimMutation.mutate({ url: conversationHandoffClaimEndpoint(conversationId) }),
    isClaiming: claimMutation.isPending,
    release: () =>
      releaseMutation.mutate({ url: conversationHandoffReleaseEndpoint(conversationId) }),
    isReleasing: releaseMutation.isPending,
    resolve: () => resolveMutation.mutate({ url: conversationResolveEndpoint(conversationId) }),
    isResolving: resolveMutation.isPending,
  };
}
