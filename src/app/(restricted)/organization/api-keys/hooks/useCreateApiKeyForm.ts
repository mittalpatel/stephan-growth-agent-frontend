'use client';

import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { usePermissionCatalog } from '@/app/(restricted)/organization/hooks/usePermissionCatalog';
import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import { organizationApiKeysEndpoint, type ApiKeyCreateResponse } from '@/services/apiKeys';
import type { ApiResponse } from '@/types/api';
import { t } from '@/locales';

const copy = t.organizations.apiKeys.create;

/**
 * Field names match `ApiKeyWriteSerializer` exactly (`name`, `permission_codes`,
 * `expires_at`), which is what lets `applyApiError` bind a field-keyed 400
 * straight to the input.
 */
const schema = z.object({
  name: z.string().trim().min(1),
  permission_codes: z.array(z.string()).min(1, copy.permissionsRequired),
  expires_at: z.string().optional(),
});

export type ApiKeyFormValues = z.infer<typeof schema>;

type Options = Readonly<{
  onCreated: (key: ApiKeyCreateResponse) => void;
}>;

/**
 * Owns the "create API key" mutation, the permission-catalog restriction, and
 * the request-body mapping (ISO date, or `null` when left blank). The dialog
 * component is a pure presenter over this hook's returned state.
 *
 * The permission picker's catalog is filtered to codes the acting user
 * currently holds *before* it ever reaches `PermissionTransferList`, not merely
 * grayed out there: the plan is for the client to offer only what the server's
 * ceiling (`RBACService.assert_within_ceiling`) would actually accept, so there
 * is nothing in this list for a user to click that the backend would then
 * reject with a 400.
 */
export function useCreateApiKeyForm({ onCreated }: Options) {
  const { organization } = useOrganization();
  const { mutateAsync, isPending } = useAuthMutation<ApiResponse<ApiKeyCreateResponse>>();
  const { catalog, isCatalogLoading, isGrantable } = usePermissionCatalog();

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', permission_codes: [], expires_at: '' },
  });

  const grantableCatalog = useMemo(
    () => catalog.filter((permission) => isGrantable(permission.code)),
    [catalog, isGrantable]
  );

  const selectedCodes = useWatch({ control: form.control, name: 'permission_codes' }) ?? [];

  const submit = form.handleSubmit(async (values) => {
    if (!organization) return;
    try {
      const created = await mutateAsync({
        url: organizationApiKeysEndpoint(organization.id),
        body: {
          name: values.name,
          permission_codes: values.permission_codes,
          expires_at: values.expires_at ? new Date(values.expires_at).toISOString() : null,
        },
      });
      form.reset();
      onCreated(created.data);
    } catch (error) {
      applyApiError<ApiKeyFormValues>(error, {
        setError: form.setError,
        fields: ['name', 'permission_codes', 'expires_at'],
        fallbackMessage: copy.createFailed,
      });
    }
  });

  return {
    form,
    isPending,
    submit,
    isCatalogLoading,
    grantableCatalog,
    selectedCodes,
  };
}
