'use client';

import { useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  RHFSearchableCheckboxGroupField,
  RHFSelectField,
  RHFTextField,
} from '@/components/common/form';
import { applyApiError } from '@/lib/apiError';
import { SUPPORTED_LANGUAGES } from '@/lib/constants/agentLanguages';
import { formatDate } from '@/lib/i18n';
import { agentUpdateSchema, type AgentUpdateFormValues } from '@/lib/schemas/agent';
import { t } from '@/locales';
import type { Agent } from '@/types/agent';

import { useAgentActions } from '../../hooks/useAgentActions';

type Props = Readonly<{ agent: Agent }>;

const copy = t.agents.settings.identity;

/**
 * The agent's own editable fields (`PATCH /agents/{id}/`, gated
 * `agent:manage`) plus its read-only identity rows, which sit apart from the
 * inputs so nobody hunts for a way to edit them. `agent_type` is read-only:
 * `AgentWriteSerializer` has no field for it, and an agent's kind is fixed at
 * provisioning.
 */
export function AgentIdentitySection({ agent }: Props) {
  const { can } = usePermissions();
  const canManage = can('agent', 'manage');
  const { update, isUpdating } = useAgentActions(agent.id);

  const form = useForm<AgentUpdateFormValues>({
    resolver: zodResolver(agentUpdateSchema),
    defaultValues: {
      name: agent.name,
      human_inbox_email: agent.human_inbox_email,
      status: agent.status,
      enabled_languages: agent.enabled_languages as AgentUpdateFormValues['enabled_languages'],
      default_language: agent.default_language as AgentUpdateFormValues['default_language'],
    },
  });

  /* Compared by value, not identity: `agent` is re-created by every query
     refetch, so depending on the array itself would reset the form (and wipe an
     in-progress edit) on any background refresh. */
  const enabledLanguagesKey = agent.enabled_languages.join(',');

  useEffect(() => {
    form.reset({
      name: agent.name,
      human_inbox_email: agent.human_inbox_email,
      status: agent.status,
      enabled_languages: agent.enabled_languages as AgentUpdateFormValues['enabled_languages'],
      default_language: agent.default_language as AgentUpdateFormValues['default_language'],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    agent.id,
    agent.name,
    agent.human_inbox_email,
    agent.status,
    enabledLanguagesKey,
    agent.default_language,
  ]);

  /* The default-language options are narrowed to whatever is currently ticked,
     so the two fields cannot visibly disagree before submit. */
  const enabledLanguages = useWatch({ control: form.control, name: 'enabled_languages' });
  const defaultLanguageOptions = SUPPORTED_LANGUAGES.filter((option) =>
    (enabledLanguages ?? []).includes(option.value)
  );

  /* Unticking the language that is currently the default moves the default to
     the first one still enabled.

     Without this the field lies: a native `<select>` cannot display a value
     that is no longer among its options, so it falls back to showing the first
     one while the form value underneath is still the removed language. The
     operator sees "English" selected next to an error insisting the default
     is not enabled. Re-pointing it is also what they almost certainly want,
     since the alternative is an error demanding they re-pick by hand after
     every removal.

     Skipped while nothing is enabled: there is no language to move to, and
     `enabled_languages`' own `min(1)` error is the accurate message then. The
     schema's `refine` stays as the backstop and as the mirror of the backend's
     cross-field rule. */
  const defaultLanguage = useWatch({ control: form.control, name: 'default_language' });
  useEffect(() => {
    const enabled = enabledLanguages ?? [];
    if (enabled.length === 0 || enabled.includes(defaultLanguage)) return;
    form.setValue('default_language', enabled[0], { shouldDirty: true, shouldValidate: true });
  }, [enabledLanguages, defaultLanguage, form]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await update(values);
    } catch (error) {
      applyApiError<AgentUpdateFormValues>(error, {
        setError: form.setError,
        fields: ['name', 'human_inbox_email', 'status', 'enabled_languages', 'default_language'],
      });
    }
  });

  const isDirty = form.formState.isDirty;
  const metadata = [
    {
      label: t.agents.detail.overview.agentTypeLabel,
      value: agent.agent_type?.name ?? copy.notSet,
    },
    { label: t.agents.detail.overview.slugLabel, value: agent.slug, mono: true },
    { label: t.agents.detail.overview.createdAtLabel, value: formatDate(agent.created_at) },
  ];

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold">{copy.title}</h2>
          <p className="text-muted-foreground text-sm">{copy.description}</p>
        </div>

        <FormProvider {...form}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <RHFTextField<AgentUpdateFormValues>
                name="name"
                label={t.agents.form.nameLabel}
                disabled={!canManage}
                required
              />
              <RHFTextField<AgentUpdateFormValues>
                name="human_inbox_email"
                label={t.agents.form.inboxEmailLabel}
                type="email"
                disabled={!canManage}
                required
              />
              <RHFSelectField<AgentUpdateFormValues>
                name="status"
                label={t.agents.form.statusLabel}
                disabled={!canManage}
                options={[
                  { value: 'active', label: t.agents.status.active },
                  { value: 'paused', label: t.agents.status.paused },
                  { value: 'archived', label: t.agents.status.archived },
                ]}
                required
              />
            </div>

            {/* Full width rather than a third grid cell: the list is long
                enough that a half-width column would scroll in two dimensions
                at once on a narrow viewport. */}
            <RHFSearchableCheckboxGroupField<AgentUpdateFormValues>
              name="enabled_languages"
              label={t.agents.form.enabledLanguagesLabel}
              description={t.agents.form.enabledLanguagesDescription}
              options={SUPPORTED_LANGUAGES}
              disabled={!canManage}
              required
              copy={{
                searchPlaceholder: t.agents.form.enabledLanguagesSearchPlaceholder,
                selectAll: t.agents.form.enabledLanguagesSelectAll,
                deselectAll: t.agents.form.enabledLanguagesDeselectAll,
                selectedCount: t.agents.form.enabledLanguagesSelectedCount,
                noMatches: t.agents.form.enabledLanguagesNoMatches,
              }}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <RHFSelectField<AgentUpdateFormValues>
                name="default_language"
                label={t.agents.form.defaultLanguageLabel}
                description={t.agents.form.defaultLanguageDescription}
                disabled={!canManage}
                options={defaultLanguageOptions}
                required
              />
            </div>

            {canManage && (
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={isUpdating || !isDirty}>
                  {t.agents.actions.edit}
                </Button>
                {isDirty && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isUpdating}
                    onClick={() => form.reset()}
                  >
                    {t.agents.detail.draft.discardChanges}
                  </Button>
                )}
              </div>
            )}
          </form>
        </FormProvider>

        <div className="border-border border-t pt-4">
          <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            {copy.metadataHeading}
          </h3>
          <dl className="grid gap-3 sm:grid-cols-3">
            {metadata.map((row) => (
              <div key={row.label}>
                <dt className="text-muted-foreground text-xs">{row.label}</dt>
                <dd className={row.mono ? 'mt-0.5 font-mono text-sm' : 'mt-0.5 text-sm'}>
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
