'use client';

import { useCallback, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
  type PublicSignupResponse,
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
    accepted_terms: z.boolean().refine((v) => v, { message: copy.validation.termsRequired }),
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

/**
 * 0 to 4, one point per rule the schema enforces (length, lower, upper,
 * digit) plus one for real length or a symbol. Mirrors the schema so a
 * "Strong" password can never fail validation; it is guidance, not a gate.
 */
export function passwordStrength(value: string): number {
  if (!value) return 0;
  const rules = [
    value.length >= 8,
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    value.length >= 12 || /[^A-Za-z0-9]/.test(value),
  ];
  // Four of the five rules are required, so anything short of them caps at
  // "Fair": the bar should never call a password the form rejects "Good".
  const passed = rules.filter(Boolean).length;
  return rules.slice(0, 4).every(Boolean) ? Math.min(passed - 1, 4) : Math.min(passed, 2);
}
export type OtpStepValues = z.infer<typeof otpSchema>;

export function usePublicSignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('details');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const detailsForm = useForm<DetailsStepValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
      accepted_terms: false,
    },
  });
  const strength = passwordStrength(useWatch({ control: detailsForm.control, name: 'password' }));
  const otpForm = useForm<OtpStepValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  // Re-authenticate through the normal credentials flow rather than
  // hand-rolling a session from a verify/signup response — same convention
  // as the invite-based signup flow (`useSignupForm`). Shared by the OTP step
  // and by a signup call that activated the account immediately (no OTP
  // required).
  const signInAndRedirect = useCallback(
    async (loginEmail: string, loginPassword: string) => {
      const result = await signIn('credentials', {
        redirect: false,
        email: loginEmail,
        password: loginPassword,
      });
      if (result?.error) {
        router.push('/login');
        return;
      }
      router.push(DEFAULT_LANDING);
    },
    [router]
  );

  const onDetailsSubmit = detailsForm.handleSubmit(
    useCallback(
      async (values: DetailsStepValues) => {
        setIsLoading(true);
        try {
          const { data } = await axiosPublic.post<PublicSignupResponse>(PUBLIC_SIGNUP_ENDPOINT, {
            email: values.email,
            password: values.password,
            first_name: values.first_name.trim(),
            last_name: values.last_name?.trim() || '',
            // Recorded server-side once the backend stores consent; until
            // then DRF ignores the unknown field.
            accepted_terms: values.accepted_terms,
          });
          setEmail(values.email);
          setPassword(values.password);
          if (data.data) {
            // Backend activated the account immediately
            // (`SIGNUP_OTP_VERIFICATION_ENABLED=false`) — no OTP step to show.
            toast.success(data.message || copy.accountVerified);
            await signInAndRedirect(values.email, values.password);
            return;
          }
          toast.success(data.message || copy.otpSent);
          setStep('otp');
        } catch (err) {
          applyApiError<DetailsStepValues>(err, {
            setError: detailsForm.setError,
            fields: [
              'first_name',
              'last_name',
              'email',
              'password',
              'confirm_password',
              'accepted_terms',
            ],
          });
        } finally {
          setIsLoading(false);
        }
      },
      [detailsForm, signInAndRedirect]
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
          await signInAndRedirect(email, password);
        } catch (err) {
          applyApiError<OtpStepValues>(err, {
            setError: otpForm.setError,
            fields: ['otp'],
          });
        } finally {
          setIsLoading(false);
        }
      },
      [email, password, otpForm, signInAndRedirect]
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
    showPassword,
    toggleShowPassword: () => setShowPassword((value) => !value),
    strength,
    detailsForm,
    otpForm,
    onDetailsSubmit,
    onOtpSubmit,
    onResendOtp,
  };
}
