import type { Metadata } from 'next';
import { Suspense } from 'react';
import RolesView from './components/RolesView';
import RolesSkeleton from './components/RolesSkeleton';
import { t } from '@/locales';

export const metadata: Metadata = {
  title: t.organizations.roles.title,
  description: t.organizations.roles.description,
};

export default function OrganizationRolesPage() {
  return (
    <Suspense fallback={<RolesSkeleton />}>
      <RolesView />
    </Suspense>
  );
}
