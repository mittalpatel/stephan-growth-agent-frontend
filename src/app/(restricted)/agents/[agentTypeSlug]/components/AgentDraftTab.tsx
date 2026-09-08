'use client';

import { FormProvider } from 'react-hook-form';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RHFSwitchField, RHFTextField } from '@/components/common/form';
import { fieldInputCls, fieldLabelCls } from '@/components/common/form/fieldStyles';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from '@/lib/i18n';
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
  const { form, isPending, submit } = useAgentDraftForm(agent.id, draft, agent.enabled_languages);
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

        {agent.enabled_languages.map((lang) => (
          <div key={lang} className="border-border space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold">
              {format(t.agents.detail.draft.localizedTextTitle, { language: lang })}
            </h3>
            <RHFTextField<AgentDraftFormValues>
              name={`localized_text.${lang}.greeting`}
              label={t.agents.detail.draft.greetingLabel}
              placeholder={t.agents.detail.draft.greetingPlaceholder}
              disabled={!canManage}
              required
            />
            <div>
              <label className={fieldLabelCls} htmlFor={`fallback_message-${lang}`}>
                {t.agents.detail.draft.fallbackMessageLabel}
              </label>
              <textarea
                id={`fallback_message-${lang}`}
                rows={2}
                placeholder={t.agents.detail.draft.fallbackMessagePlaceholder}
                disabled={!canManage}
                {...register(`localized_text.${lang}.fallback_message`)}
                className={fieldInputCls}
              />
            </div>
            <div>
              <label className={fieldLabelCls} htmlFor={`disclosure_text-${lang}`}>
                {t.agents.detail.draft.disclosureTextLabel}
              </label>
              <textarea
                id={`disclosure_text-${lang}`}
                rows={2}
                placeholder={t.agents.detail.draft.disclosureTextPlaceholder}
                disabled={!canManage}
                {...register(`localized_text.${lang}.disclosure_text`)}
                className={fieldInputCls}
              />
            </div>
          </div>
        ))}

        <div className="border-border space-y-4 border-t pt-4">
          <h3 className="text-sm font-semibold">{t.agents.detail.draft.themeTitle}</h3>
          <RHFTextField<AgentDraftFormValues>
            name="theme_primary_color"
            label={t.agents.detail.draft.primaryColorLabel}
            placeholder={t.agents.detail.draft.primaryColorPlaceholder}
            disabled={!canManage}
          />
          <RHFTextField<AgentDraftFormValues>
            name="theme_logo_url"
            label={t.agents.detail.draft.logoUrlLabel}
            placeholder={t.agents.detail.draft.logoUrlPlaceholder}
            disabled={!canManage}
          />
          <RHFTextField<AgentDraftFormValues>
            name="theme_launcher_position"
            label={t.agents.detail.draft.launcherPositionLabel}
            placeholder={t.agents.detail.draft.launcherPositionPlaceholder}
            disabled={!canManage}
          />
        </div>

        <div className="border-border space-y-4 border-t pt-4">
          <div>
            <label className={fieldLabelCls} htmlFor="behavior_config">
              {t.agents.detail.draft.behaviorConfigLabel}
            </label>
            <textarea
              id="behavior_config"
              rows={4}
              placeholder={t.agents.detail.draft.configPlaceholder}
              disabled={!canManage}
              {...register('behavior_config')}
              className={`${fieldInputCls} font-mono text-xs`}
            />
            {form.formState.errors.behavior_config && (
              <p className="text-destructive mt-1 text-xs">
                {form.formState.errors.behavior_config.message}
              </p>
            )}
          </div>
          <div>
            <label className={fieldLabelCls} htmlFor="qualification_config">
              {t.agents.detail.draft.qualificationConfigLabel}
            </label>
            <textarea
              id="qualification_config"
              rows={4}
              placeholder={t.agents.detail.draft.configPlaceholder}
              disabled={!canManage}
              {...register('qualification_config')}
              className={`${fieldInputCls} font-mono text-xs`}
            />
            {form.formState.errors.qualification_config && (
              <p className="text-destructive mt-1 text-xs">
                {form.formState.errors.qualification_config.message}
              </p>
            )}
          </div>
          <div>
            <label className={fieldLabelCls} htmlFor="notes">
              {t.agents.detail.draft.notesLabel}
            </label>
            <textarea
              id="notes"
              rows={2}
              placeholder={t.agents.detail.draft.notesPlaceholder}
              disabled={!canManage}
              {...register('notes')}
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
