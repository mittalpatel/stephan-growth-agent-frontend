'use client';

import { FormProvider } from 'react-hook-form';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { RHFSwitchField } from '@/components/common/form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/locales';
import type { FeatureFlagsFormValues } from '@/lib/schemas/settings';

import { useFeatureFlagsForm } from '../hooks/useFeatureFlagsForm';
import { SettingsTabError } from './SettingsTabError';

/**
 * Per-organization feature toggles, stored in `Organization.settings` behind
 * a backend allowlist. Adding a flag is a two-sided change: the key has to
 * exist in `FEATURE_FLAG_KEYS` or the save is rejected outright.
 */
export function FeatureFlagsTab() {
  const { can } = usePermissions();
  const canManage = can('organization', 'manage');
  const { form, submit, isPending, isLoading, isError, refetch } = useFeatureFlagsForm();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError) return <SettingsTabError onRetry={() => void refetch()} />;

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="max-w-lg space-y-4">
        <p className="text-muted-foreground text-sm">
          {t.organizations.settingsTabs.features.description}
        </p>
        <RHFSwitchField<FeatureFlagsFormValues>
          name="agents_beta"
          label={t.organizations.settingsTabs.features.agentsBeta}
          disabled={!canManage}
        />
        <RHFSwitchField<FeatureFlagsFormValues>
          name="advanced_analytics"
          label={t.organizations.settingsTabs.features.advancedAnalytics}
          disabled={!canManage}
        />
        <RHFSwitchField<FeatureFlagsFormValues>
          name="level_2_outreach"
          label={t.organizations.settingsTabs.features.level2Outreach}
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
