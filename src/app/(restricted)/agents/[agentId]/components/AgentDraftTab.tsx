'use client';

import { FormProvider } from 'react-hook-form';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RHFSwitchField, RHFTextField } from '@/components/common/form';
import { fieldInputCls, fieldLabelCls } from '@/components/common/form/fieldStyles';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/locales';
import type { Agent, AgentVersionDetail } from '@/types/agent';

import { useAgentDraft } from '../hooks/useAgentDraft';
import { useAgentDraftForm, type AgentDraftFormValues } from '../hooks/useAgentDraftForm';

type Props = Readonly<{ agent: Agent }>;

function DraftForm({
  agent,
  draft,
  canManage,
}: Readonly<{ agent: Agent; draft: AgentVersionDetail; canManage: boolean }>) {
  const { form, isPending, submit } = useAgentDraftForm(agent.id, draft, agent.default_language);
  const { register } = form;

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={fieldLabelCls} htmlFor="instructions">
            {t.agents.detail.draft.instructionsLabel}
          </label>
          <textarea
            id="instructions"
            rows={6}
            placeholder={t.agents.detail.draft.instructionsPlaceholder}
            disabled={!canManage}
            {...register('instructions')}
            className={fieldInputCls}
          />
        </div>

        <RHFSwitchField<AgentDraftFormValues>
          name="disclosure_enabled"
          label={t.agents.detail.draft.disclosureEnabledLabel}
          disabled={!canManage}
        />

        <div className="border-border space-y-4 border-t pt-4">
          <h3 className="text-sm font-semibold">{t.agents.detail.draft.localizedTextTitle}</h3>
          <RHFTextField<AgentDraftFormValues>
            name="greeting"
            label={t.agents.detail.draft.greetingLabel}
            placeholder={t.agents.detail.draft.greetingPlaceholder}
            disabled={!canManage}
            required
          />
          <div>
            <label className={fieldLabelCls} htmlFor="fallback_message">
              {t.agents.detail.draft.fallbackMessageLabel}
            </label>
            <textarea
              id="fallback_message"
              rows={2}
              placeholder={t.agents.detail.draft.fallbackMessagePlaceholder}
              disabled={!canManage}
              {...register('fallback_message')}
              className={fieldInputCls}
            />
          </div>
          <div>
            <label className={fieldLabelCls} htmlFor="disclosure_text">
              {t.agents.detail.draft.disclosureTextLabel}
            </label>
            <textarea
              id="disclosure_text"
              rows={2}
              placeholder={t.agents.detail.draft.disclosureTextPlaceholder}
              disabled={!canManage}
              {...register('disclosure_text')}
              className={fieldInputCls}
            />
          </div>
        </div>

        {canManage && (
          <Button type="submit" disabled={isPending}>
            {t.agents.detail.draft.save}
          </Button>
        )}
      </form>
    </FormProvider>
  );
}

export function AgentDraftTab({ agent }: Props) {
  const { draft, isLoading } = useAgentDraft(agent.id);
  const { can } = usePermissions();
  const canManage = can('agent', 'manage');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.agents.detail.draft.title}</CardTitle>
        <p className="text-muted-foreground text-sm">{t.agents.detail.draft.description}</p>
      </CardHeader>
      <CardContent>
        {isLoading || !draft ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-9 w-40" />
          </div>
        ) : (
          <DraftForm agent={agent} draft={draft} canManage={canManage} />
        )}
      </CardContent>
    </Card>
  );
}
