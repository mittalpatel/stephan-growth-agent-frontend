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

/**
 * `optional` (backend 2026-10-07) marks a step that never blocks "set up";
 * today only `team_member_invited`. Client review (06 Oct 2026): inviting a
 * teammate is "more a question than an action", and listing it as required
 * made a solo tester believe she had to invite someone before exploring.
 */
export type SetupChecklistItem = { key: SetupChecklistItemKey; done: boolean; optional: boolean };

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

  const rows = query.data?.data ?? [];
  // Optional steps sit last and stay out of the count, so "4 of 4" is
  // reachable without inviting anyone.
  const items = [...rows.filter((row) => !row.optional), ...rows.filter((row) => row.optional)];
  const required = items.filter((item) => !item.optional);
  const completedCount = required.filter((item) => item.done).length;
  const isComplete = required.length > 0 && completedCount === required.length;

  return {
    items,
    completedCount,
    requiredCount: required.length,
    // A failed read yields no items, so the card simply does not render — an
    // onboarding hint is not worth an error state on the app's home page.
    isLoading: query.isLoading,
    isComplete,
  };
}
