'use client';

import Link from 'next/link';
import { Controller } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { format } from '@/lib/i18n';
import { t } from '@/locales';

import { usePublicSignupForm } from '../hooks/usePublicSignupForm';
import AuthHeroShell from './AuthHeroShell';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

const copy = t.auth.publicSignupFlow;

/** Same control as the login form's, so both password fields toggle together. */
function PasswordVisibilityToggle({
  visible,
  onToggle,
}: Readonly<{ visible: boolean; onToggle: () => void }>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}
      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-md transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

/**
 * Open self-registration: details, then an emailed OTP confirms the address
 * before the account activates. Alongside, not instead of, the admin-issued
 * invite flow at `/signup` — this route only works when the backend has
 * `PUBLIC_SIGNUP_ENABLED` set; otherwise the first step toasts the backend's
 * "not enabled" message.
 */
export default function PublicSignupForm() {
  const {
    step,
    email,
    isLoading,
    isResending,
    showPassword,
    toggleShowPassword,
    strength,
    detailsForm,
    otpForm,
    onDetailsSubmit,
    onOtpSubmit,
    onResendOtp,
  } = usePublicSignupForm();

  const subtitle =
    step === 'details' ? copy.detailsStepSubtitle : format(copy.otpStepSubtitle, { email });

  return (
    <AuthHeroShell title={copy.title} subtitle={subtitle}>
      {step === 'details' && (
        <form onSubmit={onDetailsSubmit} className="space-y-4" noValidate>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="first_name">{copy.firstNameLabel}</Label>
              <Input
                id="first_name"
                autoComplete="given-name"
                disabled={isLoading}
                aria-invalid={Boolean(detailsForm.formState.errors.first_name)}
                className="h-11 rounded-lg text-base"
                {...detailsForm.register('first_name')}
              />
              {detailsForm.formState.errors.first_name && (
                <p className="text-destructive text-xs">
                  {detailsForm.formState.errors.first_name.message}
                </p>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="last_name">{copy.lastNameLabel}</Label>
              <Input
                id="last_name"
                autoComplete="family-name"
                disabled={isLoading}
                aria-invalid={Boolean(detailsForm.formState.errors.last_name)}
                className="h-11 rounded-lg text-base"
                {...detailsForm.register('last_name')}
              />
              {detailsForm.formState.errors.last_name && (
                <p className="text-destructive text-xs">
                  {detailsForm.formState.errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">{copy.emailLabel}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              aria-invalid={Boolean(detailsForm.formState.errors.email)}
              className="h-11 rounded-lg text-base"
              {...detailsForm.register('email')}
            />
            {detailsForm.formState.errors.email && (
              <p className="text-destructive text-xs">
                {detailsForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{copy.passwordLabel}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                disabled={isLoading}
                aria-invalid={Boolean(detailsForm.formState.errors.password)}
                className="h-11 rounded-lg pr-10 text-base"
                {...detailsForm.register('password')}
              />
              <PasswordVisibilityToggle visible={showPassword} onToggle={toggleShowPassword} />
            </div>
            {detailsForm.formState.errors.password && (
              <p className="text-destructive text-xs">
                {detailsForm.formState.errors.password.message}
              </p>
            )}
            <PasswordStrengthMeter score={strength} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">{copy.confirmPasswordLabel}</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                disabled={isLoading}
                aria-invalid={Boolean(detailsForm.formState.errors.confirm_password)}
                className="h-11 rounded-lg pr-10 text-base"
                {...detailsForm.register('confirm_password')}
              />
              <PasswordVisibilityToggle visible={showPassword} onToggle={toggleShowPassword} />
            </div>
            {detailsForm.formState.errors.confirm_password && (
              <p className="text-destructive text-xs">
                {detailsForm.formState.errors.confirm_password.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-start gap-2.5">
              <Controller
                control={detailsForm.control}
                name="accepted_terms"
                render={({ field }) => (
                  <Checkbox
                    id="accepted_terms"
                    className="mt-0.5"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    disabled={isLoading}
                    aria-invalid={Boolean(detailsForm.formState.errors.accepted_terms)}
                  />
                )}
              />
              <Label htmlFor="accepted_terms" className="text-sm leading-snug font-normal">
                <span>
                  {copy.termsPrefix}{' '}
                  <Link
                    href="/legal/terms-conditions"
                    target="_blank"
                    className="underline underline-offset-4"
                  >
                    {copy.termsLink}
                  </Link>{' '}
                  {copy.termsJoin}{' '}
                  <Link
                    href="/legal/privacy-policy"
                    target="_blank"
                    className="underline underline-offset-4"
                  >
                    {copy.privacyLink}
                  </Link>
                </span>
              </Label>
            </div>
            {detailsForm.formState.errors.accepted_terms && (
              <p className="text-destructive text-xs">
                {detailsForm.formState.errors.accepted_terms.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="h-11 w-full rounded-lg text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading && <Spinner />}
            {isLoading ? copy.creatingAccount : copy.createAccountButton}
          </Button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={onOtpSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="otp">{copy.otpLabel}</Label>
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              disabled={isLoading}
              aria-invalid={Boolean(otpForm.formState.errors.otp)}
              className="h-11 rounded-lg text-base"
              {...otpForm.register('otp')}
            />
            {otpForm.formState.errors.otp && (
              <p className="text-destructive text-xs">{otpForm.formState.errors.otp.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="h-11 w-full rounded-lg text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading && <Spinner />}
            {isLoading ? copy.verifyingCode : copy.verifyCodeButton}
          </Button>
          <button
            type="button"
            onClick={onResendOtp}
            disabled={isResending}
            className="text-muted-foreground hover:text-foreground w-full text-center text-sm underline-offset-4 hover:underline disabled:opacity-50"
          >
            {isResending ? copy.resendingCode : copy.resendCodeButton}
          </button>
        </form>
      )}

      <p className="mt-6 text-center">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          {copy.backToLogin}
        </Link>
      </p>
    </AuthHeroShell>
  );
}
