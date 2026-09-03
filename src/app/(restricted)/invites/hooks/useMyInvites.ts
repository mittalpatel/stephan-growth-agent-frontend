'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { applyApiError } from '@/lib/apiError';
import {
  MY_INVITES_ENDPOINT,
  MY_INVITES_KEY,
  myInviteAcceptEndpoint,
  myInviteDeclineEndpoint,
  type MyInvite,
} from '@/services/organizations';
import { DEFAULT_LANDING } from '@/constants/navItems';
import { t } from '@/locales';

/**
 * Invites addressed to the current, already-registered user — the in-app
 * counterpart to the emailed signup link a brand-new address gets. See
 * `MembershipService.invite` on the backend: an existing account is never
 * added to an organization silently, only invited, and accepting here is
 * what actually creates the membership.
 */
export function useMyInvites() {
  const router = useRouter();
  const { switchOrganization } = useOrganization();
  const [actingOnId, setActingOnId] = useState<string | null>(null);

  const invitesQuery = useAuthQuery<{ data: MyInvite[] }>(MY_INVITES_KEY, MY_INVITES_ENDPOINT);
  const { mutateAsync } = useAuthMutation();

  const accept = useCallback(
    async (invite: MyInvite) => {
      setActingOnId(invite.id);
      try {
        await mutateAsync({ url: myInviteAcceptEndpoint(invite.id), method: 'post' });
        toast.success(t.organizations.myInvites.accepted);
        // Land the user inside the organization they just joined, same as
        // creating one does — otherwise "accepted" with no visible change
        // reads as if nothing happened.
        await switchOrganization(invite.organization.id);
        router.push(DEFAULT_LANDING);
      } catch (error) {
        applyApiError(error);
      } finally {
        setActingOnId(null);
        await invitesQuery.refetch();
      }
    },
    [mutateAsync, switchOrganization, router, invitesQuery]
  );

  const decline = useCallback(
    async (invite: MyInvite) => {
      setActingOnId(invite.id);
      try {
        await mutateAsync({ url: myInviteDeclineEndpoint(invite.id), method: 'post' });
        toast.success(t.organizations.myInvites.declined);
        await invitesQuery.refetch();
      } catch (error) {
        applyApiError(error);
      } finally {
        setActingOnId(null);
      }
    },
    [mutateAsync, invitesQuery]
  );

  return {
    invites: invitesQuery.data?.data ?? [],
    isLoading: invitesQuery.isLoading,
    isError: invitesQuery.isError,
    actingOnId,
    accept,
    decline,
  };
}
