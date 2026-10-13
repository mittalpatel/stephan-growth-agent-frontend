import type { Metadata } from 'next';
import { Suspense } from 'react';
import MemberOverridesView from './components/MemberOverridesView';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/locales';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return { title: t.organizations.overrides.title };
}

/**
 * `params` is a Promise in Next 16 and must be awaited — see the role editor
 * route (`organization/roles/[roleId]/page.tsx`) for the same pattern.
 */
export default async function MemberOverridesPage({
  params,
}: Readonly<{ params: Promise<{ userId: string }> }>) {
  const { userId } = await params;

  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <MemberOverridesView userId={userId} />
    </Suspense>
  );
}
