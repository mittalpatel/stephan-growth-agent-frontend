import { Suspense } from 'react';
import type { Metadata } from 'next';

import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/locales';

import { DataDeleteConfirmView } from './components/DataDeleteConfirmView';

export const metadata: Metadata = { title: t.organizations.settingsTabs.data.deleteConfirmTitle };

/**
 * The view reads the emailed `?token=` with `useSearchParams`, which Next
 * requires to sit under a Suspense boundary — without one the whole route
 * opts out of static rendering and the build warns.
 */
export default function DataDeleteConfirmPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full max-w-md" />}>
      <DataDeleteConfirmView />
    </Suspense>
  );
}
