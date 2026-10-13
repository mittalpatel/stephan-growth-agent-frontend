import type { Metadata } from 'next';
import { Suspense } from 'react';
import NotificationsView from './components/NotificationsView';
import NotificationsSkeleton from './components/NotificationsSkeleton';
import { t } from '@/locales';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return {
    title: t.notifications.title,
    description: t.notifications.description,
  };
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <NotificationsView />
    </Suspense>
  );
}
