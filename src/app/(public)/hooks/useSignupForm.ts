'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axiosPublic from '@/client/axiosPublic';
import { applyApiError } from '@/lib/apiError';
import { REGISTER_ENDPOINT, type AuthActionResponse } from '@/services/auth';
import { t } from '@/locales';
import { DEFAULT_LANDING } from '@/constants/navItems';

const copy = t.auth.signupFlow;

const signupSchema = z
  .object({
    first_name: z.string().trim().min(1, copy.validation.firstNameRequired),
    last_name: z.string().trim(),
    password: z
      .string()
      .trim()
      .min(8, { message: t.common.passwordRequirements })
      .refine((v) => /[a-z]/.test(v), { message: t.common.passwordRequirements })
      .refine((v) => /[A-Z]/.test(v), { message: t.common.passwordRequirements })
      .refine((v) => /\d/.test(v), { message: t.common.passwordRequirements }),
    confirm_password: z.string().trim().min(8, { message: t.common.passwordRequirements }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirm_password) {
      ctx.addIssue({
        path: ['confirm_password'],
        code: 'custom',
        message: copy.validation.passwordMatch,
      });
    }
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

export function useSignupForm(email: string, token: string) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { first_name: '', last_name: '', password: '', confirm_password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      await axiosPublic.post<AuthActionResponse>(REGISTER_ENDPOINT, {
        email,
        token,
        password: values.password,
        first_name: values.first_name.trim(),
        last_name: values.last_name?.trim() || '',
      });
      toast.success(copy.accountCreated);
      // Re-authenticate through the normal credentials flow rather than
      // hand-rolling a session from the register response — reuses the
      // existing authOptions/jwt callback path instead of duplicating it.
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password: values.password,
      });
      if (result?.error) {
        router.push('/login');
        return;
      }
      router.push(DEFAULT_LANDING);
    } catch (err) {
      // Field-keyed validation binds inline; email_already_registered isn't a form
      // field here (email is a prop), so it toasts — both handled by applyApiError.
      applyApiError<SignupFormValues>(err, {
        setError: form.setError,
        fields: ['first_name', 'last_name', 'password', 'confirm_password'],
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return { form, isSubmitting, onSubmit };
}
