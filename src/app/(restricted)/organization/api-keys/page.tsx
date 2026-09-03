import type { Metadata } from 'next';
import { Suspense } from 'react';
import ApiKeysView from './components/ApiKeysView';
import ApiKeysSkeleton from './components/ApiKeysSkeleton';
import { t } from '@/locales';

export const metadata: Metadata = {
  title: t.organizations.apiKeys.title,
  description: t.organizations.apiKeys.description,
};

export default function OrganizationApiKeysPage() {
  return (
    <Suspense fallback={<ApiKeysSkeleton />}>
      <ApiKeysView />
    </Suspense>
  );
}
