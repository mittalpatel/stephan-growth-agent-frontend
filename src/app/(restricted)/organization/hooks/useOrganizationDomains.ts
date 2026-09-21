'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { getAxiosError } from '@/lib/helper';
import {
  organizationDomainSchema,
  type OrganizationDomainFormValues,
} from '@/lib/schemas/settings';
import {
  SETTINGS_DOMAINS_ENDPOINT,
  SETTINGS_DOMAINS_KEY,
  settingsDomainDetailEndpoint,
  settingsDomainSetPrimaryEndpoint,
  settingsDomainVerifyEndpoint,
} from '@/services/settings';
import type { ApiResponse } from '@/types/api';
import type { OrganizationDomain } from '@/types/settings';
import { t } from '@/locales';

/**
 * The organization's claimed custom domains.
 *
 * `verify` performs a real DNS TXT lookup and fails with a message until the record
 * is published. A verified domain is only "awaiting routing" until ops enable
 * proxy/TLS serving for it, and the UI shows which state each domain is in rather
 * than treating "verified" as "working".
 *
 * The list is an unpaginated `GET` returning a plain array, unlike the
 * paginated list endpoints elsewhere, so there is no toolbar or pagination
 * here.
 */
export function useOrganizationDomains() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canView = can('organization', 'view');
  const canManage = can('organization', 'manage');

  const query = useAuthQuery<ApiResponse<OrganizationDomain[]>>(
    [SETTINGS_DOMAINS_KEY],
    SETTINGS_DOMAINS_ENDPOINT,
    { enabled: canView }
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: [SETTINGS_DOMAINS_KEY] });
  };

  // No `onError`: the add form awaits this and binds `domain` inline through
  // `applyApiError`, so a toast here would double-report. The 409
  // `domain_already_claimed` case has no field in its payload, which
  // `applyApiError` already falls back to toasting.
  const addMutation = useAuthMutation<
    ApiResponse<OrganizationDomain>,
    OrganizationDomainFormValues
  >({
    onSuccess: () => {
      toast.success(t.organizations.settingsTabs.domains.added);
      invalidate();
    },
  });

  const actionMutation = useAuthMutation<ApiResponse<OrganizationDomain | null>, undefined>({
    onSuccess: (response) => {
      toast.success(response.message);
      invalidate();
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  const form = useForm<OrganizationDomainFormValues>({
    resolver: zodResolver(organizationDomainSchema),
    defaultValues: { domain: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await addMutation.mutateAsync({ url: SETTINGS_DOMAINS_ENDPOINT, body: values });
      form.reset({ domain: '' });
    } catch (error) {
      applyApiError<OrganizationDomainFormValues>(error, {
        setError: form.setError,
        fields: ['domain'],
      });
    }
  });

  return {
    domains: query.data?.data ?? [],
    isLoading: canView && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    canManage,

    form,
    submit,
    isAdding: addMutation.isPending,

    // Fire-and-forget: `mutate` never rejects, and `onError` above already
    // reports the backend's own message (`already_verified`, `not_verified`).
    verify: (id: string) => actionMutation.mutate({ url: settingsDomainVerifyEndpoint(id) }),
    setPrimary: (id: string) =>
      actionMutation.mutate({ url: settingsDomainSetPrimaryEndpoint(id) }),
    remove: (id: string) =>
      actionMutation.mutate({ url: settingsDomainDetailEndpoint(id), method: 'delete' }),
    isActing: actionMutation.isPending,
  };
}
