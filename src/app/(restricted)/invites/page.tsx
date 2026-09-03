import type { Metadata } from 'next';
import { Suspense } from 'react';
import MyInvitesView from './components/MyInvitesView';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/locales';

export const metadata: Metadata = {
  title: t.organizations.myInvites.title,
  description: t.organizations.myInvites.description,
};

export default function MyInvitesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.organizations.myInvites.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t.organizations.myInvites.description}
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-20 w-full" />}>
        <MyInvitesView />
      </Suspense>
    </div>
  );
}
