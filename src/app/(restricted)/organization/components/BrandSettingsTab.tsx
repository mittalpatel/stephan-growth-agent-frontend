'use client';

import { FormProvider } from 'react-hook-form';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { RHFTextField } from '@/components/common/form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/locales';
import type { BrandSettingsFormValues } from '@/lib/schemas/settings';

import { BrandImageField } from './BrandImageField';
import { useBrandSettingsForm } from '../hooks/useBrandSettingsForm';
import { SettingsTabError } from './SettingsTabError';

export function BrandSettingsTab() {
  const { can } = usePermissions();
  const canManage = can('organization', 'manage');
  const { form, submit, isPending, isLoading, isError, refetch, logoUrl, faviconUrl } =
    useBrandSettingsForm();

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (isError) return <SettingsTabError onRetry={() => void refetch()} />;

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="max-w-lg space-y-4">
        <BrandImageField
          kind="logo"
          label={t.organizations.settingsTabs.brand.logoLabel}
          hint={t.organizations.settingsTabs.brand.logoHint}
          url={logoUrl}
          canManage={canManage}
        />
        <BrandImageField
          kind="favicon"
          label={t.organizations.settingsTabs.brand.faviconLabel}
          hint={t.organizations.settingsTabs.brand.faviconHint}
          url={faviconUrl}
          canManage={canManage}
        />
        <RHFTextField<BrandSettingsFormValues>
          name="display_name"
          label={t.organizations.settingsTabs.brand.displayNameLabel}
          placeholder={t.organizations.settingsTabs.brand.displayNamePlaceholder}
          description={t.organizations.settingsTabs.brand.displayNameHint}
          disabled={!canManage}
        />
        <RHFTextField<BrandSettingsFormValues>
          name="color_primary"
          label={t.organizations.settingsTabs.brand.colorLabel}
          placeholder={t.organizations.settingsTabs.brand.colorPrimaryPlaceholder}
          disabled={!canManage}
        />
        <RHFTextField<BrandSettingsFormValues>
          name="email_reply_to"
          label={t.organizations.settingsTabs.brand.emailReplyToLabel}
          type="email"
          placeholder={t.organizations.settingsTabs.brand.emailReplyToPlaceholder}
          disabled={!canManage}
        />

        {canManage && (
          <Button type="submit" disabled={isPending}>
            {t.buttons.save}
          </Button>
        )}
      </form>
    </FormProvider>
  );
}
