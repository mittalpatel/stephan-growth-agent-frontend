'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { signOut } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';

import axiosAuth, { SAME_ORIGIN_ROUTE } from '@/client/axiosAuth';
import { useBrowserNotifications, type PushedNotification } from '@/hooks/useBrowserNotifications';
import type { RealtimeEvent } from '@/types/realtime';

const FANNED_OUT_TYPES: ReadonlySet<string> = new Set<RealtimeEvent['type']>([
  'conversation_message',
  'conversation_status_changed',
  'conversation_presence',
]);

type Options = Readonly<{
  /** Points at the open socket, and only while it is open, so `send` can reach it. */
  socketRef: RefObject<WebSocket | null>;
  listenersRef: RefObject<Set<(event: RealtimeEvent) => void>>;
}>;

/**
 * Live push for two things that used to require a poll or a manual refresh
 * to discover: this session being revoked from another device, and a new
 * in-app notification. See `apps/realtime/` on the backend.
 *
 * Deliberately additive, not a replacement: `useSessions.ts`'s 10s poll and
 * `useNotificationBell.ts`'s 30s poll stay exactly as they are and become the
 * fail-open backstop if the socket never connects (a firewall blocking
 * websockets, a proxy that doesn't upgrade, a channel-layer outage on the
 * backend) — this hook never throws and never blocks rendering.
 *
 * Mounted once, through `RealtimeProvider` in `LayoutWrapper`, not from the
 * Active Sessions page, so a revocation is discovered on *any* open
 * authenticated page, not only while that one page happens to be open. The
 * provider owns the refs that let deeper components send and subscribe.
 */
export function useRealtimeSocket({ socketRef, listenersRef }: Options) {
  const queryClient = useQueryClient();
  const { notify } = useBrowserNotifications();

  // Held in a ref so the socket effect does not list `notify` as a dependency:
  // it is a stable `useCallback` today, but a future change making it unstable
  // would silently start tearing down and reconnecting the websocket on every
  // render, which is an expensive and very non-obvious regression.
  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  useEffect(() => {
    // Local to *this* effect run, not a ref: React 18 Strict Mode's dev-only
    // mount→cleanup→remount double-invoke means a shared ref would get reset
    // by the second run before the first run's in-flight `connect()` (paused
    // on the ticket-fetch `await`) ever re-checked it — leaving an orphaned
    // socket from a supposedly-cleaned-up effect alive and still reacting to
    // pushes. A closure-local flag can't be un-set by a later, unrelated run.
    let cancelled = false;
    let socket: WebSocket | undefined;
    let retryDelayMs = 1_000;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    async function connect() {
      if (cancelled) return;

      let ticket: string;
      try {
        const { data } = await axiosAuth.post<{ ticket: string }>(
          '/api/realtime/ticket',
          {},
          SAME_ORIGIN_ROUTE
        );
        ticket = data.ticket;
      } catch {
        scheduleRetry();
        return;
      }

      if (cancelled) return;

      // Straight to the backend origin, not through `/api/backend`'s proxy —
      // that proxy exists to attach the real access token server-side, which a
      // ticket-authenticated socket doesn't need. The backend origin is
      // already in this app's CSP `connect-src` (see `backendOrigins.ts`), so
      // this isn't opening up anything new.
      socket = new WebSocket(`${backendWsUrl()}?ticket=${encodeURIComponent(ticket)}`);

      const opened = socket;
      opened.onopen = () => {
        retryDelayMs = 1_000;
        // Published only from a live, non-cancelled run, which keeps the
        // Strict Mode guarantee above: a cleaned-up run never owns the ref.
        if (!cancelled) socketRef.current = opened;
      };

      socket.onmessage = (event) => {
        let message: { type?: string; notification?: PushedNotification } = {};
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }

        if (message.type === 'session_revoked') {
          void signOut({ redirect: true, callbackUrl: '/login' });
          return;
        }

        if (message.type === 'notification') {
          // Invalidate by key prefix rather than hand-splice the pushed row
          // into the cache: the bell's unread count and its recent list both
          // derive from server state (opt-outs, dedupe) this hook has no
          // visibility into. `organizationNotification*Key(orgId)` prefixes
          // with these same two strings (see services/notifications.ts), so
          // this matches every organization's cached entry without needing
          // to know which one is currently active.
          void queryClient.invalidateQueries({
            queryKey: ['organization-notifications'],
            exact: false,
          });
          void queryClient.invalidateQueries({
            queryKey: ['organization-notification-unread-count'],
            exact: false,
          });

          // Desktop notification for the same push. Deliberately after the
          // invalidations, and non-throwing by construction: the in-app bell
          // updating is the guaranteed delivery, the OS bubble is the bonus
          // that only fires when the user granted permission and is looking
          // at another tab.
          if (message.notification) notifyRef.current(message.notification);
          return;
        }

        if (message.type && FANNED_OUT_TYPES.has(message.type)) {
          const pushed = message as RealtimeEvent;
          listenersRef.current.forEach((listener) => listener(pushed));
        }
      };

      socket.onclose = () => {
        if (socketRef.current === opened) socketRef.current = null;
        if (!cancelled) scheduleRetry();
      };
      socket.onerror = () => socket?.close();
    }

    function scheduleRetry() {
      if (cancelled) return;
      retryTimer = setTimeout(connect, retryDelayMs);
      retryDelayMs = Math.min(retryDelayMs * 2, 30_000);
    }

    void connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (socket && socketRef.current === socket) socketRef.current = null;
      socket?.close();
    };
  }, [queryClient, socketRef, listenersRef]);
}

/** `NEXT_PUBLIC_BACKEND_API`, with its http(s) scheme swapped for ws(s). */
function backendWsUrl(): string {
  const base = process.env.NEXT_PUBLIC_BACKEND_API ?? 'http://localhost:8000/';
  const url = new URL('/ws/realtime/', base);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
