'use client';

import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axiosPublic from '@/client/axiosPublic';
import { applyApiError } from '@/lib/apiError';
import {
  PUBLIC_SIGNUP_ENDPOINT,
  PUBLIC_SIGNUP_VERIFY_ENDPOINT,
  PUBLIC_SIGNUP_RESEND_ENDPOINT,
  type AuthActionResponse,
} from '@/services/auth';
import { t } from '@/locales';
import { DEFAULT_LANDING } from '@/constants/navItems';

const copy = t.auth.publicSignupFlow;

type Step = 'details' | 'otp';

const detailsSchema = z
  .object({
    first_name: z.string().trim().min(1, copy.validation.firstNameRequired),
    last_name: z.string().trim(),
    email: z.email({ error: t.auth.validation.email }),
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

const otpSchema = z.object({ otp: z.string().trim().length(6, copy.validation.otpLength) });

export type DetailsStepValues = z.infer<typeof detailsSchema>;
export type OtpStepValues = z.infer<typeof otpSchema>;

export function usePublicSignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('details');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const detailsForm = useForm<DetailsStepValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', confirm_password: '' },
  });
  const otpForm = useForm<OtpStepValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const onDetailsSubmit = detailsForm.handleSubmit(
    useCallback(
      async (values: DetailsStepValues) => {
        setIsLoading(true);
        try {
          const { data } = await axiosPublic.post<AuthActionResponse>(PUBLIC_SIGNUP_ENDPOINT, {
            email: values.email,
            password: values.password,
            first_name: values.first_name.trim(),
            last_name: values.last_name?.trim() || '',
          });
          setEmail(values.email);
          setPassword(values.password);
          toast.success(data.message || copy.otpSent);
          setStep('otp');
        } catch (err) {
          applyApiError<DetailsStepValues>(err, {
            setError: detailsForm.setError,
            fields: ['first_name', 'last_name', 'email', 'password', 'confirm_password'],
          });
        } finally {
          setIsLoading(false);
        }
      },
      [detailsForm]
    )
  );

  const onOtpSubmit = otpForm.handleSubmit(
    useCallback(
      async (values: OtpStepValues) => {
        setIsLoading(true);
        try {
          await axiosPublic.post<AuthActionResponse>(PUBLIC_SIGNUP_VERIFY_ENDPOINT, {
            email,
            otp: values.otp,
          });
          toast.success(copy.accountVerified);
          // Re-authenticate through the normal credentials flow rather than
          // hand-rolling a session from the verify response — same convention
          // as the invite-based signup flow (`useSignupForm`).
          const result = await signIn('credentials', { redirect: false, email, password });
          if (result?.error) {
            router.push('/login');
            return;
          }
          router.push(DEFAULT_LANDING);
        } catch (err) {
          applyApiError<OtpStepValues>(err, {
            setError: otpForm.setError,
            fields: ['otp'],
          });
        } finally {
          setIsLoading(false);
        }
      },
      [email, password, router, otpForm]
    )
  );

  const onResendOtp = useCallback(async () => {
    setIsResending(true);
    try {
      const { data } = await axiosPublic.post<AuthActionResponse>(PUBLIC_SIGNUP_RESEND_ENDPOINT, {
        email,
      });
      toast.success(data.message || copy.otpSent);
    } catch (err) {
      applyApiError(err);
    } finally {
      setIsResending(false);
    }
  }, [email]);

  return {
    step,
    email,
    isLoading,
    isResending,
    detailsForm,
    otpForm,
    onDetailsSubmit,
    onOtpSubmit,
    onResendOtp,
  };
}
