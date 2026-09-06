'use client';

import { useOrganizationMembers } from '../../hooks/useOrganizationMembers';
import MembersTable from './MembersTable';
import MembersSkeleton from './MembersSkeleton';
import InviteMemberDialog from './InviteMemberDialog';
import PendingInvitesTable from './PendingInvitesTable';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { plural } from '@/lib/i18n';
import { t } from '@/locales';

/**
 * Pure presenter: every piece of state and every request lives in
 * `useOrganizationMembers`. This file decides layout and nothing else.
 */
export default function MembersView() {
  const {
    members,
    roles,
    pendingInvites,
    isLoading,
    pendingUserId,
    pendingInviteId,
    changeRole,
    removeMember,
    revokeInvite,
    resendInvite,
    refetchAll,
  } = useOrganizationMembers();
  const { can } = usePermissions();

  const canManage = can('member', 'manage');

  if (isLoading) return <MembersSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.organizations.members.title}
        description={plural(members.length, t.organizations.members.count, {
          count: members.length,
        })}
        actions={canManage ? <InviteMemberDialog roles={roles} onInvited={refetchAll} /> : null}
      />

      {members.length === 0 ? (
        <EmptyState
          title={t.organizations.members.emptyTitle}
          description={t.organizations.members.emptyDescription}
        />
      ) : (
        <MembersTable
          members={members}
          roles={roles}
          canManage={canManage}
          pendingUserId={pendingUserId}
          onChangeRole={changeRole}
          onRemove={removeMember}
        />
      )}

      {canManage ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">{t.organizations.pendingInvites.title}</h2>
          <PendingInvitesTable
            invites={pendingInvites}
            pendingInviteId={pendingInviteId}
            onRevoke={revokeInvite}
            onResend={resendInvite}
          />
        </section>
      ) : null}
    </div>
  );
}
