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

  useEffect(() => {
    const security = query.data?.data;
    if (security) form.reset(security);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data?.data]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({ url: SETTINGS_SECURITY_ENDPOINT, method: 'patch', body: values });
      toast.success(t.organizations.settingsTabs.security.saved);
      await query.refetch();
    } catch (error) {
      applyApiError(error);
    }
  });

  return { form, submit, isPending, isLoading: query.isLoading };
}
