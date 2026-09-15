'use client';

import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RHFSelectField, RHFTextField } from '@/components/common/form';
import { applyApiError } from '@/lib/apiError';
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
    },
  });

  useEffect(() => {
    form.reset({
      name: agent.name,
      human_inbox_email: agent.human_inbox_email,
      status: agent.status,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.id, agent.name, agent.human_inbox_email, agent.status]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await update(values);
    } catch (error) {
      applyApiError<AgentUpdateFormValues>(error, {
        setError: form.setError,
        fields: ['name', 'human_inbox_email', 'status'],
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
