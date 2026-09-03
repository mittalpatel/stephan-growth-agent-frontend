'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import { organizationDetailEndpoint } from '@/services/organizations';
import { DEFAULT_LANDING } from '@/constants/navItems';
import { t } from '@/locales';

const schema = z.object({
  name: z.string().trim().min(1).max(200),
});

export type OrganizationSettingsFormValues = z.infer<typeof schema>;

/**
 * Owns both the "rename organization" and "delete organization" mutations for
 * the settings screen — they share one `useAuthMutation` instance in the
 * original component, so this hook keeps that shape rather than splitting it
 * into two hooks for one screen.
 */
export function useOrganizationSettingsForm() {
  const { organization } = useOrganization();
  const router = useRouter();
  const { mutateAsync, isPending } = useAuthMutation();

  const form = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: organization?.name ?? '' },
  });

  const submit = form.handleSubmit(async (values) => {
    if (!organization) return;
    try {
      await mutateAsync({
        url: organizationDetailEndpoint(organization.id),
        method: 'patch',
        body: values,
      });
      toast.success(t.organizations.settings.saved);
    } catch (error) {
      applyApiError<OrganizationSettingsFormValues>(error, {
        setError: form.setError,
        fields: ['name'],
      });
    }
  });

  const deleteOrganization = async (onDone: () => void) => {
    if (!organization) return;
    try {
      await mutateAsync({ url: organizationDetailEndpoint(organization.id), method: 'delete' });
      toast.success(t.organizations.dangerZone.deleted);
      // The session's active organization no longer exists; a full navigation
      // re-runs the restricted layout, which re-reads the session from the server
      // rather than trusting the now-stale client copy.
      router.push(DEFAULT_LANDING);
      router.refresh();
    } catch (error) {
      applyApiError(error);
    } finally {
      onDone();
    }
  };

  return { organization, form, isPending, submit, deleteOrganization };
}
