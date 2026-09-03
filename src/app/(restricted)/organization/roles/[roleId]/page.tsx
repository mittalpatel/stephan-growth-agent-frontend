import type { Metadata } from 'next';
import { Suspense } from 'react';
import RoleDetailView from './components/RoleDetailView';
import RoleEditorSkeleton from '../components/RoleEditorSkeleton';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.organizations.roles.title };

/**
 * The role editor route.
 *
 * `params` is a Promise in Next 16 and must be awaited — destructuring it
 * directly is one of the more common upgrade mistakes.
 */
export default async function RoleDetailPage({
  params,
}: Readonly<{ params: Promise<{ roleId: string }> }>) {
  const { roleId } = await params;

  return (
    <Suspense fallback={<RoleEditorSkeleton />}>
      <RoleDetailView roleId={roleId} />
    </Suspense>
  );
}
