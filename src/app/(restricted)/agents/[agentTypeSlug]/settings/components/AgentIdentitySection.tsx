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

/**
 * The agent's own editable fields (`PATCH /agents/{id}/`, gated
 * `agent:manage`) plus its read-only identity rows.
 *
 * Lived on the Overview tab until the detail page moved to the reference
 * platform's tabbed layout, where Overview carries performance and Settings
 * carries configuration. `agent_type` stays read-only: `AgentWriteSerializer`
 * has no field for it, and an agent's kind is fixed at provisioning.
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

  return (
    <Card>
      <CardContent className="space-y-6">
        <FormProvider {...form}>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
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
            <div>
              <p className="mb-1.5 block text-sm font-medium">
                {t.agents.detail.overview.slugLabel}
              </p>
              <p className="text-muted-foreground text-sm">{agent.slug}</p>
            </div>
            <div>
              <p className="mb-1.5 block text-sm font-medium">
                {t.agents.detail.overview.agentTypeLabel}
              </p>
              <p className="text-muted-foreground text-sm">{agent.agent_type?.name ?? '—'}</p>
            </div>
            <div>
              <p className="mb-1.5 block text-sm font-medium">
                {t.agents.detail.overview.createdAtLabel}
              </p>
              <p className="text-muted-foreground text-sm">{formatDate(agent.created_at)}</p>
            </div>

            {canManage && (
              <div className="sm:col-span-2">
                <Button type="submit" disabled={isUpdating}>
                  {t.agents.actions.edit}
                </Button>
              </div>
            )}
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
