'use client';

import { FormProvider, useFormContext, useWatch } from 'react-hook-form';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  RHFColorField,
  RHFSelectField,
  RHFStringListField,
  RHFSwitchField,
  RHFTextField,
  RHFTextareaField,
  type SelectFieldOption,
} from '@/components/common/form';
import { fieldInputCls, fieldLabelCls } from '@/components/common/form/fieldStyles';
import { Skeleton } from '@/components/ui/skeleton';
import { CONTRAST_CHECKED_PAIRS, type ThemeColorKey } from '@/lib/constants/agentTheme';
import { checkContrast, isValidHexColor } from '@/lib/contrast';
import { format } from '@/lib/i18n';
import { t } from '@/locales';
import type { Agent, AgentVersionDetail } from '@/types/agent';

import { useAgentDraft } from '../hooks/useAgentDraft';
import { useAgentDraftForm } from '../hooks/useAgentDraftForm';
import { WidgetPreview } from './WidgetPreview';
import type { AgentDraftFormValues } from '@/lib/schemas/agent';

type Props = Readonly<{ agent: Agent }>;

function optionsFromMap(map: Record<string, string>): SelectFieldOption[] {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

const THEME_COLOR_FIELD_KEYS = [
  'primary',
  'secondary',
  'accent',
  'background',
  'surface',
  'text',
  'success',
  'warning',
  'error',
] as const satisfies readonly ThemeColorKey[];

/**
 * Live pass/fail for one foreground color against every background it is
 * checked against server-side (`CONTRAST_CHECKED_PAIRS`) — computed locally
 * via `checkContrast` (see that file's docstring on why this isn't a network
 * call per keystroke). Shows the worst of the applicable pairs, with a
 * one-click fix that writes the suggested fallback straight onto the field;
 * a real submit still runs the same check server-side as the final
 * authority.
 */
function ColorContrastNotice({
  fgKey,
  colors,
}: Readonly<{ fgKey: ThemeColorKey; colors: Partial<Record<ThemeColorKey, string>> }>) {
  const { setValue } = useFormContext<AgentDraftFormValues>();
  const fg = colors[fgKey];
  if (!isValidHexColor(fg)) return null;

  const failing = CONTRAST_CHECKED_PAIRS.filter(([f]) => f === fgKey)
    .map(([, bgKey]) => ({ bgKey, bg: colors[bgKey] }))
    .filter((p): p is { bgKey: ThemeColorKey; bg: string } => isValidHexColor(p.bg))
    .map(({ bgKey, bg }) => ({ bgKey, ...checkContrast(fg, bg) }))
    .find((r) => !r.passesAaNormalText);

  if (!failing) return null;

  return (
    <p className="text-error mt-1 text-xs">
      {format(t.agents.detail.draft.contrastFailing, {
        ratio: failing.ratio.toFixed(2),
        against: failing.bgKey,
      })}
      {failing.suggestedFallback && (
        <>
          {' '}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() =>
              setValue(`color_${fgKey}`, failing.suggestedFallback as string, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            {format(t.agents.detail.draft.useSuggestedColor, {
              color: failing.suggestedFallback,
            })}
          </button>
        </>
      )}
    </p>
  );
}

function ThemeColorsSection({ disabled }: Readonly<{ disabled: boolean }>) {
  const values = useWatch<AgentDraftFormValues>();
  const colorsByKey = Object.fromEntries(
    THEME_COLOR_FIELD_KEYS.map((key) => [key, (values as Record<string, string>)[`color_${key}`]])
  ) as Partial<Record<ThemeColorKey, string>>;

  return (
    <div>
      <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
        {t.agents.detail.draft.themeColorsHeading}
      </h4>
      <div className="grid gap-4 sm:grid-cols-3">
        {THEME_COLOR_FIELD_KEYS.map((key) => (
          <div key={key}>
            <RHFColorField<AgentDraftFormValues>
              name={`color_${key}`}
              label={t.agents.detail.draft[`color${capitalize(key)}Label`]}
              placeholder={t.agents.detail.draft.colorPlaceholder}
              disabled={disabled}
            />
            <ColorContrastNotice fgKey={key} colors={colorsByKey} />
          </div>
        ))}
      </div>
    </div>
  );
}

function capitalize<S extends string>(value: S): Capitalize<S> {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<S>;
}

function DraftForm({
  agent,
  draft,
  canManage,
}: Readonly<{ agent: Agent; draft: AgentVersionDetail; canManage: boolean }>) {
  const { form, isPending, submit, resetToOrgDefault, isResettingToOrgDefault } = useAgentDraftForm(
    agent.id,
    draft,
    agent.enabled_languages
  );
  const { register } = form;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={submit}
        className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8"
      >
        <div className="space-y-4">
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

          <div className="border-border space-y-6 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t.agents.detail.draft.themeTitle}</h3>
              {canManage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isResettingToOrgDefault}
                  onClick={() => void resetToOrgDefault()}
                >
                  {t.agents.detail.draft.resetToOrgDefault}
                </Button>
              )}
            </div>

            <ThemeColorsSection disabled={!canManage} />

            <div>
              <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                {t.agents.detail.draft.themeTypographyHeading}
              </h4>
              <RHFSelectField<AgentDraftFormValues>
                name="typography_font_family"
                label={t.agents.detail.draft.typographyFontFamilyLabel}
                options={optionsFromMap(t.agents.detail.draft.typographyFontFamilyOptions)}
                placeholder="—"
                disabled={!canManage}
              />
            </div>

            <div>
              <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                {t.agents.detail.draft.themeWidgetHeading}
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <RHFSelectField<AgentDraftFormValues>
                  name="widget_position"
                  label={t.agents.detail.draft.widgetPositionLabel}
                  options={optionsFromMap(t.agents.detail.draft.widgetPositionOptions)}
                  placeholder="—"
                  disabled={!canManage}
                />
                <RHFSelectField<AgentDraftFormValues>
                  name="widget_launcher_shape"
                  label={t.agents.detail.draft.widgetLauncherShapeLabel}
                  options={optionsFromMap(t.agents.detail.draft.widgetLauncherShapeOptions)}
                  placeholder="—"
                  disabled={!canManage}
                />
                <RHFSelectField<AgentDraftFormValues>
                  name="widget_panel_size"
                  label={t.agents.detail.draft.widgetPanelSizeLabel}
                  options={optionsFromMap(t.agents.detail.draft.widgetPanelSizeOptions)}
                  placeholder="—"
                  disabled={!canManage}
                />
                <RHFSelectField<AgentDraftFormValues>
                  name="widget_shadow"
                  label={t.agents.detail.draft.widgetShadowLabel}
                  options={optionsFromMap(t.agents.detail.draft.widgetShadowOptions)}
                  placeholder="—"
                  disabled={!canManage}
                />
                <RHFSelectField<AgentDraftFormValues>
                  name="widget_mode"
                  label={t.agents.detail.draft.widgetModeLabel}
                  options={optionsFromMap(t.agents.detail.draft.widgetModeOptions)}
                  placeholder="—"
                  disabled={!canManage}
                />
                <RHFSelectField<AgentDraftFormValues>
                  name="widget_mobile_layout"
                  label={t.agents.detail.draft.widgetMobileLayoutLabel}
                  options={optionsFromMap(t.agents.detail.draft.widgetMobileLayoutOptions)}
                  placeholder="—"
                  disabled={!canManage}
                />
              </div>
            </div>

            <div>
              <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                {t.agents.detail.draft.themeLogoHeading}
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <RHFTextField<AgentDraftFormValues>
                  name="logo_logo_url"
                  label={t.agents.detail.draft.logoLogoUrlLabel}
                  placeholder={t.agents.detail.draft.logoLogoUrlPlaceholder}
                  disabled={!canManage}
                />
                <RHFTextField<AgentDraftFormValues>
                  name="logo_favicon_url"
                  label={t.agents.detail.draft.logoFaviconUrlLabel}
                  placeholder={t.agents.detail.draft.logoFaviconUrlPlaceholder}
                  disabled={!canManage}
                />
              </div>
            </div>
          </div>

          <div className="border-border space-y-6 border-t pt-4">
            <div>
              <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                {t.agents.detail.draft.behaviorVoiceHeading}
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <RHFSelectField<AgentDraftFormValues>
                  name="voice_answer_length"
                  label={t.agents.detail.draft.voiceAnswerLengthLabel}
                  options={optionsFromMap(t.agents.detail.draft.voiceAnswerLengthOptions)}
                  placeholder="—"
                  disabled={!canManage}
                />
                <RHFSelectField<AgentDraftFormValues>
                  name="voice_formality"
                  label={t.agents.detail.draft.voiceFormalityLabel}
                  options={optionsFromMap(t.agents.detail.draft.voiceFormalityOptions)}
                  placeholder="—"
                  disabled={!canManage}
                />
              </div>
              <RHFStringListField<AgentDraftFormValues>
                name="voice_terminology"
                label={t.agents.detail.draft.voiceTerminologyLabel}
                itemPlaceholder={t.agents.detail.draft.voiceTerminologyPlaceholder}
                addLabel={t.agents.detail.draft.addListItem}
                removeLabel={t.agents.detail.draft.removeListItem}
                disabled={!canManage}
                className="mt-4"
              />
              <RHFStringListField<AgentDraftFormValues>
                name="voice_prohibited_phrases"
                label={t.agents.detail.draft.voiceProhibitedPhrasesLabel}
                itemPlaceholder={t.agents.detail.draft.voiceProhibitedPhrasesPlaceholder}
                addLabel={t.agents.detail.draft.addListItem}
                removeLabel={t.agents.detail.draft.removeListItem}
                disabled={!canManage}
                className="mt-4"
              />
            </div>

            <RHFStringListField<AgentDraftFormValues>
              name="suggested_questions"
              label={t.agents.detail.draft.suggestedQuestionsLabel}
              itemPlaceholder={t.agents.detail.draft.suggestedQuestionsPlaceholder}
              addLabel={t.agents.detail.draft.addListItem}
              removeLabel={t.agents.detail.draft.removeListItem}
              disabled={!canManage}
              maxItems={6}
            />
            <RHFStringListField<AgentDraftFormValues>
              name="prohibited_claims"
              label={t.agents.detail.draft.prohibitedClaimsLabel}
              itemPlaceholder={t.agents.detail.draft.prohibitedClaimsPlaceholder}
              addLabel={t.agents.detail.draft.addListItem}
              removeLabel={t.agents.detail.draft.removeListItem}
              disabled={!canManage}
            />
          </div>

          <div className="border-border space-y-4 border-t pt-4">
            <div>
              <RHFTextareaField<AgentDraftFormValues>
                name="behavior_config_advanced"
                label={t.agents.detail.draft.behaviorConfigAdvancedLabel}
                placeholder={t.agents.detail.draft.configPlaceholder}
                disabled={!canManage}
                rows={4}
                className="font-mono text-xs"
              />
              <p className="text-muted-foreground mt-1.5 text-xs">
                {t.agents.detail.draft.behaviorConfigAdvancedDescription}
              </p>
            </div>
            <RHFTextareaField<AgentDraftFormValues>
              name="qualification_config"
              label={t.agents.detail.draft.qualificationConfigLabel}
              placeholder={t.agents.detail.draft.configPlaceholder}
              disabled={!canManage}
              rows={4}
              className="font-mono text-xs"
            />
            <RHFTextField<AgentDraftFormValues>
              name="notes"
              label={t.agents.detail.draft.notesLabel}
              placeholder={t.agents.detail.draft.notesPlaceholder}
              disabled={!canManage}
            />
          </div>

          {canManage && (
            <Button type="submit" disabled={isPending}>
              {t.agents.detail.draft.save}
            </Button>
          )}
        </div>

        <div className="mt-6 lg:sticky lg:top-4 lg:mt-0">
          <WidgetPreview defaultLanguage={agent.default_language} />
        </div>
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
