import type { Metadata } from 'next';
import { Suspense } from 'react';
import CreateRoleView from './components/CreateRoleView';
import RoleEditorSkeleton from '../components/RoleEditorSkeleton';
import { t } from '@/locales';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return { title: t.organizations.roles.createTitle };
}

export default function CreateRolePage() {
  return (
    <Suspense fallback={<RoleEditorSkeleton />}>
      <CreateRoleView />
    </Suspense>
  );
}
