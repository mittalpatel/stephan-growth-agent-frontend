'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/i18n';
import { t } from '@/locales';
import type { AgentDeploymentKey } from '@/types/agent';

import { useAgentDeploymentKeys } from '../hooks/useAgentDeploymentKeys';
import { RevealDeploymentKeyDialog } from './RevealDeploymentKeyDialog';

const copy = t.agents.settings.keys;

type Props = Readonly<{ agentId: string }>;

export function DeploymentKeysSection({ agentId }: Props) {
  const { keys, issueKey, isIssuing, issuedKey, dismissIssuedKey, revokeKey, revokingId } =
    useAgentDeploymentKeys(agentId);
  const [confirming, setConfirming] = useState<AgentDeploymentKey | null>(null);

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">{copy.title}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{copy.description}</p>
          </div>
          <Button onClick={() => void issueKey()} disabled={isIssuing}>
            {copy.issue}
          </Button>
        </div>

        {keys.length === 0 ? (
          <p className="text-muted-foreground text-sm">{copy.empty}</p>
        ) : (
          <ul className="divide-border divide-y">
            {keys.map((key) => (
              <li key={key.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2">
                  <KeyRound className="text-muted-foreground size-4" aria-hidden />
                  <span className="font-mono text-sm">{key.key_prefix}</span>
                  <StatusBadge
                    label={key.revoked_at ? copy.status.revoked : copy.status.active}
                    tone={key.revoked_at ? 'neutral' : 'success'}
                  />
                  <span className="text-muted-foreground text-xs">
                    {formatDate(key.created_at)}
                  </span>
                </div>
                {!key.revoked_at && (
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
        )}

        <p className="text-muted-foreground text-xs">{copy.sessionOnlyNote}</p>
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

      <RevealDeploymentKeyDialog secret={issuedKey?.secret ?? null} onDismiss={dismissIssuedKey} />
    </Card>
  );
}
