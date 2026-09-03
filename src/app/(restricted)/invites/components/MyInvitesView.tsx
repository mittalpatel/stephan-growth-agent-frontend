'use client';

import { Mail } from 'lucide-react';
import { useMyInvites } from '../hooks/useMyInvites';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDate } from '@/lib/i18n';
import { t } from '@/locales';

export default function MyInvitesView() {
  const { invites, isLoading, isError, actingOnId, accept, decline } = useMyInvites();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={Mail}
        title={t.organizations.myInvites.loadFailedTitle}
        description={t.organizations.myInvites.loadFailedDescription}
      />
    );
  }

  if (invites.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title={t.organizations.myInvites.emptyTitle}
        description={t.organizations.myInvites.emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-3">
      {invites.map((invite) => {
        const acting = actingOnId === invite.id;
        return (
          <Card key={invite.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium">{invite.organization.name}</p>
                <p className="text-muted-foreground text-sm">
                  {format(t.organizations.myInvites.asRole, {
                    role: invite.role?.name ?? t.organizations.myInvites.noRole,
                  })}
                </p>
                <p className="text-muted-foreground text-xs">
                  {format(t.organizations.myInvites.expires, {
                    date: formatDate(invite.expires_at),
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={acting}
                  onClick={() => void decline(invite)}
                >
                  {t.organizations.myInvites.decline}
                </Button>
                <Button size="sm" disabled={acting} onClick={() => void accept(invite)}>
                  {t.organizations.myInvites.accept}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
