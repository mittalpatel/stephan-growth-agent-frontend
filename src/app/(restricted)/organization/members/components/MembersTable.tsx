'use client';

import { useState } from 'react';
import { Trash2, UserCheck, UserX } from 'lucide-react';
import type { AssignableRole, OrganizationMember } from '../../hooks/useOrganizationMembers';
import PermissionInspectorSheet from './PermissionInspectorSheet';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, formatDate } from '@/lib/i18n';
import { t } from '@/locales';

type Props = Readonly<{
  members: OrganizationMember[];
  roles: AssignableRole[];
  canManage: boolean;
  pendingUserId: string | null;
  onChangeRole: (userId: string, roleId: string) => void;
  onSuspend: (userId: string) => void;
  onReactivate: (userId: string) => void;
  onRemove: (userId: string) => void;
}>;

export default function MembersTable({
  members,
  roles,
  canManage,
  pendingUserId,
  onChangeRole,
  onSuspend,
  onReactivate,
  onRemove,
}: Props) {
  const [confirming, setConfirming] = useState<OrganizationMember | null>(null);
  const [inspecting, setInspecting] = useState<OrganizationMember | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.organizations.members.columns.name}</TableHead>
              <TableHead>{t.organizations.members.columns.email}</TableHead>
              <TableHead>{t.organizations.members.columns.role}</TableHead>
              <TableHead>{t.organizations.members.columns.status}</TableHead>
              <TableHead>{t.organizations.members.columns.joined}</TableHead>
              <TableHead className="w-16" />
              {canManage ? <TableHead className="w-12" /> : null}
              {canManage ? <TableHead className="w-12" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.user_id}>
                <TableCell className="font-medium">{member.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                <TableCell>
                  {canManage ? (
                    <Select
                      value={member.role?.id ?? ''}
                      disabled={pendingUserId === member.user_id}
                      onValueChange={(roleId) => onChangeRole(member.user_id, roleId)}
                    >
                      <SelectTrigger
                        className="w-[180px]"
                        aria-label={t.organizations.members.changeRole}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    (member.role?.name ?? '—')
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={
                      member.status === 'suspended'
                        ? t.organizations.members.status.suspended
                        : t.organizations.members.status.active
                    }
                    tone={member.status === 'suspended' ? 'danger' : 'success'}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(member.joined_at)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setInspecting(member)}>
                    {t.organizations.members.explain}
                  </Button>
                </TableCell>
                {canManage ? (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={
                        member.status === 'suspended'
                          ? t.organizations.members.reactivate
                          : t.organizations.members.suspend
                      }
                      disabled={pendingUserId === member.user_id}
                      onClick={() =>
                        member.status === 'suspended'
                          ? onReactivate(member.user_id)
                          : onSuspend(member.user_id)
                      }
                    >
                      {member.status === 'suspended' ? (
                        <UserCheck className="size-4" aria-hidden />
                      ) : (
                        <UserX className="size-4" aria-hidden />
                      )}
                    </Button>
                  </TableCell>
                ) : null}
                {canManage ? (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t.organizations.members.remove}
                      disabled={pendingUserId === member.user_id}
                      onClick={() => setConfirming(member)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={confirming !== null}
        destructive
        title={format(t.organizations.members.removeConfirmTitle, {
          name: confirming?.full_name ?? confirming?.email ?? '',
        })}
        message={t.organizations.members.removeConfirmBody}
        loading={pendingUserId !== null}
        onConfirm={() => {
          if (confirming) onRemove(confirming.user_id);
          setConfirming(null);
        }}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
      />

      <PermissionInspectorSheet
        userId={inspecting?.user_id ?? null}
        userName={inspecting?.full_name ?? inspecting?.email ?? ''}
        onOpenChange={(open) => {
          if (!open) setInspecting(null);
        }}
      />
    </>
  );
}
