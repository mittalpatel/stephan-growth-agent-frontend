'use client';

import { User } from 'lucide-react';

import { useProfileForm } from '../hooks/useProfileForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types/user';
import { t } from '@/locales';
import { CARD, ERR, SectionHeader, fieldClass, themedButton } from './profileUi';

const copy = t.userProfile;

/** Pure presenter: `useProfileForm` owns the query, mutation, and error mapping. */
export function PersonalInfoForm({ profile }: Readonly<{ profile: UserProfile }>) {
  const { form, isSaving, submit } = useProfileForm();
  const isExternalIdp = profile.registration_type === 'external';
  const errors = form.formState.errors;

  return (
    <section className={CARD}>
      <SectionHeader icon={<User className="h-4 w-4" />} title={copy.personalInfoTitle} />

      {isExternalIdp && (
        <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          {copy.externalProfileNote}
        </div>
      )}

      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="email">{copy.emailLabel}</Label>
          {/* No fill override: `bg-accent` is the hover surface and rendered this
              read-only field as a dark block. `Input`'s own disabled styling is what
              every other non-editable field in the app uses. */}
          <Input
            id="email"
            value={profile.email}
            readOnly
            disabled
            className={fieldClass(false, 'cursor-not-allowed')}
          />
        </div>

        <div>
          <Label htmlFor="first_name">{copy.firstNameLabel}</Label>
          <Input
            id="first_name"
            className={fieldClass(
              !!errors.first_name,
              isExternalIdp && 'cursor-not-allowed bg-accent'
            )}
            placeholder={copy.firstNamePlaceholder}
            readOnly={isExternalIdp}
            disabled={isExternalIdp || isSaving}
            {...form.register('first_name')}
          />
          {errors.first_name && <p className={ERR}>{errors.first_name.message}</p>}
        </div>

        <div>
          <Label htmlFor="last_name">{copy.lastNameLabel}</Label>
          <Input
            id="last_name"
            className={fieldClass(
              !!errors.last_name,
              isExternalIdp && 'cursor-not-allowed bg-accent'
            )}
            placeholder={copy.lastNamePlaceholder}
            readOnly={isExternalIdp}
            disabled={isExternalIdp || isSaving}
            {...form.register('last_name')}
          />
          {errors.last_name && <p className={ERR}>{errors.last_name.message}</p>}
        </div>

        {!isExternalIdp && (
          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={isSaving}
              className={cn('bg-primary text-primary-foreground hover:bg-primary/90', themedButton)}
            >
              {isSaving ? copy.saving : copy.saveButton}
            </Button>
          </div>
        )}
      </form>
    </section>
  );
}
