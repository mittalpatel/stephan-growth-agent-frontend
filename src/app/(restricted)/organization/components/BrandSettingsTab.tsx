'use client';

import { FormProvider } from 'react-hook-form';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { RHFTextField } from '@/components/common/form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/locales';
import type { BrandSettingsFormValues } from '@/lib/schemas/settings';

import { useBrandSettingsForm } from '../hooks/useBrandSettingsForm';
import { SettingsTabError } from './SettingsTabError';

export function BrandSettingsTab() {
  const { can } = usePermissions();
  const canManage = can('organization', 'manage');
  const { form, submit, isPending, isLoading, isError, refetch } = useBrandSettingsForm();

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (isError) return <SettingsTabError onRetry={() => void refetch()} />;

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="max-w-lg space-y-4">
        <RHFTextField<BrandSettingsFormValues>
          name="logo_url"
          label={t.organizations.settingsTabs.brand.logoUrlLabel}
          placeholder={t.organizations.settingsTabs.brand.logoUrlPlaceholder}
          disabled={!canManage}
        />
        <RHFTextField<BrandSettingsFormValues>
          name="color_primary"
          label={t.organizations.settingsTabs.brand.colorLabel}
          placeholder="#0B1E3D"
          disabled={!canManage}
        />
        <RHFTextField<BrandSettingsFormValues>
          name="tone_of_voice"
          label={t.organizations.settingsTabs.brand.toneLabel}
          placeholder={t.organizations.settingsTabs.brand.tonePlaceholder}
          disabled={!canManage}
        />
        <RHFTextField<BrandSettingsFormValues>
          name="company_description"
          label={t.organizations.settingsTabs.brand.descriptionLabel}
          placeholder={t.organizations.settingsTabs.brand.descriptionPlaceholder}
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
