import type { Metadata } from 'next';
import { Suspense } from 'react';
import OrganizationSettingsView from './components/OrganizationSettingsView';
import OrganizationSettingsSkeleton from './components/OrganizationSettingsSkeleton';
import { t } from '@/locales';

export const metadata: Metadata = {
  title: t.organizations.title,
  description: t.organizations.description,
};

export default function OrganizationPage() {
  return (
    <Suspense fallback={<OrganizationSettingsSkeleton />}>
      <OrganizationSettingsView />
    </Suspense>
  );
}
