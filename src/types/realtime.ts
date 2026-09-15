import type { ConversationStatus, Message } from './conversation';

export type PresenceState = 'viewing' | 'typing';

export type PresenceViewer = { email: string; state: PresenceState };

export type ConversationMessageEvent = {
  type: 'conversation_message';
  conversation_id: string;
  message: Message;
};

export type ConversationStatusChangedEvent = {
  type: 'conversation_status_changed';
  conversation_id: string;
  status: ConversationStatus;
  assigned_operator_email: string | null;
};

export type ConversationPresenceEvent = {
  type: 'conversation_presence';
  conversation_id: string;
  viewers: PresenceViewer[];
};

/** Pushed events fanned out to subscribers. Anything else on the socket is
 * ignored, so the backend can ship a new type before this client knows it. */
export type RealtimeEvent =
  | ConversationMessageEvent
  | ConversationStatusChangedEvent
  | ConversationPresenceEvent;

export type OutboundPresence = {
  type: 'conversation_presence';
  conversation_id: string;
  state: PresenceState | 'left';
};

export type OutboundRealtimeMessage = OutboundPresence;
