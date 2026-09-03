'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { SAME_ORIGIN_ROUTE } from '@/client/axiosAuth';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { CHANGE_PASSWORD_ROUTE } from '@/services/profile';
import { applyApiError } from '@/lib/apiError';
import type { AuthEnvelope, ChangePasswordPayload } from '@/services/profile';
import { t } from '@/locales';

const copy = t.userProfile;

const passwordSchema = z
  .object({
    current_password: z.string().trim().min(1, copy.validation.currentPasswordRequired),
    new_password: z
      .string()
      .trim()
      .min(8, { message: t.common.passwordRequirements })
      .refine((v) => /[a-z]/.test(v), { message: t.common.passwordRequirements })
      .refine((v) => /[A-Z]/.test(v), { message: t.common.passwordRequirements })
      .refine((v) => /\d/.test(v), { message: t.common.passwordRequirements }),
    confirm_password: z.string().trim().min(8, { message: t.common.passwordRequirements }),
  })
  .superRefine((data, ctx) => {
    if (data.new_password !== data.confirm_password) {
      ctx.addIssue({
        path: ['confirm_password'],
        code: 'custom',
        message: copy.validation.passwordMatch,
      });
    }
    if (data.current_password === data.new_password) {
      ctx.addIssue({
        path: ['new_password'],
        code: 'custom',
        message: copy.validation.passwordDifferent,
      });
    }
  });

export type PasswordFormValues = z.infer<typeof passwordSchema>;

type Options = Readonly<{
  isExternalIdp: boolean;
  hasProfile: boolean;
}>;

/**
 * Owns the "change password" mutation, request-body construction, and
 * `applyApiError` mapping (the backend keys field-scoped domain errors by
 * field, so no `codeFieldMap` is needed here).
 */
export function useChangePasswordForm({ isExternalIdp, hasProfile }: Options) {
  const [isSaving, setIsSaving] = useState(false);
  const mutation = useAuthMutation<AuthEnvelope<null>>();

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    if (!hasProfile) {
      toast.error(copy.profileNotLoaded);
      return;
    }
    setIsSaving(true);
    try {
      const payload: ChangePasswordPayload = {
        current_password: values.current_password,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      };
      // Through a same-origin route, not the backend directly. The backend
      // revokes every refresh token the account holds on a password change —
      // rotation renews a stolen token rather than expiring it, so leaving other
      // sessions alive would protect nothing — which includes this session's.
      // The route absorbs the replacement pair into the httpOnly cookie so no
      // token reaches client JavaScript; see api/auth/change-password/route.ts.
      const envelope = await mutation.mutateAsync({
        url: CHANGE_PASSWORD_ROUTE,
        body: payload,
        method: 'post',
        config: SAME_ORIGIN_ROUTE,
      });
      toast.success(
        envelope?.message ||
          (isExternalIdp ? copy.externalPasswordSuccess : copy.localPasswordSuccess)
      );
      form.reset({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      // The backend keys field-scoped domain errors by field (wrong_password →
      // current_password, same_password → new_password), so they bind inline
      // automatically — no codeFieldMap needed. Anything form-level/null toasts.
      applyApiError<PasswordFormValues>(err, {
        setError: form.setError,
        fields: ['current_password', 'new_password', 'confirm_password'],
      });
    } finally {
      setIsSaving(false);
    }
  });

  return { form, isSaving, submit };
}
