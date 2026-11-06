'use client';

import { useState } from 'react';
import { Monitor } from 'lucide-react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { useSessions } from '@/hooks/useSessions';
import { formatRelativeTime } from '@/lib/i18n';
import { t } from '@/locales';
import type { SessionRow } from '@/services/sessions';

import { CARD, SectionHeader } from './profileUi';

const copy = t.userProfile.sessions;

export function SessionsSection() {
  const { isLoading, sessions, revoke, pendingJti } = useSessions();
  const [confirming, setConfirming] = useState<SessionRow | null>(null);

  return (
    <section className={CARD}>
      <SectionHeader icon={<Monitor className="h-4 w-4" />} title={copy.sectionTitle} />
      <p className="mb-4 text-sm text-muted-foreground">{copy.description}</p>

      {!isLoading && sessions.length === 0 && (
        <p className="text-sm text-muted-foreground">{copy.empty}</p>
      )}

      {!isLoading && sessions.length > 0 && (
        <ul className="divide-y divide-border">
          {sessions.map((session) => (
            <li
              key={session.jti}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              {/* `flex-1` + `min-w-0` on both levels let a long user-agent string
                  truncate; without them it sets the row's min width and the
                  whole tab scrolls sideways on a phone. */}
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">
                    {session.user_agent || copy.unknownDevice}
                  </span>
                  {session.is_current && (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold uppercase text-success-foreground">
                      {copy.currentBadge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {session.ip_address ?? copy.unknownIp} · {formatRelativeTime(session.created_at)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={pendingJti === session.jti}
                onClick={() => setConfirming(session)}
              >
                {copy.revokeButton}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirming !== null}
        destructive
        title={confirming?.is_current ? copy.revokeCurrentConfirmTitle : copy.revokeConfirmTitle}
        message={confirming?.is_current ? copy.revokeCurrentConfirmBody : copy.revokeConfirmBody}
        loading={pendingJti !== null}
        onConfirm={() => {
          if (confirming) void revoke(confirming.jti);
          setConfirming(null);
        }}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
      />
    </section>
  );
}
