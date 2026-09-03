'use client';

import { useState } from 'react';
import type { PendingInvite } from '@/services/organizations';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, formatDate } from '@/lib/i18n';
import { t } from '@/locales';

type Props = Readonly<{
  invites: PendingInvite[];
  pendingInviteId: string | null;
  onRevoke: (inviteId: string) => void;
  onResend: (inviteId: string) => void;
}>;

/**
 * A seat is held from the moment an invite is sent, not only once accepted —
 * see `MembershipService._assert_seat_available` on the backend. This table is
 * what makes those held-but-unredeemed seats visible and withdrawable.
 */
export default function PendingInvitesTable({
  invites,
  pendingInviteId,
  onRevoke,
  onResend,
}: Props) {
  const [confirming, setConfirming] = useState<PendingInvite | null>(null);

  if (invites.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {t.organizations.pendingInvites.emptyDescription}
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.organizations.pendingInvites.columns.email}</TableHead>
              <TableHead>{t.organizations.pendingInvites.columns.role}</TableHead>
              <TableHead>{t.organizations.pendingInvites.columns.expires}</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell className="font-medium">{invite.email}</TableCell>
                <TableCell className="text-muted-foreground">{invite.role?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(invite.expires_at)}
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pendingInviteId === invite.id}
                    onClick={() => onResend(invite.id)}
                  >
                    {t.organizations.pendingInvites.resend}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pendingInviteId === invite.id}
                    onClick={() => setConfirming(invite)}
                  >
                    {t.organizations.pendingInvites.revoke}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={confirming !== null}
        destructive
        title={format(t.organizations.pendingInvites.revokeConfirmTitle, {
          email: confirming?.email ?? '',
        })}
        message={t.organizations.pendingInvites.revokeConfirmBody}
        loading={pendingInviteId !== null}
        onConfirm={() => {
          if (confirming) onRevoke(confirming.id);
          setConfirming(null);
        }}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
      />
    </>
  );
}
