'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from '@/lib/i18n';
import { t } from '@/locales';

import { useBilling } from '../hooks/useBilling';

export function BillingView() {
  const {
    plans,
    isPlansLoading,
    subscription,
    isSubscriptionLoading,
    canViewSubscription,
    usage,
    isUsageLoading,
  } = useBilling();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.billing.title} description={t.billing.description} />

      {canViewSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>{t.billing.subscription.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {isSubscriptionLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : subscription?.plan_tier ? (
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold">{subscription.plan_tier.name}</p>
                {subscription.subscription ? (
                  <StatusBadge
                    label={subscription.subscription.status}
                    tone={subscription.subscription.status === 'active' ? 'success' : 'neutral'}
                  />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t.billing.subscription.notProvisioned}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t.billing.subscription.noPlan}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.billing.usage.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {isUsageLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : usage.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t.billing.usage.empty}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {usage.map((row) => (
                <div key={row.key}>
                  <p className="text-muted-foreground text-xs">{row.key}</p>
                  <p className="text-lg font-semibold">
                    {row.used}
                    {row.limit !== null && (
                      <span className="text-muted-foreground text-sm font-normal">
                        {' '}
                        / {row.limit}
                      </span>
                    )}
                    {row.limit === null && (
                      <span className="text-muted-foreground text-sm font-normal">
                        {' '}
                        / {t.billing.usage.unlimited}
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium">{t.billing.plans.title}</h2>
        {isPlansLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="flex flex-col gap-2">
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                  {plan.limits ? (
                    <div className="text-muted-foreground mt-2 space-y-1 text-xs">
                      <p>
                        {format(t.billing.plans.seats, {
                          count: plan.limits.max_seats ?? t.billing.usage.unlimited,
                        })}
                      </p>
                      <p>
                        {format(t.billing.plans.agents, {
                          count: plan.limits.max_agents ?? t.billing.usage.unlimited,
                        })}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground mt-2 text-xs">
                      {t.billing.plans.unlimitedTier}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
