'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDate } from '@/lib/i18n';
import { t } from '@/locales';
import type { AgentDeploymentKey } from '@/types/agent';

import { useAgentDeploymentKeys } from '../hooks/useAgentDeploymentKeys';

const copy = t.agents.settings.keys;

type Props = Readonly<{ agentId: string }>;

/**
 * Read-only list + revoke. Key creation happens only via
 * `EmbedSnippetSection`'s "Generate embed code" now (2026-09-09) — this used
 * to have its own "Issue key" button minting an unrelated, unlabeled key
 * with no snippet, a confusing second way to create the same credential.
 */
export function DeploymentKeysSection({ agentId }: Props) {
  const { keys, canManage, isLoading, isError, refetch, revokeKey, revokingId } =
    useAgentDeploymentKeys(agentId);
  const [confirming, setConfirming] = useState<AgentDeploymentKey | null>(null);

  function renderList() {
    if (isLoading) return <Skeleton className="h-16 w-full" />;

    if (isError) {
      return (
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">{copy.loadError}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t.buttons.tryAgain}
          </Button>
        </div>
      );
    }

    if (keys.length === 0) {
      return (
        <p className="border-border text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">
          {copy.empty}
        </p>
      );
    }

    // Active keys first: they are the ones that can still be revoked, and a
    // long tail of revoked keys otherwise buries them.
    const ordered = [...keys].sort(
      (a, b) => Number(Boolean(a.revoked_at)) - Number(Boolean(b.revoked_at))
    );

    return (
      <ul className="border-border divide-border divide-y rounded-lg border">
        {ordered.map((key) => (
          <li key={key.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <KeyRound className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm">{key.key_prefix}</span>
                  <StatusBadge
                    label={key.revoked_at ? copy.status.revoked : copy.status.active}
                    tone={key.revoked_at ? 'neutral' : 'success'}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  {key.revoked_at
                    ? format(copy.revokedAt, { date: formatDate(key.revoked_at) })
                    : format(copy.createdAt, { date: formatDate(key.created_at) })}
                </p>
              </div>
            </div>
            {canManage && !key.revoked_at && (
              <Button
                variant="ghost"
                size="sm"
                disabled={revokingId === key.id}
                onClick={() => setConfirming(key)}
              >
                {copy.revoke}
              </Button>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold">{copy.title}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{copy.description}</p>
        </div>

        {renderList()}
      </CardContent>

      <ConfirmDialog
        open={confirming !== null}
        destructive
        title={copy.revokeConfirmTitle}
        message={copy.revokeConfirmDescription}
        loading={revokingId !== null}
        onConfirm={() => {
          if (confirming) void revokeKey(confirming.id);
          setConfirming(null);
        }}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
      />
    </Card>
  );
}
