'use client';

import { useState } from 'react';
import { FormProvider, useWatch, type Control } from 'react-hook-form';
import { UserPlus } from 'lucide-react';
import type { AssignableRole } from '../../hooks/useOrganizationMembers';
import {
  OWNER_ROLE_SLUG,
  RECOMMENDED_ROLE_SLUG,
  useInviteMemberForm,
  type InviteMemberFormValues,
} from '../../hooks/useInviteMemberForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RHFSelectField, RHFTextField } from '@/components/common/form';
import { format } from '@/lib/i18n';
import { t } from '@/locales';

type Props = Readonly<{
  roles: AssignableRole[];
  onInvited: () => void;
}>;

/**
 * What the chosen role can do, in plain words. Client testing (29 Sep 2026)
 * found eight role names with nothing to tell them apart, Owner versus Tenant
 * Administrator in particular.
 */
function RoleDescription({
  roles,
  control,
}: Readonly<{ roles: AssignableRole[]; control: Control<InviteMemberFormValues> }>) {
  const roleId = useWatch({ control, name: 'role_id' });
  const role = roles.find((candidate) => candidate.id === roleId);
  // System roles use the translated copy; a custom role falls back to the
  // description its admin wrote.
  const description = role
    ? (t.organizations.invite.roleDescriptions[role.slug] ?? role.description)
    : undefined;
  if (!description) return null;
  return (
    <p className="bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm">{description}</p>
  );
}

export default function InviteMemberDialog({ roles: allRoles, onInvited }: Props) {
  const [open, setOpen] = useState(false);
  // Ownership moves only by transfer; the backend refuses it on an invite.
  const roles = allRoles.filter((role) => role.slug !== OWNER_ROLE_SLUG);
  const recommendedRoleId = roles.find((role) => role.slug === RECOMMENDED_ROLE_SLUG)?.id;
  const { form, isPending, submit } = useInviteMemberForm({
    defaultRoleId: recommendedRoleId,
    onSuccess: () => {
      setOpen(false);
      onInvited();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" aria-hidden />
          {t.organizations.invite.title}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.organizations.invite.title}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={submit} className="space-y-4">
            <RHFTextField<InviteMemberFormValues>
              name="email"
              type="email"
              label={t.organizations.invite.emailLabel}
              placeholder={t.organizations.invite.emailPlaceholder}
              required
            />
            <RHFSelectField<InviteMemberFormValues>
              name="role_id"
              label={t.organizations.invite.roleLabel}
              description={t.organizations.invite.roleHelp}
              options={roles.map((role) => ({
                label:
                  role.id === recommendedRoleId
                    ? format(t.organizations.invite.recommendedRole, { name: role.name })
                    : role.name,
                value: role.id,
              }))}
              required
            />
            <RoleDescription roles={roles} control={form.control} />
            <Button type="submit" className="w-full" disabled={isPending}>
              {t.organizations.invite.submit}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
