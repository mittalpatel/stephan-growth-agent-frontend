'use client';

import { useState } from 'react';
import { FormProvider } from 'react-hook-form';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { RHFTextField } from '@/components/common/form';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from '@/lib/i18n';
import { t } from '@/locales';
import type { OrganizationDomainFormValues } from '@/lib/schemas/settings';
import type { OrganizationDomain } from '@/types/settings';

import { useOrganizationDomains } from '../hooks/useOrganizationDomains';
import { SettingsTabError } from './SettingsTabError';

/**
 * Custom domains an organization has claimed.
 *
 * The notice at the top is not boilerplate: the backend is explicit that this
 * is data-model groundwork with no routing or TLS behind it, and that
 * "verify" sets a flag rather than checking DNS. Presenting it as a working
 * custom-domain feature would be the misleading choice.
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
                  label={
                    domain.is_verified
                      ? t.organizations.settingsTabs.domains.verified
                      : t.organizations.settingsTabs.domains.unverified
                  }
                  tone={domain.is_verified ? 'success' : 'warning'}
                />
                {domain.is_primary && (
                  <StatusBadge label={t.organizations.settingsTabs.domains.primary} tone="info" />
                )}
              </div>

              {/* The token is only actionable while unverified: once the flag
                  is set, publishing the record again changes nothing. */}
              {!domain.is_verified && (
                <div className="bg-muted rounded-md p-3">
                  <p className="text-muted-foreground text-xs">
                    {t.organizations.settingsTabs.domains.tokenHint}
                  </p>
                  <p className="mt-1 font-mono text-xs break-all">{domain.verification_token}</p>
                </div>
              )}

              {canManage && (
                <div className="flex flex-wrap gap-2">
                  {!domain.is_verified && (
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
