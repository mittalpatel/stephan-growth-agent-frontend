'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { brandSettingsSchema, type BrandSettingsFormValues } from '@/lib/schemas/settings';
import {
  SETTINGS_BRAND_ENDPOINT,
  SETTINGS_BRAND_KEY,
  SETTINGS_BRAND_SUMMARY_KEY,
} from '@/services/settings';
import type { ApiResponse } from '@/types/api';
import type { BrandSettings } from '@/types/settings';
import { t } from '@/locales';

export function useBrandSettingsForm() {
  const queryClient = useQueryClient();
  const query = useAuthQuery<ApiResponse<BrandSettings>>(
    [SETTINGS_BRAND_KEY],
    SETTINGS_BRAND_ENDPOINT
  );
  const { mutateAsync, isPending } = useAuthMutation();

  const form = useForm<BrandSettingsFormValues>({
    resolver: zodResolver(brandSettingsSchema),
    defaultValues: {
      color_primary: '',
      display_name: '',
      email_reply_to: '',
    },
  });

  const brand = query.data?.data;
  useEffect(() => {
    if (!brand) return;
    // `keepDirtyValues`: uploading or removing a logo replaces the cached brand row,
    // which must not wipe text the user has typed but not yet saved.
    form.reset(
      {
        color_primary: brand.color_primary,
        display_name: brand.display_name,
        email_reply_to: brand.email_reply_to,
      },
      { keepDirtyValues: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({ url: SETTINGS_BRAND_ENDPOINT, method: 'patch', body: values });
      toast.success(t.organizations.settingsTabs.brand.saved);
      await query.refetch();
      // The app shell reads the member-readable summary, not this query.
      await queryClient.invalidateQueries({ queryKey: [SETTINGS_BRAND_SUMMARY_KEY] });
    } catch (error) {
      applyApiError<BrandSettingsFormValues>(error, {
        setError: form.setError,
        fields: ['color_primary', 'display_name', 'email_reply_to'],
      });
    }
  });

  return {
    form,
    submit,
    isPending,
    logoUrl: brand?.logo_url ?? '',
    faviconUrl: brand?.favicon_url ?? '',
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
