'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RHFSelectField, RHFTextField } from '@/components/common/form';
import { applyApiError } from '@/lib/apiError';
import { formatDate } from '@/lib/i18n';
import { agentUpdateSchema, type AgentUpdateFormValues } from '@/lib/schemas/agent';
import { t } from '@/locales';
import type { Agent } from '@/types/agent';

import { useAgentActions } from '../hooks/useAgentActions';

type Props = Readonly<{ agent: Agent }>;

export function AgentOverviewTab({ agent }: Props) {
  const router = useRouter();
  const { can } = usePermissions();
  const canManage = can('agent', 'manage');
  const canDelete = can('agent', 'delete');
  const { update, isUpdating, remove, isDeleting } = useAgentActions(agent.id);

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

        {canDelete && (
          <div className="border-border border-t pt-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {t.agents.actions.delete}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.agents.detail.overview.deleteConfirmTitle}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.agents.detail.overview.deleteConfirmDescription}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.agents.detail.overview.cancel}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await remove();
                      router.push('/agents');
                    }}
                  >
                    {t.agents.detail.overview.deleteConfirmAction}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
