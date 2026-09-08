'use client';

import { Lock } from 'lucide-react';

import { useChangePasswordForm } from '../hooks/useChangePasswordForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types/user';
import { t } from '@/locales';
import { CARD, ERR, SectionHeader, fieldClass, themedButton } from './profileUi';

const copy = t.userProfile;

/** Pure presenter: `useChangePasswordForm` owns the mutation and error mapping. */
export function ChangePasswordForm({ profile }: Readonly<{ profile: UserProfile }>) {
  const isExternalIdp = profile.registration_type === 'external';
  const canChangePassword = !isExternalIdp;
  const { form, isSaving, submit } = useChangePasswordForm({
    isExternalIdp,
    hasProfile: true,
  });
  const errors = form.formState.errors;

  return (
    <section className={CARD}>
      <SectionHeader icon={<Lock className="h-4 w-4" />} title={copy.changePasswordTitle} />

      {canChangePassword ? (
        <>
          <p className="mb-6 text-sm text-muted-foreground">
            {isExternalIdp ? copy.externalPasswordSyncNote : copy.passwordRequirements}
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="current_password">{copy.currentPasswordLabel}</Label>
              <Input
                id="current_password"
                type="password"
                className={fieldClass(!!errors.current_password)}
                placeholder={copy.currentPasswordPlaceholder}
                disabled={isSaving}
                {...form.register('current_password')}
              />
              {errors.current_password && <p className={ERR}>{errors.current_password.message}</p>}
            </div>
            <div>
              <Label htmlFor="new_password">{copy.newPasswordLabel}</Label>
              <Input
                id="new_password"
                type="password"
                className={fieldClass(!!errors.new_password)}
                placeholder={copy.newPasswordPlaceholder}
                disabled={isSaving}
                {...form.register('new_password')}
              />
              {errors.new_password && <p className={ERR}>{errors.new_password.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirm_password">{copy.confirmPasswordLabel}</Label>
              <Input
                id="confirm_password"
                type="password"
                className={fieldClass(!!errors.confirm_password)}
                placeholder={copy.confirmPasswordPlaceholder}
                disabled={isSaving}
                {...form.register('confirm_password')}
              />
              {errors.confirm_password && <p className={ERR}>{errors.confirm_password.message}</p>}
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className={cn(
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  themedButton
                )}
              >
                {isSaving ? copy.updatingPassword : copy.changePasswordButton}
              </Button>
            </div>
          </form>
        </>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            {copy.externalPasswordNote}
          </div>
          <p className="text-sm text-muted-foreground">{copy.contactAdminNote}</p>
        </div>
      )}
    </section>
  );
}
