'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import { organizationMembersEndpoint } from '@/services/organizations';
import { t } from '@/locales';

/**
 * Field names match the backend serializer exactly (`email`, `role_id`), which is
 * what lets `applyApiError` bind a field-keyed 400 to the right input with no
 * code-to-field mapping table.
 */
const schema = z.object({
  email: z.string().trim().email(),
  role_id: z.string().min(1),
});

export type InviteMemberFormValues = z.infer<typeof schema>;

type Options = Readonly<{
  onSuccess: () => void;
}>;

/** Owns the "invite member" mutation and request-body construction. */
export function useInviteMemberForm({ onSuccess }: Options) {
  const { organization } = useOrganization();
  const { mutateAsync, isPending } = useAuthMutation();

  const form = useForm<InviteMemberFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role_id: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    if (!organization) return;
    try {
      await mutateAsync({
        url: organizationMembersEndpoint(organization.id),
        body: {
          ...values,
          // The backend validates this against SIGNUP_LINK_DOMAINS, so it cannot
          // be used to aim an invite link somewhere unintended.
          domain: window.location.origin,
        },
      });
      // Both outcomes are "invited, not yet a member" now — an existing account
      // accepts in-app (see /invites), a new one gets an emailed signup link.
      // Neither is added on the spot, so one message covers both.
      toast.success(t.organizations.invite.sent);
      form.reset();
      onSuccess();
    } catch (error) {
      // `fields` is what stops a backend key that isn't a form field producing a
      // phantom inline error on an input that doesn't exist — it gets toasted instead.
      applyApiError<InviteMemberFormValues>(error, {
        setError: form.setError,
        fields: ['email', 'role_id'],
      });
    }
  });

  return { form, isPending, submit };
}
