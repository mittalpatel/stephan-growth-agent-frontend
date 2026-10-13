'use client';

import { useState } from 'react';
import { FormProvider } from 'react-hook-form';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { RHFTextField } from '@/components/common/form';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from '@/lib/i18n';
import { t } from '@/locales';
import type { OrganizationDomainFormValues } from '@/lib/schemas/settings';
import type { DomainActivationStatus, OrganizationDomain } from '@/types/settings';

import { useOrganizationDomains } from '../hooks/useOrganizationDomains';
import { SettingsTabError } from './SettingsTabError';

const DOMAIN_STATUS_LABEL: Record<DomainActivationStatus, string> = {
  get pending_verification() {
    return t.organizations.settingsTabs.domains.statusPendingVerification;
  },
  get awaiting_routing() {
    return t.organizations.settingsTabs.domains.statusAwaitingRouting;
  },
  get active() {
    return t.organizations.settingsTabs.domains.statusActive;
  },
};

const DOMAIN_STATUS_TONE: Record<DomainActivationStatus, StatusTone> = {
  pending_verification: 'warning',
  awaiting_routing: 'info',
  active: 'success',
};

/**
 * Custom domains an organization has claimed.
 *
 * Verification is a real DNS TXT lookup, so the row shows the exact record to
 * publish. "Verified" is not "working": a verified domain is only awaiting routing
 * until ops enable proxy/TLS serving for it, and the badge says which it is.
 */
export function DomainsTab() {
  const {
    domains,
    isLoading,
    isError,
    refetch,
    canManage,
    form,
    submit,
    isAdding,
    verify,
    setPrimary,
    remove,
    isActing,
  } = useOrganizationDomains();
  const [removeTarget, setRemoveTarget] = useState<OrganizationDomain | null>(null);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (isError) return <SettingsTabError onRetry={() => void refetch()} />;

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-muted-foreground text-sm">{t.organizations.settingsTabs.domains.notice}</p>

      {canManage && (
        <FormProvider {...form}>
          <form onSubmit={submit} className="flex items-end gap-2">
            <RHFTextField<OrganizationDomainFormValues>
              name="domain"
              label={t.organizations.settingsTabs.domains.domainLabel}
              placeholder={t.organizations.settingsTabs.domains.domainPlaceholder}
              className="flex-1"
            />
            <Button type="submit" disabled={isAdding}>
              {t.organizations.settingsTabs.domains.addAction}
            </Button>
          </form>
        </FormProvider>
      )}

      {domains.length === 0 ? (
        <EmptyState
          title={t.organizations.settingsTabs.domains.emptyTitle}
          description={t.organizations.settingsTabs.domains.emptyDescription}
        />
      ) : (
        <ul className="divide-border divide-y rounded-lg border">
          {domains.map((domain) => (
            <li key={domain.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm">{domain.domain}</span>
                <StatusBadge
                  label={DOMAIN_STATUS_LABEL[domain.activation_status]}
                  tone={DOMAIN_STATUS_TONE[domain.activation_status]}
                />
                {domain.is_primary && (
                  <StatusBadge label={t.organizations.settingsTabs.domains.primary} tone="info" />
                )}
              </div>

              {/* The record is only actionable until the lookup finds it: once
                  verified, publishing it again changes nothing. */}
              {domain.activation_status === 'pending_verification' && (
                <div className="bg-muted space-y-2 rounded-md p-3">
                  <p className="text-muted-foreground text-xs">
                    {t.organizations.settingsTabs.domains.recordTitle}
                  </p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                    <dt className="text-muted-foreground">
                      {t.organizations.settingsTabs.domains.recordType}
                    </dt>
                    <dd className="font-mono">{domain.dns_record.type}</dd>
                    <dt className="text-muted-foreground">
                      {t.organizations.settingsTabs.domains.recordName}
                    </dt>
                    <dd className="font-mono break-all select-all">{domain.dns_record.name}</dd>
                    <dt className="text-muted-foreground">
                      {t.organizations.settingsTabs.domains.recordValue}
                    </dt>
                    <dd className="font-mono break-all select-all">{domain.dns_record.value}</dd>
                  </dl>
                </div>
              )}
              {domain.activation_status === 'awaiting_routing' && (
                <p className="text-muted-foreground text-xs">
                  {t.organizations.settingsTabs.domains.hintAwaitingRouting}
                </p>
              )}

              {canManage && (
                <div className="flex flex-wrap gap-2">
                  {domain.activation_status === 'pending_verification' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isActing}
                      onClick={() => verify(domain.id)}
                    >
                      {t.organizations.settingsTabs.domains.verifyAction}
                    </Button>
                  )}
                  {domain.is_verified && !domain.is_primary && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isActing}
                      onClick={() => setPrimary(domain.id)}
                    >
                      {t.organizations.settingsTabs.domains.setPrimaryAction}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isActing}
                    onClick={() => setRemoveTarget(domain)}
                  >
                    {t.organizations.settingsTabs.domains.removeAction}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        destructive
        title={format(t.organizations.settingsTabs.domains.removeConfirmTitle, {
          domain: removeTarget?.domain ?? '',
        })}
        message={t.organizations.settingsTabs.domains.removeConfirmBody}
        loading={isActing}
        onConfirm={() => {
          if (removeTarget) remove(removeTarget.id);
          setRemoveTarget(null);
        }}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      />
    </div>
  );
}
