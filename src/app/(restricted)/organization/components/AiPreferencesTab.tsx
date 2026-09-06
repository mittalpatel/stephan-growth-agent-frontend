'use client';

import { FormProvider } from 'react-hook-form';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { RHFSwitchField } from '@/components/common/form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/locales';
import type { AiPreferencesFormValues } from '@/lib/schemas/settings';

import { useAiPreferencesForm } from '../hooks/useAiPreferencesForm';

export function AiPreferencesTab() {
  const { can } = usePermissions();
  const canManage = can('organization', 'manage');
  const { form, submit, isPending, isLoading } = useAiPreferencesForm();

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="max-w-lg space-y-4">
        <RHFSwitchField<AiPreferencesFormValues>
          name="require_approval_before_outreach"
          label={t.organizations.settingsTabs.aiPreferences.requireApprovalOutreach}
          disabled={!canManage}
        />
        <RHFSwitchField<AiPreferencesFormValues>
          name="require_approval_before_publishing"
          label={t.organizations.settingsTabs.aiPreferences.requireApprovalPublishing}
          disabled={!canManage}
        />
        <RHFSwitchField<AiPreferencesFormValues>
          name="allow_auto_crm_updates"
          label={t.organizations.settingsTabs.aiPreferences.allowAutoCrmUpdates}
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
