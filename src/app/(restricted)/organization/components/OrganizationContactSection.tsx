'use client';

import { FormProvider } from 'react-hook-form';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { RHFTextField } from '@/components/common/form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/locales';
import type { OrganizationProfileFormValues } from '@/lib/schemas/settings';

import { useOrganizationProfileForm } from '../hooks/useOrganizationProfileForm';
import { SettingsTabError } from './SettingsTabError';

/**
 * The organization's public contact details: a website and a contact email. Sits in
 * General rather than its own tab, since two fields do not justify one. It is a
 * separate form from the name above it because it saves to its own endpoint.
 */
export function OrganizationContactSection() {
  const { can } = usePermissions();
  const canManage = can('organization', 'manage');
  const { form, submit, isPending, isLoading, isError, refetch } = useOrganizationProfileForm();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError) return <SettingsTabError onRetry={() => void refetch()} />;

  return (
    <section className="border-border rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-medium">{t.organizations.settingsTabs.contact.title}</h2>
      <FormProvider {...form}>
        <form onSubmit={submit} className="space-y-4">
          <RHFTextField<OrganizationProfileFormValues>
            name="website"
            label={t.organizations.settingsTabs.contact.websiteLabel}
            placeholder={t.organizations.settingsTabs.contact.websitePlaceholder}
            disabled={!canManage}
          />
          <RHFTextField<OrganizationProfileFormValues>
            name="contact_email"
            label={t.organizations.settingsTabs.contact.contactEmailLabel}
            type="email"
            disabled={!canManage}
          />
          {canManage && (
            <Button type="submit" disabled={isPending}>
              {t.buttons.save}
            </Button>
          )}
        </form>
      </FormProvider>
    </section>
  );
}
