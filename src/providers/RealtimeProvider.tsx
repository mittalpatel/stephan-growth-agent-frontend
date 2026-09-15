'use client';

import { createContext, useCallback, useContext, useMemo, useRef } from 'react';

import { useRealtimeSocket } from '@/hooks/useRealtimeSocket';
import type { OutboundRealtimeMessage, RealtimeEvent } from '@/types/realtime';

type Listener = (event: RealtimeEvent) => void;

type RealtimeContextValue = {
  /** Best effort: a no-op while the socket is connecting or down. Never throws. */
  send: (message: OutboundRealtimeMessage) => void;
  /** Returns the unsubscribe function. */
  subscribe: (listener: Listener) => () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

/**
 * Owns the one realtime socket for the authenticated app and lets deep
 * components send on it and subscribe to its pushes. `session_revoked` and
 * `notification` stay handled inside `useRealtimeSocket` itself, since they
 * must fire whether or not anything is subscribed.
 */
export function RealtimeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<Listener>>(new Set());

  useRealtimeSocket({ socketRef, listenersRef });

  const send = useCallback((message: OutboundRealtimeMessage) => {
    const socket = socketRef.current;
    if (socket?.readyState !== WebSocket.OPEN) return;
    try {
      socket.send(JSON.stringify(message));
    } catch {
      // A socket closing mid-send; the backstop poll covers anything lost.
    }
  }, []);

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const value = useMemo(() => ({ send, subscribe }), [send, subscribe]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within a <RealtimeProvider>');
  return ctx;
}
