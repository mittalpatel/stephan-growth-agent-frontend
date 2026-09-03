'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { format } from '@/lib/i18n';
import { t } from '@/locales';

import { useForgotPasswordForm } from '../hooks/useForgotPasswordForm';
import AuthHeroShell from './AuthHeroShell';

const copy = t.auth.forgotPasswordFlow;

/**
 * Three-step reset: request a code, verify it, choose a new password.
 *
 * The step subtitle changes but the shell does not, so `AuthHeroShell` takes the
 * subtitle as a prop and the steps render only their own fields. All state lives
 * in `useForgotPasswordForm`.
 */
export default function ForgotPasswordForm() {
  const {
    step,
    email,
    isLoading,
    emailForm,
    otpForm,
    passwordForm,
    onEmailSubmit,
    onOtpSubmit,
    onPasswordSubmit,
  } = useForgotPasswordForm();

  const subtitle = {
    email: copy.emailStepSubtitle,
    otp: format(copy.otpStepSubtitle, { email }),
    password: copy.passwordStepSubtitle,
  }[step];

  return (
    <AuthHeroShell title={copy.title} subtitle={subtitle}>
      {step === 'email' && (
        <>
          <form onSubmit={onEmailSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">{copy.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                aria-invalid={Boolean(emailForm.formState.errors.email)}
                {...emailForm.register('email')}
              />
              {emailForm.formState.errors.email && (
                <p className="text-destructive text-xs">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Spinner />}
              {isLoading ? copy.sendingCode : copy.sendCodeButton}
            </Button>
          </form>
          <p className="text-muted-foreground mt-4 text-xs">{copy.externalIdpHint}</p>
        </>
      )}

      {step === 'otp' && (
        <>
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
                {...otpForm.register('otp')}
              />
              {otpForm.formState.errors.otp && (
                <p className="text-destructive text-xs">{otpForm.formState.errors.otp.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Spinner />}
              {isLoading ? copy.verifyingCode : copy.verifyCodeButton}
            </Button>
          </form>
          <p className="text-muted-foreground mt-4 text-xs">{copy.externalIdpHint}</p>
        </>
      )}

      {step === 'password' && (
        <form onSubmit={onPasswordSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="new_password">{copy.newPasswordLabel}</Label>
            <Input
              id="new_password"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              aria-invalid={Boolean(passwordForm.formState.errors.new_password)}
              {...passwordForm.register('new_password')}
            />
            {passwordForm.formState.errors.new_password && (
              <p className="text-destructive text-xs">
                {passwordForm.formState.errors.new_password.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">{copy.confirmPasswordLabel}</Label>
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              aria-invalid={Boolean(passwordForm.formState.errors.confirm_password)}
              {...passwordForm.register('confirm_password')}
            />
            {passwordForm.formState.errors.confirm_password && (
              <p className="text-destructive text-xs">
                {passwordForm.formState.errors.confirm_password.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Spinner />}
            {isLoading ? copy.resetting : copy.resetButton}
          </Button>
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
