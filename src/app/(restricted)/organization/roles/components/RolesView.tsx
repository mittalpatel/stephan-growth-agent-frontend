'use client';

import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import { useOrganizationRoles } from '../hooks/useOrganizationRoles';
import RolesSkeleton from './RolesSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { plural } from '@/lib/i18n';
import { t } from '@/locales';

export default function RolesView() {
  const { roles, isLoading } = useOrganizationRoles();
  const { can } = usePermissions();

  if (isLoading) return <RolesSkeleton />;

  const canManage = can('rbac', 'manage');
  const customRoles = roles.filter((role) => !role.is_system);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.organizations.roles.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.organizations.roles.description}</p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/organization/roles/new">
              <Plus className="size-4" aria-hidden />
              {t.organizations.roles.createTitle}
            </Link>
          </Button>
        ) : null}
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map((role) => (
          <Link
            key={role.id}
            href={`/organization/roles/${role.id}`}
            className="hover:border-primary/50 hover:bg-muted/40 group rounded-lg border p-4 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-medium">{role.name}</h2>
              <Badge variant={role.is_system ? 'secondary' : 'outline'}>
                {role.is_system
                  ? t.organizations.roles.systemBadge
                  : t.organizations.roles.customBadge}
              </Badge>
            </div>
            {role.description ? (
              <p className="text-muted-foreground mt-1 text-sm">{role.description}</p>
            ) : null}
            <p className="text-muted-foreground mt-3 flex items-center gap-1 text-xs">
              {plural(role.permissions.length, t.organizations.roles.permissionCount, {
                count: role.permissions.length,
              })}
              <ChevronRight
                className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </p>
          </Link>
        ))}
      </div>

      {customRoles.length === 0 ? (
        <EmptyState
          title={t.organizations.roles.emptyTitle}
          description={t.organizations.roles.emptyDescription}
        />
      ) : null}
    </div>
  );
}
