'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import {
  organizationDetailEndpoint,
  organizationDetailKey,
  type OrganizationDetail,
} from '@/services/organizations';
import type { ApiResponse } from '@/types/api';

/**
 * Read-only plan/seat info for the active organization. Separate from
 * `useOrganizationSettingsForm` because the session-derived `organization`
 * (`{id, name, slug}`) that hook already has doesn't carry `plan_tier`/
 * `seat_limit` - those only come back from the full detail fetch, and there's
 * no self-serve billing to mutate here.
 */
export function useOrganizationPlan() {
  const { organization } = useOrganization();
  const query = useAuthQuery<ApiResponse<OrganizationDetail>>(
    organizationDetailKey(organization?.id ?? ''),
    organizationDetailEndpoint(organization?.id ?? ''),
    { enabled: Boolean(organization?.id) }
  );

  return {
    planTier: query.data?.data.plan_tier ?? null,
    seatLimit: query.data?.data.seat_limit ?? null,
    isLoading: query.isLoading,
  };
}
