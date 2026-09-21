'use client';

import { Bell } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { ListPagination } from '@/components/common/ListPagination';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import type { NotificationEventType } from '@/services/notifications';

import { useNotificationsList } from '../hooks/useNotificationsList';
import NotificationPreferencesPanel from './NotificationPreferencesPanel';
import NotificationsSkeleton from './NotificationsSkeleton';

const copy = t.notifications;

function eventLabel(eventType: NotificationEventType): string {
  return copy.eventType[eventType] ?? eventType;
}

export default function NotificationsView() {
  const list = useNotificationsList();

  function renderBody() {
    if (list.isLoading) return <NotificationsSkeleton rows={list.limit} />;

    if (list.isError) {
      return (
        <EmptyState
          icon={Bell}
          title={copy.errorTitle}
          description={copy.errorDescription}
          action={
            <Button variant="outline" onClick={() => void list.refetch()}>
              {t.buttons.tryAgain}
            </Button>
          }
        />
      );
    }

    if (list.notifications.length === 0) {
      return list.hasActiveFilters ? (
        <EmptyState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
          action={
            <Button variant="outline" onClick={list.onResetFilters}>
              {t.buttons.resetFilters}
            </Button>
          }
        />
      ) : (
        <EmptyState icon={Bell} title={copy.emptyTitle} description={copy.emptyDescription} />
      );
    }

    return (
      <div className="border-border overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{copy.columns.type}</TableHead>
              <TableHead>{copy.columns.status}</TableHead>
              <TableHead>{copy.columns.received}</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.notifications.map((notification) => (
              <TableRow key={notification.id}>
                <TableCell className="font-medium">{eventLabel(notification.event_type)}</TableCell>
                <TableCell>
                  <Badge variant={notification.is_read ? 'outline' : 'secondary'}>
                    {notification.is_read ? copy.status.read : copy.status.unread}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {formatDateTime(notification.created_at)}
                </TableCell>
                <TableCell>
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void list.markRead(notification.id)}
                    >
                      {copy.markRead}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <Button variant="outline" onClick={() => void list.markAllRead()}>
            {copy.markAllRead}
          </Button>
        }
      />

      <FilterToolbar
        total={list.total}
        displayed={list.displayed}
        isFetching={list.isFetching}
        searchTerm={list.searchTerm}
        onSearchChange={list.onSearchChange}
        onSearchClear={list.onSearchClear}
        sortField={list.sortField}
        sortDirection={list.sortDirection}
        sortOptions={list.sortOptions}
        onSortFieldChange={list.onSortFieldChange}
        onSortDirectionToggle={list.onSortDirectionToggle}
        limit={list.limit}
        limitOptions={list.limitOptions}
        onLimitChange={list.onLimitChange}
        onResetFilters={list.onResetFilters}
        filterConfigs={list.filterConfigs}
        activeFilters={list.activeFilters}
        onFilterChange={list.onFilterChange}
      />

      {renderBody()}

      {list.totalPages > 1 && (
        <ListPagination
          currentPage={list.currentPage}
          totalPages={list.totalPages}
          limit={list.limit}
          limitOptions={list.limitOptions}
          onPageChange={list.onPageChange}
          onLimitChange={list.onLimitChange}
        />
      )}

      <NotificationPreferencesPanel />
    </div>
  );
}
