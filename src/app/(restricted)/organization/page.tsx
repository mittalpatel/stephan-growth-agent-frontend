import type { Metadata } from 'next';
import { Suspense } from 'react';
import OrganizationSettingsView from './components/OrganizationSettingsView';
import OrganizationSettingsSkeleton from './components/OrganizationSettingsSkeleton';
import { t } from '@/locales';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return {
    title: t.organizations.title,
    description: t.organizations.description,
  };
}

export default function OrganizationPage() {
  return (
    <Suspense fallback={<OrganizationSettingsSkeleton />}>
      <OrganizationSettingsView />
    </Suspense>
  );
}
