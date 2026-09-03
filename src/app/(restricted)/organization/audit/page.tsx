import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuditView from './components/AuditView';
import AuditSkeleton from './components/AuditSkeleton';
import { t } from '@/locales';

export const metadata: Metadata = {
  title: t.organizations.audit.title,
  description: t.organizations.audit.description,
};

export default function OrganizationAuditPage() {
  return (
    <Suspense fallback={<AuditSkeleton />}>
      <AuditView />
    </Suspense>
  );
}
