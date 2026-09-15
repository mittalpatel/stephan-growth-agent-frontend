'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useUser } from '@/app/(restricted)/context/UserContext';
import { useRealtime } from '@/providers/RealtimeProvider';
import {
  CONVERSATIONS_LIST_KEY,
  conversationDetailKey,
  conversationMessagesPrefixKey,
} from '@/services/conversations';
import type { ApiResponse } from '@/types/api';
import type { Conversation } from '@/types/conversation';
import type { PresenceState, PresenceViewer, RealtimeEvent } from '@/types/realtime';

const TYPING_THROTTLE_MS = 3_000;
const TYPING_IDLE_MS = 5_000;
/** Under the backend's ~60s presence TTL, so two missed beats means gone. */
const HEARTBEAT_MS = 25_000;

/**
 * Live pushes and operator presence for the conversation on screen.
 *
 * Rule for pushes: patch the cache only with what the payload fully
 * determines, invalidate anything derived. Messages are invalidated rather
 * than spliced because the transcript is an infinite query paging backwards
 * from `?page=last`, where an append would corrupt `meta.count`. Presence
 * never enters React Query: it is ephemeral and has no read endpoint.
 *
 * Every push is additive to the 5s poll in `useConversationDetail` and
 * `useConversationMessages`, which stays as the backstop when the socket is
 * down.
 */
export function useConversationRealtime(conversationId: string | null) {
  const queryClient = useQueryClient();
  const { send, subscribe } = useRealtime();
  const myEmail = useUser().session.user.email;

  const [presence, setPresence] = useState<{ id: string | null; viewers: PresenceViewer[] }>({
    id: null,
    viewers: [],
  });
  // Read at render against the active id, so switching rows never shows the
  // previous conversation's viewers for a frame.
  const viewers = useMemo(
    () => (presence.id === conversationId ? presence.viewers : []),
    [presence, conversationId]
  );

  useEffect(() => {
    return subscribe((event: RealtimeEvent) => {
      if (event.type === 'conversation_message') {
        // Always the list: `updated_at` is a sort column. The transcript only
        // for the open conversation, or one busy agent refetches every page
        // of transcripts nobody is looking at.
        void queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_LIST_KEY] });
        if (event.conversation_id === conversationId) {
          void queryClient.invalidateQueries({
            queryKey: conversationMessagesPrefixKey(event.conversation_id),
          });
        }
        return;
      }

      if (event.type === 'conversation_status_changed') {
        queryClient.setQueryData<ApiResponse<Conversation>>(
          conversationDetailKey(event.conversation_id),
          (old) =>
            old && {
              ...old,
              data: {
                ...old.data,
                status: event.status,
                assigned_operator_email: event.assigned_operator_email,
              },
            }
        );
        void queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_LIST_KEY] });
        return;
      }

      if (event.conversation_id === conversationId) {
        setPresence({ id: event.conversation_id, viewers: event.viewers });
      }
    });
  }, [conversationId, subscribe, queryClient]);

  const lastSentRef = useRef<{ state: PresenceState; at: number } | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const sendPresence = useCallback(
    (state: PresenceState) => {
      if (!conversationId) return;
      lastSentRef.current = { state, at: Date.now() };
      send({ type: 'conversation_presence', conversation_id: conversationId, state });
    },
    [conversationId, send]
  );

  useEffect(() => {
    if (!conversationId) return;
    const id = conversationId;
    const leave = () => send({ type: 'conversation_presence', conversation_id: id, state: 'left' });
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') leave();
      else sendPresence('viewing');
    };

    sendPresence('viewing');
    const heartbeat = setInterval(() => {
      if (document.visibilityState === 'visible')
        sendPresence(lastSentRef.current?.state ?? 'viewing');
    }, HEARTBEAT_MS);
    // Best effort only: the backend treats a dropped socket as departure and
    // expires presence on a TTL, which is what actually clears a crashed tab.
    window.addEventListener('beforeunload', leave);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(heartbeat);
      clearTimeout(idleTimerRef.current);
      window.removeEventListener('beforeunload', leave);
      document.removeEventListener('visibilitychange', onVisibility);
      lastSentRef.current = null;
      leave();
    };
  }, [conversationId, send, sendPresence]);

  const notifyTyping = useCallback(() => {
    const last = lastSentRef.current;
    if (last?.state !== 'typing' || Date.now() - last.at >= TYPING_THROTTLE_MS) {
      sendPresence('typing');
    }
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => sendPresence('viewing'), TYPING_IDLE_MS);
  }, [sendPresence]);

  const otherViewers = useMemo(
    () => viewers.filter((viewer) => viewer.email !== myEmail),
    [viewers, myEmail]
  );

  return { viewers, otherViewers, notifyTyping };
}
