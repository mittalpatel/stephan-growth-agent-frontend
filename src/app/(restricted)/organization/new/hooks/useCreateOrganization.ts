'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { applyApiError } from '@/lib/apiError';
import { ORGANIZATIONS_ENDPOINT, type CreateOrganizationPayload } from '@/services/organizations';
import { DEFAULT_LANDING } from '@/constants/navItems';
import { t } from '@/locales';

interface CreatedOrganization {
  id: string;
}

/**
 * Creates an organization and immediately switches into it.
 *
 * Creating one does **not** activate it — `OrganizationService.create` makes the
 * caller its Owner but the JWT's `org_id` claim is unchanged, exactly like any
 * other membership change. Without the follow-up `switchOrganization` call the
 * user would be an Owner of an organization they are not, from the token's
 * perspective, currently acting in — the permissions API and every other
 * request would keep answering for whichever org they were in before.
 */
export function useCreateOrganization() {
  const router = useRouter();
  const { switchOrganization } = useOrganization();
  const { mutateAsync, isPending: isCreating } = useAuthMutation<{ data: CreatedOrganization }>();
  const [isActivating, setIsActivating] = useState(false);

  const create = useCallback(
    async (name: string) => {
      try {
        const response = await mutateAsync({
          url: ORGANIZATIONS_ENDPOINT,
          body: { name } satisfies CreateOrganizationPayload,
        });
        const organizationId = response.data.id;
        toast.success(t.organizations.create.created);

        // switchOrganization() clears the whole query cache once the new token
        // lands, so nothing from before this point needs a separate invalidation.
        setIsActivating(true);
        await switchOrganization(organizationId);
        router.push(DEFAULT_LANDING);
        return true;
      } catch (error) {
        applyApiError(error);
        return false;
      } finally {
        setIsActivating(false);
      }
    },
    [mutateAsync, switchOrganization, router]
  );

  return { create, isSubmitting: isCreating || isActivating };
}
