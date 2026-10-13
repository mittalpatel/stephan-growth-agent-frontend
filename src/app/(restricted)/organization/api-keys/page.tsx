import type { Metadata } from 'next';
import { Suspense } from 'react';
import ApiKeysView from './components/ApiKeysView';
import ApiKeysSkeleton from './components/ApiKeysSkeleton';
import { t } from '@/locales';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return {
    title: t.organizations.apiKeys.title,
    description: t.organizations.apiKeys.description,
  };
}

export default function OrganizationApiKeysPage() {
  return (
    <Suspense fallback={<ApiKeysSkeleton />}>
      <ApiKeysView />
    </Suspense>
  );
}
