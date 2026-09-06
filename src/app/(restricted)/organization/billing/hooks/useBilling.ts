'use client';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useAuthQuery } from '@/hooks/useAuthQuery';
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

  return {
    plans: plansQuery.data?.data ?? [],
    isPlansLoading: plansQuery.isLoading,
    subscription: subscriptionQuery.data?.data,
    isSubscriptionLoading: subscriptionQuery.isLoading,
    canViewSubscription,
    usage: usageQuery.data?.data ?? [],
    isUsageLoading: usageQuery.isLoading,
  };
}
