'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthMutationWithStatus } from '@/hooks/useAuthMutation';
import { PROFILE_ENDPOINT } from '@/services/profile';
import { applyApiError } from '@/lib/apiError';
import type { UserProfile } from '@/types/user';
import type { AuthEnvelope, UpdateProfilePayload } from '@/services/profile';
import { t } from '@/locales';

const copy = t.userProfile;

const profileSchema = z.object({
  first_name: z.string().trim().min(1, copy.validation.firstNameRequired),
  last_name: z.string().trim(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

function deriveNames(profile: UserProfile) {
  const rawFirst = (profile.first_name || '').trim();
  const rawLast = (profile.last_name || '').trim();
  const full = (profile.full_name || '').trim();
  const emailLocal = profile.email.split('@')[0] || '';
  let first = rawFirst;
  let last = rawLast;
  if (!first || !last) {
    const parts = full ? full.split(' ').filter(Boolean) : [];
    if (!first && parts.length > 0) first = parts[0];
    if (!last && parts.length > 1) last = parts.slice(1).join(' ');
  }
  if (!first) first = emailLocal;
  return { first_name: first, last_name: last };
}

/**
 * Owns the profile query, the "update profile" mutation, request-body
 * construction, the external-IdP 202/sync-pending branch, the NextAuth
 * session patch on success, and `applyApiError` mapping. The profile tab is a
 * pure presenter over this hook's returned state.
 */
export function useProfileForm() {
  const { data: profile, isLoading, error, refetch } = useUserProfile();
  const { data: session, update: updateSession } = useSession();
  const updateProfileMutation =
    useAuthMutationWithStatus<AuthEnvelope<UserProfile | { sync_pending?: boolean }>>();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { first_name: '', last_name: '' },
  });

  useEffect(() => {
    if (profile) form.reset(deriveNames(profile));
  }, [profile, form]);

  const submit = form.handleSubmit(async (values) => {
    if (!profile) {
      toast.error(copy.profileNotLoaded);
      return;
    }
    const isExternalIdp = profile.registration_type === 'external';
    setIsSaving(true);
    try {
      const payload: UpdateProfilePayload = {
        first_name: values.first_name.trim(),
        last_name: values.last_name?.trim() || '',
      };
      const { data: envelope, status } = await updateProfileMutation.mutateAsync({
        url: PROFILE_ENDPOINT,
        body: payload,
        method: 'patch',
        config: { validateStatus: (s) => s >= 200 && s < 300 },
      });
      const data = envelope.data;

      async function applySession(updated: UserProfile) {
        const computedFull =
          (updated.full_name && updated.full_name.trim()) ||
          [updated.first_name, updated.last_name].filter(Boolean).join(' ') ||
          updated.first_name ||
          updated.email.split('@')[0];
        await refetch();
        if (typeof updateSession === 'function') {
          await updateSession({
            user: {
              ...(session?.user ?? {}),
              first_name: updated.first_name,
              last_name: updated.last_name,
              full_name: computedFull,
            },
          });
        }
      }

      if (isExternalIdp && status === 202 && data && 'sync_pending' in data) {
        toast(copy.externalSyncPending);
      } else {
        await applySession(data as UserProfile);
        toast.success(isExternalIdp ? copy.externalSyncSuccess : copy.localProfileSuccess);
      }
    } catch (err) {
      applyApiError<ProfileFormValues>(err, {
        setError: form.setError,
        fields: ['first_name', 'last_name'],
      });
    } finally {
      setIsSaving(false);
    }
  });

  return {
    profile,
    isLoading,
    error,
    form,
    isSaving,
    submit,
  };
}
