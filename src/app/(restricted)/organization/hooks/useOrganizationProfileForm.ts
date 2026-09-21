'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import {
  organizationProfileSchema,
  type OrganizationProfileFormValues,
} from '@/lib/schemas/settings';
import { SETTINGS_PROFILE_ENDPOINT, SETTINGS_PROFILE_KEY } from '@/services/settings';
import type { ApiResponse } from '@/types/api';
import type { OrganizationProfile } from '@/types/settings';
import { t } from '@/locales';

const EMPTY: OrganizationProfileFormValues = {
  website: '',
  contact_email: '',
};

/**
 * The organization's website and contact email.
 *
 * Same shape as `useBrandSettingsForm` deliberately: one query per settings
 * tab, each with its own cache key, so saving one tab never invalidates
 * another's read. The backend creates the row lazily
 * (`OrganizationProfile.for_organization`), so a first visit returns a fully
 * blank record rather than a 404.
 */
export function useOrganizationProfileForm() {
  const query = useAuthQuery<ApiResponse<OrganizationProfile>>(
    [SETTINGS_PROFILE_KEY],
    SETTINGS_PROFILE_ENDPOINT
  );
  const { mutateAsync, isPending } = useAuthMutation();

  const form = useForm<OrganizationProfileFormValues>({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: EMPTY,
  });

  const profile = query.data?.data;
  useEffect(() => {
    if (!profile) return;
    form.reset({
      website: profile.website,
      contact_email: profile.contact_email,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({ url: SETTINGS_PROFILE_ENDPOINT, method: 'patch', body: values });
      toast.success(t.organizations.settingsTabs.contact.saved);
      await query.refetch();
    } catch (error) {
      applyApiError<OrganizationProfileFormValues>(error, {
        setError: form.setError,
        fields: Object.keys(EMPTY) as (keyof OrganizationProfileFormValues)[],
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
