'use client';

import { useRouter } from 'next/navigation';
import RoleEditorForm from '../../components/RoleEditorForm';
import RoleEditorSkeleton from '../../components/RoleEditorSkeleton';
import { useOrganizationRoles } from '../../hooks/useOrganizationRoles';

const ROLES_LIST_PATH = '/organization/roles';

export default function CreateRoleView() {
  const router = useRouter();
  const { catalog, isGrantable, isLoading, isSubmitting, createRole } = useOrganizationRoles();

  if (isLoading) return <RoleEditorSkeleton />;

  return (
    <RoleEditorForm
      catalog={catalog}
      isGrantable={isGrantable}
      isSubmitting={isSubmitting}
      onSubmit={async (body, codes) => {
        const created = await createRole({
          name: body.name,
          description: body.description || undefined,
          permission_codes: codes,
        });
        if (created) router.push(ROLES_LIST_PATH);
        return created;
      }}
    />
  );
}
