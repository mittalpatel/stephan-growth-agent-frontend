import type { Metadata } from 'next';
import { Suspense } from 'react';
import MembersView from './components/MembersView';
import MembersSkeleton from './components/MembersSkeleton';
import { t } from '@/locales';

export const metadata: Metadata = {
  title: t.organizations.members.title,
  description: t.organizations.members.description,
};

export default function OrganizationMembersPage() {
  return (
    <Suspense fallback={<MembersSkeleton />}>
      <MembersView />
    </Suspense>
  );
}
