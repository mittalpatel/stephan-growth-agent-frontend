'use client';

import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
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

/** Onboarding checklist for the dashboard, never cached server-side. */
export function useSetupChecklist() {
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? '';

  const query = useAuthQuery<ApiResponse<SetupChecklistItem[]>>(
    organizationSetupChecklistKey(organizationId),
    organizationSetupChecklistEndpoint(organizationId),
    { enabled: Boolean(organizationId) }
  );

  const items = query.data?.data ?? [];
  const isComplete = items.length > 0 && items.every((item) => item.done);

  return { items, isLoading: query.isLoading, isComplete };
}
