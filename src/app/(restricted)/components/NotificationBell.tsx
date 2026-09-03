'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/i18n';
import { t } from '@/locales';
import type { NotificationEventType } from '@/services/notifications';

import { useNotificationBell } from '../hooks/useNotificationBell';

const copy = t.notifications;

function eventLabel(eventType: NotificationEventType): string {
  return copy.eventType[eventType] ?? eventType;
}

export default function NotificationBell() {
  const {
    open,
    onOpenChange,
    unreadCount,
    recent,
    isLoading,
    markRead,
    markAllRead,
    permission,
    requestBrowserPermission,
  } = useNotificationBell();

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={copy.bell.label}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-foreground outline-none transition-colors hover:bg-accent"
        >
          <Bell className="h-5 w-5" aria-hidden />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute top-1 right-1 h-4 min-w-4 justify-center px-1 text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold">{copy.bell.label}</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={markAllRead}>
              {copy.bell.markAllRead}
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {isLoading ? null : recent.length === 0 ? (
          <p className="text-muted-foreground px-2 py-4 text-center text-sm">{copy.bell.empty}</p>
        ) : (
          recent.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start gap-0.5 whitespace-normal"
              onSelect={() => {
                if (!notification.is_read) void markRead(notification.id);
              }}
            >
              <span
                className={
                  notification.is_read ? 'text-muted-foreground text-sm' : 'text-sm font-medium'
                }
              >
                {eventLabel(notification.event_type)}
              </span>
              <span className="text-muted-foreground text-xs">
                {formatDateTime(notification.created_at)}
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        {/* Permission must be asked for from a real user gesture — browsers
            ignore or penalise an unprompted request on page load — so this
            lives here rather than firing automatically on mount. Hidden once
            the answer is in, either way: there is nothing useful to offer a
            user who already granted or explicitly blocked. */}
        {permission === 'default' && (
          <DropdownMenuItem
            onSelect={(event) => {
              // Keep the menu open so the browser's own permission prompt
              // isn't dismissed along with it on some platforms.
              event.preventDefault();
              void requestBrowserPermission();
            }}
            className="justify-center text-sm"
          >
            {copy.browser.enablePrompt}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="justify-center text-sm">
            {copy.bell.viewAll}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
