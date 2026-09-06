import type { Metadata } from 'next';
import { Suspense } from 'react';
import MyInvitesView from './components/MyInvitesView';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/locales';

export const metadata: Metadata = {
  title: t.organizations.myInvites.title,
  description: t.organizations.myInvites.description,
};

export default function MyInvitesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title={t.organizations.myInvites.title}
        description={t.organizations.myInvites.description}
      />
      <Suspense fallback={<Skeleton className="h-20 w-full" />}>
        <MyInvitesView />
      </Suspense>
    </div>
  );
}
