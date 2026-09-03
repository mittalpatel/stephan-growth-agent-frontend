'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OtpInput } from '@/components/ui/otp-input';
import { Spinner } from '@/components/ui/spinner';
import { t } from '@/locales';

import { useMfaVerifyForm } from '../hooks/useMfaVerifyForm';

type Props = Readonly<{ mode: 'otp' | 'backup-code' }>;

/**
 * The code-entry step for `/login/otp` and `/login/backup-code`. Identical
 * logic (`useMfaVerifyForm`) either way — the backend tries a TOTP code, then
 * a recovery code, so this component only changes label/placeholder/keyboard
 * and which "switch" link it shows.
 */
export default function MfaVerifyForm({ mode }: Props) {
  const { form, isLoading, ready, onSubmit, backToLogin } = useMfaVerifyForm(mode);
  const { register, watch, setValue, formState } = form;
  const errors = formState.errors;
  const codeValue = watch('code');

  // The redirect-to-/login guard in useMfaVerifyForm runs in an effect, so
  // the first render still happens with no stored challenge — render nothing
  // rather than a form that's about to be replaced.
  if (!ready) return null;

  const isBackupCode = mode === 'backup-code';

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <p className="text-muted-foreground text-sm">
        {isBackupCode ? t.auth.mfaFlow.backupCodeSubtitle : t.auth.mfaFlow.subtitle}
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="mfa-code">
          {isBackupCode ? t.auth.mfaFlow.backupCodeLabel : t.auth.mfaFlow.codeLabel}
        </Label>
        {isBackupCode ? (
          <Input
            id="mfa-code"
            type="text"
            inputMode="text"
            autoComplete="one-time-code"
            autoFocus
            placeholder={t.auth.mfaFlow.backupCodePlaceholder}
            disabled={isLoading}
            aria-invalid={Boolean(errors.code)}
            {...register('code')}
          />
        ) : (
          <OtpInput
            id="mfa-code"
            value={codeValue}
            onChange={(next) => setValue('code', next, { shouldValidate: true })}
            disabled={isLoading}
            autoFocus
            aria-invalid={Boolean(errors.code)}
          />
        )}
        {errors.code && <p className="text-destructive text-xs">{errors.code.message}</p>}
      </div>

      <Button
        type="submit"
        className="h-11 w-full rounded-lg text-base font-semibold"
        disabled={isLoading}
      >
        {isLoading && <Spinner />}
        {isLoading ? t.auth.mfaFlow.verifying : t.auth.mfaFlow.verifyButton}
      </Button>

      <Link
        href={isBackupCode ? '/login/otp' : '/login/backup-code'}
        className="text-muted-foreground hover:text-foreground block w-full text-center text-sm underline-offset-4 hover:underline"
      >
        {isBackupCode ? t.auth.mfaFlow.useAuthenticatorInstead : t.auth.mfaFlow.useBackupCode}
      </Link>

      <button
        type="button"
        onClick={backToLogin}
        className="text-muted-foreground hover:text-foreground block w-full text-center text-sm underline-offset-4 hover:underline"
      >
        {t.auth.mfaFlow.backToLogin}
      </button>
    </form>
  );
}
