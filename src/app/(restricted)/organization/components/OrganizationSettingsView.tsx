'use client';

import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { format } from '@/lib/i18n';
import {
  useOrganizationSettingsForm,
  type OrganizationSettingsFormValues,
} from '../hooks/useOrganizationSettingsForm';
import { useOrganizationSettingsBootstrap } from '../hooks/useOrganizationSettingsBootstrap';
import { useTransferOwnershipForm } from '../hooks/useTransferOwnershipForm';
import { useOrganizationPlan } from '../hooks/useOrganizationPlan';
import { RHFSelectField, RHFTextField } from '@/components/common/form';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { t } from '@/locales';

import { AiPreferencesTab } from './AiPreferencesTab';
import { BrandSettingsTab } from './BrandSettingsTab';
import { DataSettingsTab } from './DataSettingsTab';
import { DomainsTab } from './DomainsTab';
import { FeatureFlagsTab } from './FeatureFlagsTab';
import { OrganizationProfileTab } from './OrganizationProfileTab';
import { SecuritySettingsTab } from './SecuritySettingsTab';

export default function OrganizationSettingsView() {
  const { can } = usePermissions();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingTransfer, setConfirmingTransfer] = useState(false);
  const { organization, form, isPending, submit, deleteOrganization } =
    useOrganizationSettingsForm();
  useOrganizationSettingsBootstrap(organization?.id);
  const {
    members,
    form: transferForm,
    selectedMember,
    isPending: isTransferring,
    transferOwnership,
  } = useTransferOwnershipForm();
  const { planTier, seatLimit, isLoading: isPlanLoading } = useOrganizationPlan();

  const canManage = can('organization', 'manage');
  const canDelete = can('organization', 'delete');
  const canTransfer = can('organization', 'transfer');

  if (!organization) return null;

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader title={t.organizations.title} description={t.organizations.description} />

      <Tabs defaultValue="general">
        {/* Horizontally scrollable: eight tabs no longer fit a narrow
            viewport, and letting them wrap would push the panel below the
            fold on mobile. */}
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="general">{t.organizations.settingsTabs.tabs.general}</TabsTrigger>
          <TabsTrigger value="profile">{t.organizations.settingsTabs.tabs.profile}</TabsTrigger>
          <TabsTrigger value="brand">{t.organizations.settingsTabs.tabs.brand}</TabsTrigger>
          <TabsTrigger value="features">{t.organizations.settingsTabs.tabs.features}</TabsTrigger>
          <TabsTrigger value="domains">{t.organizations.settingsTabs.tabs.domains}</TabsTrigger>
          <TabsTrigger value="ai">{t.organizations.settingsTabs.tabs.aiPreferences}</TabsTrigger>
          <TabsTrigger value="security">{t.organizations.settingsTabs.tabs.security}</TabsTrigger>
          <TabsTrigger value="data">{t.organizations.settingsTabs.tabs.data}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <OrganizationProfileTab />
        </TabsContent>
        <TabsContent value="brand">
          <BrandSettingsTab />
        </TabsContent>
        <TabsContent value="features">
          <FeatureFlagsTab />
        </TabsContent>
        <TabsContent value="domains">
          <DomainsTab />
        </TabsContent>
        <TabsContent value="ai">
          <AiPreferencesTab />
        </TabsContent>
        <TabsContent value="security">
          <SecuritySettingsTab />
        </TabsContent>
        <TabsContent value="data">
          <DataSettingsTab />
        </TabsContent>

        <TabsContent value="general" className="space-y-8">
          <section className="rounded-lg border border-border p-6">
            <h2 className="mb-4 text-lg font-medium">{t.organizations.settings.title}</h2>
            <FormProvider {...form}>
              <form onSubmit={submit} className="space-y-4">
                <RHFTextField<OrganizationSettingsFormValues>
                  name="name"
                  label={t.organizations.settings.nameLabel}
                  placeholder={t.organizations.settings.namePlaceholder}
                  disabled={!canManage}
                  required
                />
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {t.organizations.settings.slugLabel}
                  </p>
                  <p className="mt-1 font-mono text-sm">{organization.slug}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t.organizations.settings.slugHint}
                  </p>
                </div>
                {!isPlanLoading ? (
                  <div className="flex gap-8">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        {t.organizations.settings.planLabel}
                      </p>
                      <p className="mt-1 text-sm">
                        {planTier?.name ?? t.organizations.settings.planNone}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        {t.organizations.settings.seatsLabel}
                      </p>
                      <p className="mt-1 text-sm">
                        {seatLimit ?? t.organizations.settings.seatsUnlimited}
                      </p>
                    </div>
                  </div>
                ) : null}
                {canManage ? (
                  <Button type="submit" disabled={isPending}>
                    {t.buttons.save}
                  </Button>
                ) : null}
              </form>
            </FormProvider>
          </section>

          {canTransfer || canDelete ? (
            <section className="border-destructive/40 space-y-6 rounded-lg border p-6">
              <h2 className="text-destructive text-lg font-medium">
                {t.organizations.dangerZone.title}
              </h2>

              {canTransfer ? (
                <div className="space-y-3 border-b border-border pb-6 last:border-0 last:pb-0">
                  <div>
                    <h3 className="text-sm font-medium">
                      {t.organizations.dangerZone.transferTitle}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {t.organizations.dangerZone.transferDescription}
                    </p>
                  </div>
                  <FormProvider {...transferForm}>
                    <div className="flex flex-wrap items-end gap-3">
                      <RHFSelectField<{ user_id: string }>
                        name="user_id"
                        label={t.organizations.dangerZone.memberLabel}
                        placeholder={t.organizations.dangerZone.memberPlaceholder}
                        options={members.map((m) => ({
                          value: m.user_id,
                          label: `${m.full_name} (${m.email})`,
                        }))}
                        className="min-w-64 flex-1"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={!selectedMember}
                        onClick={() => setConfirmingTransfer(true)}
                      >
                        {t.organizations.dangerZone.transferAction}
                      </Button>
                    </div>
                  </FormProvider>
                </div>
              ) : null}

              {canDelete ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium">
                      {t.organizations.dangerZone.deleteTitle}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {t.organizations.dangerZone.deleteDescription}
                    </p>
                  </div>
                  <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
                    {t.organizations.dangerZone.deleteAction}
                  </Button>
                </div>
              ) : null}
            </section>
          ) : null}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmingDelete}
        destructive
        title={format(t.organizations.dangerZone.deleteConfirmTitle, { name: organization.name })}
        message={t.organizations.dangerZone.deleteConfirmBody}
        loading={isPending}
        onConfirm={() => void deleteOrganization(() => setConfirmingDelete(false))}
        onOpenChange={setConfirmingDelete}
      />

      <ConfirmDialog
        open={confirmingTransfer}
        destructive
        title={format(t.organizations.dangerZone.transferConfirmTitle, {
          name: selectedMember?.full_name ?? '',
        })}
        message={t.organizations.dangerZone.transferConfirmBody}
        loading={isTransferring}
        onConfirm={() => void transferOwnership(() => setConfirmingTransfer(false))}
        onOpenChange={setConfirmingTransfer}
      />
    </div>
  );
}
