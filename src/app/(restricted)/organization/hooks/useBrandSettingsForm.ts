'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { brandSettingsSchema, type BrandSettingsFormValues } from '@/lib/schemas/settings';
import { SETTINGS_BRAND_ENDPOINT, SETTINGS_BRAND_KEY } from '@/services/settings';
import type { ApiResponse } from '@/types/api';
import type { BrandSettings } from '@/types/settings';
import { t } from '@/locales';

export function useBrandSettingsForm() {
  const query = useAuthQuery<ApiResponse<BrandSettings>>(
    [SETTINGS_BRAND_KEY],
    SETTINGS_BRAND_ENDPOINT
  );
  const { mutateAsync, isPending } = useAuthMutation();

  const form = useForm<BrandSettingsFormValues>({
    resolver: zodResolver(brandSettingsSchema),
    defaultValues: {
      logo_url: '',
      favicon_url: '',
      color_primary: '',
      color_secondary: '',
      tone_of_voice: '',
      company_description: '',
      display_name: '',
      email_from_name: '',
      email_reply_to: '',
    },
  });

  const brand = query.data?.data;
  useEffect(() => {
    if (!brand) return;
    form.reset({
      logo_url: brand.logo_url,
      favicon_url: brand.favicon_url,
      color_primary: brand.color_primary,
      color_secondary: brand.color_secondary,
      tone_of_voice: brand.tone_of_voice,
      company_description: brand.company_description,
      display_name: brand.display_name,
      email_from_name: brand.email_from_name,
      email_reply_to: brand.email_reply_to,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({ url: SETTINGS_BRAND_ENDPOINT, method: 'patch', body: values });
      toast.success(t.organizations.settingsTabs.brand.saved);
      await query.refetch();
    } catch (error) {
      applyApiError<BrandSettingsFormValues>(error, {
        setError: form.setError,
        fields: [
          'logo_url',
          'favicon_url',
          'color_primary',
          'color_secondary',
          'tone_of_voice',
          'company_description',
          'display_name',
          'email_from_name',
          'email_reply_to',
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
