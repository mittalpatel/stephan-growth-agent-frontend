'use client';

import { Bot, CircleCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { format, plural } from '@/lib/i18n';
import { t } from '@/locales';
import { useConfirm } from '@/providers/ConfirmProvider';
import type { ConversationStatus } from '@/types/conversation';
import type { PresenceViewer } from '@/types/realtime';

import { useConversationHandoff } from '../hooks/useConversationHandoff';

const RESOLVABLE_STATUSES: readonly ConversationStatus[] = [
  'open',
  'handoff_requested',
  'handoff_active',
];

/** Who else is in this conversation. Renders nothing when nobody is, so no
 * empty strip is reserved in the header. */
export function ConversationPresence({ viewers }: Readonly<{ viewers: PresenceViewer[] }>) {
  if (viewers.length === 0) return null;

  let text: string;
  if (viewers.length > 1) {
    text = plural(viewers.length, t.conversations.presence.multiple);
  } else {
    const [viewer] = viewers;
    const template =
      viewer.state === 'typing'
        ? t.conversations.presence.typing
        : t.conversations.presence.viewing;
    text = format(template, { name: viewer.email });
  }

  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-xs" aria-live="polite">
      <span className="bg-success-foreground size-1.5 rounded-full" aria-hidden />
      {text}
    </p>
  );
}

/**
 * "Return to AI" and "Resolve": state transitions on the conversation the
 * header is showing, so they live beside its status badge rather than with
 * the side panel's routing and background actions. Both confirm first, since
 * each is one click and awkward to undo.
 */
export function ConversationHandoffControls({
  conversationId,
  status,
}: Readonly<{ conversationId: string; status: ConversationStatus }>) {
  const confirm = useConfirm();
  const { release, isReleasing, resolve, isResolving } = useConversationHandoff(conversationId);

  const canRelease = status === 'handoff_active';
  const canResolve = RESOLVABLE_STATUSES.includes(status);
  if (!canRelease && !canResolve) return null;

  const busy = isReleasing || isResolving;

  return (
    <div className="flex items-center gap-2">
      {canRelease && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={async () => {
            const confirmed = await confirm({
              title: t.conversations.handoff.releaseConfirmTitle,
              message: t.conversations.handoff.releaseConfirmDescription,
              confirmLabel: t.conversations.handoff.release,
            });
            if (confirmed) release();
          }}
        >
          <Bot className="size-4" aria-hidden />
          {isReleasing ? t.conversations.handoff.releasing : t.conversations.handoff.release}
        </Button>
      )}
      {canResolve && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={async () => {
            const confirmed = await confirm({
              title: t.conversations.handoff.resolveConfirmTitle,
              message: t.conversations.handoff.resolveConfirmDescription,
              confirmLabel: t.conversations.handoff.resolve,
            });
            if (confirmed) resolve();
          }}
        >
          <CircleCheck className="size-4" aria-hidden />
          {isResolving ? t.conversations.handoff.resolving : t.conversations.handoff.resolve}
        </Button>
      )}
    </div>
  );
}
