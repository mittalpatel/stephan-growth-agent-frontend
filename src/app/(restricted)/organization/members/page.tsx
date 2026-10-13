import type { Metadata } from 'next';
import { Suspense } from 'react';
import MembersView from './components/MembersView';
import MembersSkeleton from './components/MembersSkeleton';
import { t } from '@/locales';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return {
    title: t.organizations.members.title,
    description: t.organizations.members.description,
  };
}

export default function OrganizationMembersPage() {
  return (
    <Suspense fallback={<MembersSkeleton />}>
      <MembersView />
    </Suspense>
  );
}
