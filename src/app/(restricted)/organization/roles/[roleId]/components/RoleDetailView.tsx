'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';
import RoleEditorForm from '../../components/RoleEditorForm';
import RoleEditorSkeleton from '../../components/RoleEditorSkeleton';
import { useRoleDetail } from '../../hooks/useRoleDetail';

const ROLES_LIST_PATH = '/organization/roles';

export default function RoleDetailView({ roleId }: Readonly<{ roleId: string }>) {
  const {
    role,
    catalog,
    isGrantable,
    isLoading,
    isError,
    isNotFound,
    isSubmitting,
    save,
    reset,
    remove,
  } = useRoleDetail(roleId);

  if (isLoading) return <RoleEditorSkeleton />;

  // A missing role and a failed request are different situations — offering
  // "try again" on a 404 invites retrying something that cannot succeed.
  if (isNotFound || (!role && !isError)) {
    return (
      <EmptyState
        title={t.organizations.roles.notFoundTitle}
        description={t.organizations.roles.notFoundDescription}
        action={
          <Button variant="outline" asChild>
            <Link href={ROLES_LIST_PATH}>{t.organizations.roles.backToList}</Link>
          </Button>
        }
      />
    );
  }

  if (isError || !role) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={t.organizations.roles.loadFailedTitle}
        description={t.organizations.roles.loadFailedDescription}
        action={
          <Button variant="outline" asChild>
            <Link href={ROLES_LIST_PATH}>{t.organizations.roles.backToList}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <RoleEditorForm
      // Remount when the *server's* copy changes, which discards the form's local
      // state — the point being "Reset to defaults", after which the fields must
      // show the restored set rather than what the user had typed over it.
      key={`${role.name}|${role.description}|${role.permissions.join(',')}`}
      role={role}
      catalog={catalog}
      isGrantable={isGrantable}
      isSubmitting={isSubmitting}
      onSubmit={save}
      onReset={reset}
      onDelete={remove}
    />
  );
}
