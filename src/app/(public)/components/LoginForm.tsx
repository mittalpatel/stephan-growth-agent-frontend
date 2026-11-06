'use client';

import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { t } from '@/locales';

import { useLoginForm } from '../hooks/useLoginForm';

/**
 * The credentials form. All state and submission live in `useLoginForm`; this is
 * a presenter. A `mfa_required` response redirects to `/login/otp` — see
 * `useLoginForm.ts` and `mfaChallengeStorage.ts` — rather than toggling state on
 * this same page: a code-entry step reachable only through in-memory component
 * state has no URL of its own to reload, bookmark, or land on directly.
 *
 * The original also rendered a "remember me" checkbox that was bound to nothing —
 * no schema field, no hook state, no effect on the session. It is not reproduced
 * here. Session lifetime is set by `session.maxAge` in `authOptions`, pinned to
 * the backend's refresh-token lifetime; a checkbox implying otherwise is a lie to
 * the user. Wire it to a real shorter/longer session before putting it back.
 */
export default function LoginForm() {
  const { form, isLoading, showPassword, toggleShowPassword, onSubmit } = useLoginForm();
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">{t.auth.emailPlaceholder}</Label>
        <div className="relative">
          <Mail className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 my-auto size-4" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            disabled={isLoading}
            aria-invalid={Boolean(errors.email)}
            className="h-11 rounded-lg pl-9 text-base"
            {...register('email')}
          />
        </div>
        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t.auth.passwordPlaceholder}</Label>
        <div className="relative">
          <Lock className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 my-auto size-4" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            disabled={isLoading}
            aria-invalid={Boolean(errors.password)}
            className="h-11 rounded-lg pr-10 pl-9 text-base"
            {...register('password')}
          />
          <button
            type="button"
            onClick={toggleShowPassword}
            aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-md transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
      </div>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          {t.auth.forgotPassword}
        </Link>
      </div>

      <Button
        type="submit"
        className="h-11 w-full rounded-lg text-base font-semibold"
        disabled={isLoading}
      >
        {isLoading && <Spinner />}
        {isLoading ? t.auth.signingIn : t.auth.signInButton}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        {t.auth.noAccountPrompt}{' '}
        <Link href="/signup/create" className="text-foreground underline underline-offset-4">
          {t.auth.createAccountLink}
        </Link>
      </p>

      <p className="text-muted-foreground pt-2 text-center text-xs">
        <Link href="/legal/privacy-policy" className="underline-offset-4 hover:underline">
          {t.legal.privacyLinkLabel}
        </Link>
        <span className="mx-2" aria-hidden>
          &middot;
        </span>
        <Link href="/legal/terms-conditions" className="underline-offset-4 hover:underline">
          {t.legal.termsLinkLabel}
        </Link>
      </p>
    </form>
  );
}
