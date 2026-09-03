'use client';

import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { UserPlus } from 'lucide-react';
import type { AssignableRole } from '../../hooks/useOrganizationMembers';
import { useInviteMemberForm, type InviteMemberFormValues } from '../../hooks/useInviteMemberForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RHFSelectField, RHFTextField } from '@/components/common/form';
import { t } from '@/locales';

type Props = Readonly<{
  roles: AssignableRole[];
  onInvited: () => void;
}>;

export default function InviteMemberDialog({ roles, onInvited }: Props) {
  const [open, setOpen] = useState(false);
  const { form, isPending, submit } = useInviteMemberForm({
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
              options={roles.map((role) => ({ label: role.name, value: role.id }))}
              required
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {t.organizations.invite.submit}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
