/** Mirrors `apps/platform_config/api/v1/serializers/billing.py`. */

export type PlanLimits = {
  max_crawl_pages: number | null;
  max_pdf_count: number | null;
  max_conversations_per_month: number | null;
  max_messages_per_month: number | null;
  max_seats: number | null;
  max_agents: number | null;
};

export type BillingPlan = {
  id: string;
  name: string;
  description: string;
  level: number;
  limits: PlanLimits | null;
};

export type BillingSubscription = {
  subscription: { id: string; status: string } | null;
  plan_tier: { id: string; name: string; level: number } | null;
};

export type BillingUsageRow = {
  key: string;
  used: number;
  limit: number | null;
};
