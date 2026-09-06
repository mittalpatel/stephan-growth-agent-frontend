'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { aiPreferencesSchema, type AiPreferencesFormValues } from '@/lib/schemas/settings';
import { SETTINGS_AI_PREFERENCES_ENDPOINT, SETTINGS_AI_PREFERENCES_KEY } from '@/services/settings';
import type { ApiResponse } from '@/types/api';
import type { AiPreferences } from '@/types/settings';
import { t } from '@/locales';

/**
 * The AI-preferences settings tab.
 *
 * `form.reset` picks the three editable fields explicitly rather than
 * spreading the response: the serializer also returns `id`/`updated_at`
 * (read-only), and spreading would park them in form state and send them
 * straight back in the PATCH body on every save.
 */
export function useAiPreferencesForm() {
  const query = useAuthQuery<ApiResponse<AiPreferences>>(
    [SETTINGS_AI_PREFERENCES_KEY],
    SETTINGS_AI_PREFERENCES_ENDPOINT
  );
  const { mutateAsync, isPending } = useAuthMutation();

  const form = useForm<AiPreferencesFormValues>({
    resolver: zodResolver(aiPreferencesSchema),
    defaultValues: {
      require_approval_before_outreach: true,
      require_approval_before_publishing: true,
      allow_auto_crm_updates: false,
    },
  });

  const prefs = query.data?.data;
  useEffect(() => {
    if (!prefs) return;
    form.reset({
      require_approval_before_outreach: prefs.require_approval_before_outreach,
      require_approval_before_publishing: prefs.require_approval_before_publishing,
      allow_auto_crm_updates: prefs.allow_auto_crm_updates,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({
        url: SETTINGS_AI_PREFERENCES_ENDPOINT,
        method: 'patch',
        body: values,
      });
      toast.success(t.organizations.settingsTabs.aiPreferences.saved);
      await query.refetch();
    } catch (error) {
      applyApiError<AiPreferencesFormValues>(error, {
        setError: form.setError,
        fields: [
          'require_approval_before_outreach',
          'require_approval_before_publishing',
          'allow_auto_crm_updates',
        ],
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
