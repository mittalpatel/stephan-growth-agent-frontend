import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuditView from './components/AuditView';
import AuditSkeleton from './components/AuditSkeleton';
import { t } from '@/locales';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return {
    title: t.organizations.audit.title,
    description: t.organizations.audit.description,
  };
}

export default function OrganizationAuditPage() {
  return (
    <Suspense fallback={<AuditSkeleton />}>
      <AuditView />
    </Suspense>
  );
}
