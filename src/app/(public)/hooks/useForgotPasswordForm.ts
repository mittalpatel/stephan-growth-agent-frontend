'use client';

import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import axiosPublic from '@/client/axiosPublic';
import { applyApiError } from '@/lib/apiError';
import {
  FORGOT_PASSWORD_ENDPOINT,
  VERIFY_RESET_OTP_ENDPOINT,
  RESET_PASSWORD_ENDPOINT,
  type AuthActionResponse,
} from '@/services/auth';
import { t } from '@/locales';

const copy = t.auth.forgotPasswordFlow;

type Step = 'email' | 'otp' | 'password';

const emailSchema = z.object({ email: z.email({ error: t.auth.validation.email }) });
const otpSchema = z.object({ otp: z.string().trim().length(6, copy.validation.otpLength) });
const passwordSchema = z
  .object({
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
  });

export type EmailStepValues = z.infer<typeof emailSchema>;
export type OtpStepValues = z.infer<typeof otpSchema>;
export type PasswordStepValues = z.infer<typeof passwordSchema>;

export function useForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailForm = useForm<EmailStepValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });
  const otpForm = useForm<OtpStepValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });
  const passwordForm = useForm<PasswordStepValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { new_password: '', confirm_password: '' },
  });

  const onEmailSubmit = emailForm.handleSubmit(
    useCallback(
      async (values: EmailStepValues) => {
        setIsLoading(true);
        try {
          const { data } = await axiosPublic.post<AuthActionResponse>(
            FORGOT_PASSWORD_ENDPOINT,
            values
          );
          setEmail(values.email);
          toast.success(data.message || copy.requestSent);
          setStep('otp');
        } catch (err) {
          applyApiError<EmailStepValues>(err, {
            setError: emailForm.setError,
            fields: ['email'],
          });
        } finally {
          setIsLoading(false);
        }
      },
      [emailForm]
    )
  );

  const onOtpSubmit = otpForm.handleSubmit(
    useCallback(
      async (values: OtpStepValues) => {
        setIsLoading(true);
        try {
          const { data } = await axiosPublic.post<AuthActionResponse>(VERIFY_RESET_OTP_ENDPOINT, {
            email,
            otp: values.otp,
          });
          setOtp(values.otp);
          toast.success(data.message || copy.otpVerified);
          setStep('password');
        } catch (err) {
          applyApiError<OtpStepValues>(err, {
            setError: otpForm.setError,
            fields: ['otp'],
          });
        } finally {
          setIsLoading(false);
        }
      },
      [email, otpForm]
    )
  );

  const onPasswordSubmit = passwordForm.handleSubmit(
    useCallback(
      async (values: PasswordStepValues) => {
        setIsLoading(true);
        try {
          const { data } = await axiosPublic.post<AuthActionResponse>(RESET_PASSWORD_ENDPOINT, {
            email,
            otp,
            new_password: values.new_password,
            confirm_password: values.confirm_password,
          });
          toast.success(data.message || copy.resetSuccess);
          router.push('/login');
        } catch (err) {
          // otp_invalid/otp_expired bind to the OTP step's field if the user is
          // still there; new_password/confirm_password validation binds inline.
          applyApiError<PasswordStepValues>(err, {
            setError: passwordForm.setError,
            fields: ['new_password', 'confirm_password'],
          });
        } finally {
          setIsLoading(false);
        }
      },
      [email, otp, router, passwordForm]
    )
  );

  return {
    step,
    email,
    isLoading,
    emailForm,
    otpForm,
    passwordForm,
    onEmailSubmit,
    onOtpSubmit,
    onPasswordSubmit,
  };
}
