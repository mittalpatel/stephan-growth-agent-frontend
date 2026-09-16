'use client';

import { useTranscriptQuery } from '@/hooks/useTranscriptQuery';
import { leadConversationMessagesEndpoint, leadConversationMessagesKey } from '@/services/leads';

/**
 * The transcript of the conversation a lead was captured from.
 *
 * Shares `useTranscriptQuery` with the operator conversations pane — the two
 * endpoints return the same rows through the same serializer and pagination,
 * differing only in URL and authorization (`lead:view` here).
 *
 * No `live` polling: a captured lead's source conversation is history an
 * operator is reading to decide whether to call, not a queue they are working.
 *
 * `enabled` is the caller's, so the request is only made once the transcript
 * is actually on screen and only when the lead has a conversation to read —
 * the endpoint 404s (`lead_no_linked_conversation`) otherwise, and that is a
 * state the sheet already knows about from `lead.conversation`.
 */
export function useLeadConversationMessages(leadId: string, enabled: boolean) {
  return useTranscriptQuery(
    leadConversationMessagesKey(leadId),
    leadConversationMessagesEndpoint(leadId),
    { enabled }
  );
}
