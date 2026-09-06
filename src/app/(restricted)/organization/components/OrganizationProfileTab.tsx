'use client';

import { FormProvider } from 'react-hook-form';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { RHFTextField } from '@/components/common/form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/locales';
import type { OrganizationProfileFormValues } from '@/lib/schemas/settings';

import { useOrganizationProfileForm } from '../hooks/useOrganizationProfileForm';
import { SettingsTabError } from './SettingsTabError';

/**
 * Contact and business details. Split from Brand on the backend because this
 * is company information with no bearing on how anything renders, and the two
 * are expected to diverge on who may edit them.
 */
export function OrganizationProfileTab() {
  const { can } = usePermissions();
  const canManage = can('organization', 'manage');
  const { form, submit, isPending, isLoading, isError, refetch } = useOrganizationProfileForm();

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError) return <SettingsTabError onRetry={() => void refetch()} />;

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="max-w-lg space-y-4">
        <RHFTextField<OrganizationProfileFormValues>
          name="legal_name"
          label={t.organizations.settingsTabs.profile.legalNameLabel}
          placeholder={t.organizations.settingsTabs.profile.legalNamePlaceholder}
          disabled={!canManage}
        />
        <RHFTextField<OrganizationProfileFormValues>
          name="website"
          label={t.organizations.settingsTabs.profile.websiteLabel}
          placeholder={t.organizations.settingsTabs.profile.websitePlaceholder}
          disabled={!canManage}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <RHFTextField<OrganizationProfileFormValues>
            name="contact_email"
            label={t.organizations.settingsTabs.profile.contactEmailLabel}
            type="email"
            disabled={!canManage}
          />
          <RHFTextField<OrganizationProfileFormValues>
            name="contact_phone"
            label={t.organizations.settingsTabs.profile.contactPhoneLabel}
            disabled={!canManage}
          />
        </div>

        <div className="border-border space-y-4 border-t pt-4">
          <h3 className="text-sm font-medium">
            {t.organizations.settingsTabs.profile.addressTitle}
          </h3>
          <RHFTextField<OrganizationProfileFormValues>
            name="address_line1"
            label={t.organizations.settingsTabs.profile.addressLine1Label}
            disabled={!canManage}
          />
          <RHFTextField<OrganizationProfileFormValues>
            name="address_line2"
            label={t.organizations.settingsTabs.profile.addressLine2Label}
            disabled={!canManage}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <RHFTextField<OrganizationProfileFormValues>
              name="city"
              label={t.organizations.settingsTabs.profile.cityLabel}
              disabled={!canManage}
            />
            <RHFTextField<OrganizationProfileFormValues>
              name="state"
              label={t.organizations.settingsTabs.profile.stateLabel}
              disabled={!canManage}
            />
            <RHFTextField<OrganizationProfileFormValues>
              name="postal_code"
              label={t.organizations.settingsTabs.profile.postalCodeLabel}
              disabled={!canManage}
            />
            <RHFTextField<OrganizationProfileFormValues>
              name="country"
              label={t.organizations.settingsTabs.profile.countryLabel}
              disabled={!canManage}
            />
          </div>
        </div>

        {canManage && (
          <Button type="submit" disabled={isPending}>
            {t.buttons.save}
          </Button>
        )}
      </form>
    </FormProvider>
  );
}
