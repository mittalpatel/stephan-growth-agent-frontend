/**
 * Billing DTOs — mirrors `apps/platform_config/api/v1/serializers/billing.py`
 * field for field.
 */

/** Mirrors `PlanLimit`'s serialized fields. A `null` means unmetered. */
export type PlanLimits = {
  max_crawl_pages: number | null;
  max_pdf_count: number | null;
  max_conversations_per_month: number | null;
  max_messages_per_month: number | null;
  max_seats: number | null;
  max_agents: number | null;
};

/**
 * The metered keys `UsageSelector.get_usage()` returns, in its own order.
 * Identical to `PlanLimits`' field names by construction — each entry pairs a
 * live count with that limit.
 */
export type UsageKey = keyof PlanLimits;

export type BillingPlan = {
  id: string;
  name: string;
  description: string;
  level: number;
  /** `null` when the tier exists but carries no `PlanLimit` row yet. */
  limits: PlanLimits | null;
};

/** Mirrors `SubscriptionStatus` in `apps/organizations/constants.py`. */
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

/** Mirrors `SubscriptionDetailSerializer` — every date is nullable. */
export type SubscriptionDetail = {
  status: SubscriptionStatus;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  grace_period_ends_at: string | null;
  canceled_at: string | null;
};

/**
 * `GET /billing/subscription/`. Both halves are independently nullable:
 * `subscription: null` means "not provisioned yet" (a normal state, not an
 * error), `plan_tier: null` means the organization is unmetered.
 */
export type BillingSubscription = {
  subscription: SubscriptionDetail | null;
  plan_tier: { id: string; name: string; level: number } | null;
};

export type BillingUsageRow = {
  key: UsageKey;
  used: number;
  /** `null` when that dimension is unmetered for this organization. */
  limit: number | null;
};
