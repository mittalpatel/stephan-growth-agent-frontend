'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { t } from '@/locales';

import { useSignupForm } from '../hooks/useSignupForm';
import { useSignupInvite } from '../hooks/useSignupInvite';
import AuthHeroShell from './AuthHeroShell';

const copy = t.auth.signupFlow;

/**
 * Invite-only account activation.
 *
 * Signup is not open: `useSignupInvite` validates the token in the URL first, and
 * an invalid, expired, or already-used invite falls through to `notFound()`
 * rather than rendering a form that cannot succeed. The email field is
 * read-only for the same reason — it is fixed by the invite, and letting it be
 * edited would only produce a server-side rejection.
 */
export default function SignupForm() {
  const { status, token, email } = useSignupInvite();
  const { form, isSubmitting, onSubmit } = useSignupForm(email ?? '', token ?? '');

  if (status === 'loading') {
    return (
      <AuthHeroShell title={copy.title}>
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Spinner className="size-4" />
          {copy.checkingInvite}
        </p>
      </AuthHeroShell>
    );
  }

  if (status !== 'valid') {
    notFound();
  }

  const errors = form.formState.errors;

  return (
    <AuthHeroShell title={copy.title} subtitle={copy.subtitle}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">{copy.emailLabel}</Label>
          <Input id="email" value={email ?? ''} readOnly disabled />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="first_name">{copy.firstNameLabel}</Label>
            <Input
              id="first_name"
              autoComplete="given-name"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.first_name)}
              className="h-11 rounded-lg text-base"
              {...form.register('first_name')}
            />
            {errors.first_name && (
              <p className="text-destructive text-xs">{errors.first_name.message}</p>
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="last_name">{copy.lastNameLabel}</Label>
            <Input
              id="last_name"
              autoComplete="family-name"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.last_name)}
              className="h-11 rounded-lg text-base"
              {...form.register('last_name')}
            />
            {errors.last_name && (
              <p className="text-destructive text-xs">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{copy.passwordLabel}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.password)}
            className="h-11 rounded-lg text-base"
            {...form.register('password')}
          />
          {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">{copy.confirmPasswordLabel}</Label>
          <Input
            id="confirm_password"
            type="password"
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.confirm_password)}
            className="h-11 rounded-lg text-base"
            {...form.register('confirm_password')}
          />
          {errors.confirm_password && (
            <p className="text-destructive text-xs">{errors.confirm_password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-lg text-base font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? copy.creatingAccount : copy.createAccountButton}
        </Button>
      </form>

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
