'use client';

import { AlertTriangle } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { ListPagination } from '@/components/common/ListPagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/i18n';
import { t } from '@/locales';

import { useImpersonationSessions } from '../hooks/useImpersonationSessions';

const copy = t.organizations.impersonation;

/**
 * Every session ever opened, live ones first by virtue of being newest.
 *
 * The reason column is the point of the table. Who and when can be reconstructed
 * from the audit trail; why cannot, and it is the only field a later reviewer has
 * no other way to recover.
 */
export default function SessionsTable() {
  const list = useImpersonationSessions();

  function renderBody() {
    if (list.isError) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title={copy.loadFailed}
          action={
            <Button variant="outline" onClick={() => void list.refetch()}>
              {t.buttons.tryAgain}
            </Button>
          }
        />
      );
    }

    if (!list.isLoading && list.sessions.length === 0) {
      return <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />;
    }

    return (
      <div className="border-border overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{copy.columns.started}</TableHead>
              <TableHead>{copy.columns.impersonator}</TableHead>
              <TableHead>{copy.columns.target}</TableHead>
              <TableHead>{copy.columns.organization}</TableHead>
              <TableHead>{copy.columns.reason}</TableHead>
              <TableHead>{copy.columns.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {formatDateTime(session.started_at)}
                </TableCell>
                <TableCell className="break-all">{session.impersonator_email}</TableCell>
                <TableCell className="break-all">{session.target_email}</TableCell>
                <TableCell>{session.organization?.name ?? '—'}</TableCell>
                <TableCell className="max-w-xs break-words">{session.reason}</TableCell>
                <TableCell className="space-x-1 whitespace-nowrap">
                  <Badge variant={session.is_live ? 'default' : 'secondary'}>
                    {session.is_live ? copy.statusLive : copy.statusEnded}
                  </Badge>
                  {session.write_enabled ? (
                    <Badge variant="destructive">{copy.banner.writesEnabled}</Badge>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.sessionsTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderBody()}
        <ListPagination
          currentPage={list.currentPage}
          totalPages={list.totalPages}
          limit={list.limit}
          limitOptions={list.limitOptions}
          onPageChange={list.onPageChange}
          onLimitChange={list.onLimitChange}
        />
      </CardContent>
    </Card>
  );
}
