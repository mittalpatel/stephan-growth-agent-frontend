'use client';

import { useMemo } from 'react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useOrganizationPlan } from '../../hooks/useOrganizationPlan';
import {
  BILLING_PLANS_ENDPOINT,
  BILLING_PLANS_KEY,
  BILLING_SUBSCRIPTION_ENDPOINT,
  BILLING_SUBSCRIPTION_KEY,
  BILLING_USAGE_ENDPOINT,
  BILLING_USAGE_KEY,
} from '@/services/billing';
import type { ApiResponse } from '@/types/api';
import type { BillingPlan, BillingSubscription, BillingUsageRow } from '@/types/billing';

/**
 * Plans and usage are ungated reads; the subscription itself needs
 * `organization:billing` (Owner-only) — the frontend mirror of
 * `Perm.ORGANIZATION_BILLING`, so it's fetched only when held.
 */
export function useBilling() {
  const { can } = usePermissions();
  const canViewSubscription = can('organization', 'billing');

  const plansQuery = useAuthQuery<ApiResponse<BillingPlan[]>>(
    [BILLING_PLANS_KEY],
    BILLING_PLANS_ENDPOINT
  );

  const subscriptionQuery = useAuthQuery<ApiResponse<BillingSubscription>>(
    [BILLING_SUBSCRIPTION_KEY],
    BILLING_SUBSCRIPTION_ENDPOINT,
    { enabled: canViewSubscription }
  );

  const usageQuery = useAuthQuery<ApiResponse<BillingUsageRow[]>>(
    [BILLING_USAGE_KEY],
    BILLING_USAGE_ENDPOINT
  );

  const subscription = subscriptionQuery.data?.data;

  // `UsageSelector` reports `PlanLimit.max_seats` and documents that it
  // deliberately does NOT consult `organization.seat_limit` (it won't keep a
  // second copy of that override logic). But invite-time enforcement does:
  // `MembershipService._effective_seat_limit()` prefers an explicit
  // `seat_limit` and only falls back to the plan's `max_seats`. Left as-is,
  // an organization with an override sees a seat ceiling here that is not the
  // one it actually hits when inviting. Applying the same precedence
  // client-side is what makes the displayed number true.
  const { seatLimit } = useOrganizationPlan();
  const usage = useMemo(() => {
    const rows = usageQuery.data?.data ?? [];
    if (seatLimit === null) return rows;
    return rows.map((row) => (row.key === 'max_seats' ? { ...row, limit: seatLimit } : row));
  }, [usageQuery.data, seatLimit]);

  return {
    plans: plansQuery.data?.data ?? [],
    isPlansLoading: plansQuery.isLoading,
    isPlansError: plansQuery.isError,
    refetchPlans: plansQuery.refetch,

    subscription,
    isSubscriptionLoading: canViewSubscription && subscriptionQuery.isLoading,
    canViewSubscription,
    /**
     * Lets the plan grid mark which tier is the organization's own. Only
     * resolvable for a user who may read the subscription — everyone else sees
     * the plan list with nothing highlighted, which is correct: they have no
     * way to know, and guessing from usage limits would be wrong.
     */
    currentPlanId: subscription?.plan_tier?.id ?? null,

    usage,
    isUsageLoading: usageQuery.isLoading,
    isUsageError: usageQuery.isError,
  };
}
