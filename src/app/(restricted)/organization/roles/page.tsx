import type { Metadata } from 'next';
import { Suspense } from 'react';
import RolesView from './components/RolesView';
import RolesSkeleton from './components/RolesSkeleton';
import { t } from '@/locales';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return {
    title: t.organizations.roles.title,
    description: t.organizations.roles.description,
  };
}

export default function OrganizationRolesPage() {
  return (
    <Suspense fallback={<RolesSkeleton />}>
      <RolesView />
    </Suspense>
  );
}
