'use client';

import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { useUser } from '@/app/(restricted)/context/UserContext';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import {
  organizationMembersEndpoint,
  organizationMembersKey,
  organizationTransferOwnershipEndpoint,
} from '@/services/organizations';
import { t } from '@/locales';

interface Member {
  user_id: string;
  email: string;
  full_name: string;
}

const schema = z.object({
  user_id: z.string().min(1),
});

export type TransferOwnershipFormValues = z.infer<typeof schema>;

/**
 * Owns the member list (to populate the picker) and the transfer mutation
 * itself. Mirrors `useOrganizationSettingsForm`'s shape for the same screen —
 * see that hook's docstring for why this stays a component-adjacent hook
 * rather than a service class on the frontend.
 *
 * The backend keeps the outgoing owner as Admin rather than dropping them
 * (`OrganizationService.transfer_ownership`), so unlike a delete this needs
 * no navigation away — a page refresh is enough to pick up the caller's new
 * role and permission set.
 */
export function useTransferOwnershipForm() {
  const { organization } = useOrganization();
  const { session } = useUser();
  const router = useRouter();
  const organizationId = organization?.id ?? '';

  const membersQuery = useAuthQuery<{ data: Member[] }>(
    organizationMembersKey(organizationId),
    organizationMembersEndpoint(organizationId),
    { enabled: Boolean(organizationId) }
  );
  // Excludes the caller: transferring to yourself is a no-op the picker
  // shouldn't offer in the first place.
  const members = useMemo(
    () => (membersQuery.data?.data ?? []).filter((m) => m.email !== session.user?.email),
    [membersQuery.data, session.user?.email]
  );

  const { mutateAsync, isPending } = useAuthMutation();

  const form = useForm<TransferOwnershipFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { user_id: '' },
  });

  const selectedUserId = useWatch({ control: form.control, name: 'user_id' });
  const selectedMember = members.find((m) => m.user_id === selectedUserId) ?? null;

  const transferOwnership = async (onDone: () => void) => {
    if (!organization) return;
    const values = form.getValues();
    try {
      await mutateAsync({
        url: organizationTransferOwnershipEndpoint(organization.id),
        method: 'post',
        body: values,
      });
      toast.success(t.organizations.dangerZone.transferred);
      // The actor's own role just changed (Owner -> Admin) — the session's
      // client-held permissions are stale until the layout re-reads them.
      router.refresh();
    } catch (error) {
      applyApiError(error);
    } finally {
      onDone();
    }
  };

  return { members, form, selectedMember, isPending, transferOwnership };
}
