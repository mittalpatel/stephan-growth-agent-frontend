'use client';

import { useState } from 'react';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { safeRedirect } from '@/lib/auth/safeRedirect';
import { t } from '@/locales';

import { saveMfaChallenge } from './mfaChallengeStorage';

export const loginSchema = z.object({
  email: z.email({ error: t.auth.validation.email }),
  password: z.string().trim().min(5, { error: t.auth.validation.passwordLength }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export function useLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl');

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(
    useCallback(
      async (values: LoginFormValues) => {
        if (isLoading) return;
        try {
          setIsLoading(true);
          const response = await signIn('credentials', { ...values, redirect: false });

          if (!response?.ok && response?.error?.startsWith('MFA_REQUIRED::')) {
            const challenge = response.error.replace('MFA_REQUIRED::', '').trim();
            saveMfaChallenge(challenge, callbackUrl);
            router.push('/login/otp');
            return;
          }

          if (response?.ok) {
            router.push(safeRedirect(callbackUrl));
            return;
          }
          let msg = response?.error ?? t.auth.validation.signInError;
          if (msg.startsWith('LOGIN_ERROR::')) msg = msg.replace('LOGIN_ERROR::', '').trim();
          toast.error(msg);
        } finally {
          setIsLoading(false);
        }
      },
      [callbackUrl, isLoading, router]
    )
  );

  return {
    form,
    isLoading,
    showPassword,
    toggleShowPassword: () => setShowPassword((p) => !p),
    onSubmit,
  };
}
