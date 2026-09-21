'use client';

import { AlertTriangle } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDate, formatNumber } from '@/lib/i18n';
import { t } from '@/locales';
import type { SubscriptionStatus, UsageKey } from '@/types/billing';

import { useBilling } from '../hooks/useBilling';

const SUBSCRIPTION_TONE: Record<SubscriptionStatus, StatusTone> = {
  trialing: 'info',
  active: 'success',
  past_due: 'warning',
  canceled: 'danger',
};

/**
 * `UsageSelector` returns the `PlanLimit` field names verbatim as its `key`s.
 * They are backend identifiers, not copy, so they are mapped to real labels
 * here rather than printed raw.
 */
const USAGE_LABEL: Record<UsageKey, string> = {
  max_agents: t.billing.usage.keys.max_agents,
  max_seats: t.billing.usage.keys.max_seats,
  max_conversations_per_month: t.billing.usage.keys.max_conversations_per_month,
  max_messages_per_month: t.billing.usage.keys.max_messages_per_month,
  max_pdf_count: t.billing.usage.keys.max_pdf_count,
  max_crawl_pages: t.billing.usage.keys.max_crawl_pages,
};

export function BillingView() {
  const {
    plans,
    isPlansLoading,
    isPlansError,
    refetchPlans,
    subscription,
    isSubscriptionLoading,
    canViewSubscription,
    usage,
    isUsageLoading,
    isUsageError,
    currentPlanId,
  } = useBilling();

  function renderSubscription() {
    if (isSubscriptionLoading) return <Skeleton className="h-8 w-full" />;

    // No tier assigned is the unmetered case, not an error.
    if (!subscription?.plan_tier) {
      return <p className="text-muted-foreground text-sm">{t.billing.subscription.noPlan}</p>;
    }

    const detail = subscription.subscription;
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-lg font-semibold">{subscription.plan_tier.name}</p>
          {detail ? (
            <StatusBadge
              label={t.billing.subscription.status[detail.status]}
              tone={SUBSCRIPTION_TONE[detail.status]}
            />
          ) : (
            <p className="text-muted-foreground text-sm">{t.billing.subscription.notProvisioned}</p>
          )}
        </div>

        {/* Only the date that actually applies to the current status is shown;
            the serializer returns all of them and most are null at any moment. */}
        {detail?.status === 'trialing' && detail.trial_end ? (
          <p className="text-muted-foreground text-sm">
            {format(t.billing.subscription.trialEnds, { date: formatDate(detail.trial_end) })}
          </p>
        ) : null}
        {detail?.status === 'active' && detail.current_period_end ? (
          <p className="text-muted-foreground text-sm">
            {format(t.billing.subscription.renewsOn, {
              date: formatDate(detail.current_period_end),
            })}
          </p>
        ) : null}
        {detail?.status === 'past_due' && detail.grace_period_ends_at ? (
          <p className="text-warning-foreground text-sm">
            {format(t.billing.subscription.graceEnds, {
              date: formatDate(detail.grace_period_ends_at),
            })}
          </p>
        ) : null}
        {detail?.status === 'canceled' && detail.canceled_at ? (
          <p className="text-muted-foreground text-sm">
            {format(t.billing.subscription.canceledOn, { date: formatDate(detail.canceled_at) })}
          </p>
        ) : null}
      </div>
    );
  }

  function renderUsage() {
    if (isUsageLoading) return <Skeleton className="h-24 w-full" />;
    if (isUsageError)
      return <p className="text-muted-foreground text-sm">{t.billing.usage.error}</p>;
    if (usage.length === 0) {
      return <p className="text-muted-foreground text-sm">{t.billing.usage.empty}</p>;
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {usage.map((row) => {
          // A limit of 0 is a real ceiling, so compare against null explicitly
          // rather than relying on truthiness.
          const isMetered = row.limit !== null;
          const isOverLimit = isMetered && row.used > row.limit!;

          return (
            <div key={row.key}>
              <p className="text-muted-foreground text-xs">{USAGE_LABEL[row.key] ?? row.key}</p>
              <p className={`text-lg font-semibold ${isOverLimit ? 'text-destructive' : ''}`}>
                {formatNumber(row.used)}
                <span className="text-muted-foreground text-sm font-normal">
                  {' / '}
                  {isMetered ? formatNumber(row.limit!) : t.billing.usage.unlimited}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  function renderPlans() {
    if (isPlansLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      );
    }

    if (isPlansError) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title={t.billing.plans.errorTitle}
          description={t.billing.plans.errorDescription}
          action={
            <Button variant="outline" onClick={() => void refetchPlans()}>
              {t.buttons.tryAgain}
            </Button>
          }
        />
      );
    }

    if (plans.length === 0) {
      // `EmptyState`, like every other empty list in the app and like this
      // section's own error branch above. A bare sentence here read as loose text
      // under a heading, with the carded Subscription and Usage sections above it.
      return <EmptyState title={t.billing.plans.empty} />;
    }

    return (
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          return (
            <Card key={plan.id} className={isCurrent ? 'border-primary' : undefined}>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{plan.name}</p>
                  {isCurrent ? (
                    <StatusBadge label={t.billing.plans.current} tone="success" />
                  ) : null}
                </div>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
                {plan.limits ? (
                  <dl className="text-muted-foreground mt-2 space-y-1 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt>{t.billing.usage.keys.max_seats}</dt>
                      <dd>
                        {plan.limits.max_seats === null
                          ? t.billing.usage.unlimited
                          : formatNumber(plan.limits.max_seats)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>{t.billing.usage.keys.max_agents}</dt>
                      <dd>
                        {plan.limits.max_agents === null
                          ? t.billing.usage.unlimited
                          : formatNumber(plan.limits.max_agents)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>{t.billing.usage.keys.max_conversations_per_month}</dt>
                      <dd>
                        {plan.limits.max_conversations_per_month === null
                          ? t.billing.usage.unlimited
                          : formatNumber(plan.limits.max_conversations_per_month)}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-muted-foreground mt-2 text-xs">
                    {t.billing.plans.noLimitsConfigured}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.billing.title} description={t.billing.description} />

      {/* Owner-only: `organization:billing` is not implied by `manage`. */}
      {canViewSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>{t.billing.subscription.title}</CardTitle>
          </CardHeader>
          <CardContent>{renderSubscription()}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.billing.usage.title}</CardTitle>
        </CardHeader>
        <CardContent>{renderUsage()}</CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium">{t.billing.plans.title}</h2>
        {renderPlans()}
      </div>
    </div>
  );
}
