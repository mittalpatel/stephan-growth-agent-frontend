'use client';

import { FormProvider } from 'react-hook-form';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { RHFSwitchField } from '@/components/common/form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/locales';
import type { SecuritySettingsFormValues } from '@/lib/schemas/settings';

import { useSecuritySettingsForm } from '../hooks/useSecuritySettingsForm';

export function SecuritySettingsTab() {
  const { can } = usePermissions();
  const canManage = can('organization', 'manage');
  const { form, submit, isPending, isLoading } = useSecuritySettingsForm();

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="max-w-lg space-y-4">
        <RHFSwitchField<SecuritySettingsFormValues>
          name="require_2fa"
          label={t.organizations.settingsTabs.security.require2fa}
          disabled={!canManage}
        />
        <RHFSwitchField<SecuritySettingsFormValues>
          name="log_all_agent_actions"
          label={t.organizations.settingsTabs.security.logAllAgentActions}
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
