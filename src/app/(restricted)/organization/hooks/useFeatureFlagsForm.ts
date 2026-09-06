'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { featureFlagsSchema, type FeatureFlagsFormValues } from '@/lib/schemas/settings';
import { SETTINGS_FEATURES_ENDPOINT, SETTINGS_FEATURES_KEY } from '@/services/settings';
import type { ApiResponse } from '@/types/api';
import type { FeatureFlags } from '@/types/settings';
import { t } from '@/locales';

/**
 * The organization's feature toggles.
 *
 * `GET` returns every allowlisted key defaulted to `false`, so the form never
 * has to reason about a missing flag. `PATCH` merges rather than replaces,
 * but this form submits all three anyway: it renders all three, so a partial
 * body would only make the request harder to reason about, not smaller.
 *
 * Unknown keys and non-boolean values are rejected by the backend as
 * `non_field_errors`, which has no field to bind to. `applyApiError` toasts
 * those, which is the right outcome for a validation failure that the schema
 * here should have made unreachable in the first place.
 */
export function useFeatureFlagsForm() {
  const query = useAuthQuery<ApiResponse<FeatureFlags>>(
    [SETTINGS_FEATURES_KEY],
    SETTINGS_FEATURES_ENDPOINT
  );
  const { mutateAsync, isPending } = useAuthMutation();

  const form = useForm<FeatureFlagsFormValues>({
    resolver: zodResolver(featureFlagsSchema),
    defaultValues: {
      agents_beta: false,
      advanced_analytics: false,
      level_2_outreach: false,
    },
  });

  const flags = query.data?.data;
  useEffect(() => {
    if (!flags) return;
    form.reset({
      agents_beta: flags.agents_beta,
      advanced_analytics: flags.advanced_analytics,
      level_2_outreach: flags.level_2_outreach,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flags]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({ url: SETTINGS_FEATURES_ENDPOINT, method: 'patch', body: values });
      toast.success(t.organizations.settingsTabs.features.saved);
      await query.refetch();
    } catch (error) {
      applyApiError<FeatureFlagsFormValues>(error, {
        setError: form.setError,
        fields: ['agents_beta', 'advanced_analytics', 'level_2_outreach'],
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
