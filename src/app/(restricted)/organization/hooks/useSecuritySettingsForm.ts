'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { securitySettingsSchema, type SecuritySettingsFormValues } from '@/lib/schemas/settings';
import { SETTINGS_SECURITY_ENDPOINT, SETTINGS_SECURITY_KEY } from '@/services/settings';
import type { ApiResponse } from '@/types/api';
import type { SecuritySettings } from '@/types/settings';
import { t } from '@/locales';

/** The security settings tab. See `useAiPreferencesForm` for why `reset` picks fields explicitly. */
export function useSecuritySettingsForm() {
  const query = useAuthQuery<ApiResponse<SecuritySettings>>(
    [SETTINGS_SECURITY_KEY],
    SETTINGS_SECURITY_ENDPOINT
  );
  const { mutateAsync, isPending } = useAuthMutation();

  const form = useForm<SecuritySettingsFormValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: { require_2fa: false, log_all_agent_actions: false },
  });

  const security = query.data?.data;
  useEffect(() => {
    if (!security) return;
    form.reset({
      require_2fa: security.require_2fa,
      log_all_agent_actions: security.log_all_agent_actions,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [security]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({ url: SETTINGS_SECURITY_ENDPOINT, method: 'patch', body: values });
      toast.success(t.organizations.settingsTabs.security.saved);
      await query.refetch();
    } catch (error) {
      applyApiError<SecuritySettingsFormValues>(error, {
        setError: form.setError,
        fields: ['require_2fa', 'log_all_agent_actions'],
      });
    }
  });

  return {
    form,
    submit,
    isPending,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
