import type { Metadata } from 'next';
import { Suspense } from 'react';
import NotificationsView from './components/NotificationsView';
import NotificationsSkeleton from './components/NotificationsSkeleton';
import { t } from '@/locales';

export const metadata: Metadata = {
  title: t.notifications.title,
  description: t.notifications.description,
};

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <NotificationsView />
    </Suspense>
  );
}
