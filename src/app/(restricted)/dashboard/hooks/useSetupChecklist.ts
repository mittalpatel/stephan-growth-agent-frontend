'use client';

import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import {
  organizationSetupChecklistEndpoint,
  organizationSetupChecklistKey,
} from '@/services/organizations';
import type { ApiResponse } from '@/types/api';

/** The 5 fixed steps `SetupChecklistSelector.get_checklist` always returns, in order. */
export type SetupChecklistItemKey =
  | 'organization_created'
  | 'team_member_invited'
  | 'agent_created'
  | 'agent_published'
  | 'knowledge_source_added';

export type SetupChecklistItem = { key: SetupChecklistItemKey; done: boolean };

/**
 * Onboarding checklist for the dashboard, never cached server-side.
 *
 * `/dashboard` is reachable by every authenticated user regardless of role
 * (see `navItems.ts`'s `DEFAULT_LANDING` note), including one with no
 * organization at all and one holding no `organization:view` — so this query
 * is gated on both rather than 403-ing on every dashboard render for them.
 */
export function useSetupChecklist() {
  const { organization } = useOrganization();
  const { can } = usePermissions();
  const organizationId = organization?.id ?? '';

  const query = useAuthQuery<ApiResponse<SetupChecklistItem[]>>(
    organizationSetupChecklistKey(organizationId),
    organizationSetupChecklistEndpoint(organizationId),
    { enabled: Boolean(organizationId) && can('organization', 'view') }
  );

  const items = query.data?.data ?? [];
  const completedCount = items.filter((item) => item.done).length;
  const isComplete = items.length > 0 && completedCount === items.length;

  return {
    items,
    completedCount,
    // A failed read yields no items, so the card simply does not render — an
    // onboarding hint is not worth an error state on the app's home page.
    isLoading: query.isLoading,
    isComplete,
  };
}
