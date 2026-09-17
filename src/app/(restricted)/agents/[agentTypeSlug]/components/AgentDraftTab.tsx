'use client';

import { ChevronDown, PencilLine } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { FormProvider, useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  RHFCheckboxGroupField,
  RHFColorField,
  RHFObjectListField,
  RHFSelectField,
  RHFStringListField,
  RHFSwitchField,
  RHFTextField,
  RHFTextareaField,
  type ObjectListColumn,
  type SelectFieldOption,
} from '@/components/common/form';
import {
  fieldDescriptionCls,
  fieldInputCls,
  fieldLabelCls,
} from '@/components/common/form/fieldStyles';
import { Skeleton } from '@/components/ui/skeleton';
import { useBeforeUnloadWarning } from '@/hooks/useBeforeUnloadWarning';
import {
  CONTRAST_CHECKED_PAIRS,
  MAX_QUALIFICATION_QUESTIONS,
  MAX_QUESTION_WEIGHT,
  MIN_QUESTION_WEIGHT,
  QUALIFIABLE_LEAD_FIELDS,
  type ThemeColorKey,
} from '@/lib/constants/agentTheme';
import { checkContrast, isValidHexColor } from '@/lib/contrast';
import { format } from '@/lib/i18n';
import { t } from '@/locales';
import type { Agent, AgentVersionDetail } from '@/types/agent';

import { useAgentDraft } from '../hooks/useAgentDraft';
import { useAgentDraftForm } from '../hooks/useAgentDraftForm';
import { WidgetPreview } from './WidgetPreview';
import type { AgentDraftFormValues } from '@/lib/schemas/agent';

type Props = Readonly<{ agent: Agent; onDirtyChange?: (dirty: boolean) => void }>;

function optionsFromMap(map: Record<string, string>): SelectFieldOption[] {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

/** The three `Lead` fields a rule may reference, labelled. Built from the
 * mirrored constant rather than hand-listed so it cannot drift from what the
 * backend accepts. */
const QUALIFIABLE_FIELD_OPTIONS: SelectFieldOption[] = QUALIFIABLE_LEAD_FIELDS.map((value) => ({
  value,
  label: t.agents.detail.draft.qualifiableField[value],
}));

const QUALIFICATION_QUESTION_COLUMNS: ObjectListColumn[] = [
  {
    key: 'field',
    label: t.agents.detail.draft.qualificationFieldColumn,
    type: 'select',
    options: QUALIFIABLE_FIELD_OPTIONS,
    className: 'flex-1',
  },
  {
    key: 'weight',
    label: t.agents.detail.draft.qualificationWeightColumn,
    type: 'number',
    min: MIN_QUESTION_WEIGHT,
    max: MAX_QUESTION_WEIGHT,
    className: 'w-24 shrink-0',
  },
];

const THEME_COLOR_FIELD_KEYS = [
  'primary',
  'secondary',
  'background',
  'surface',
  'text',
  'success',
  'warning',
  'error',
] as const satisfies readonly ThemeColorKey[];

/**
 * Every `CONTRAST_CHECKED_PAIRS` pair currently failing AA, given the form's
 * current colors — the same pairs `ThemeValidationService._assert_colors_pass_contrast`
 * checks server-side, computed locally so the operator sees it before ever
 * submitting (see `lib/contrast.ts`'s docstring on why this isn't a network
 * call per keystroke). Skips a pair where either color isn't a valid hex yet,
 * same as the server does for an unset key.
 */
function getContrastFailures(colors: Partial<Record<ThemeColorKey, string>>) {
  return CONTRAST_CHECKED_PAIRS.map(([fgKey, bgKey]) => ({
    fgKey,
    bgKey,
    fg: colors[fgKey],
    bg: colors[bgKey],
  }))
    .filter(
      (p): p is { fgKey: ThemeColorKey; bgKey: ThemeColorKey; fg: string; bg: string } =>
        isValidHexColor(p.fg) && isValidHexColor(p.bg)
    )
    .map(({ fgKey, bgKey, fg, bg }) => ({ fgKey, bgKey, ...checkContrast(fg, bg) }))
    .filter((r) => !r.passesAaNormalText);
}

/**
 * Live pass/fail for one foreground color against every background it is
 * checked against server-side. Shows the worst of the applicable pairs, with
 * a one-click fix that writes the suggested fallback straight onto the
 * field; the Save button below is disabled while any pair is failing, so a
 * submit can no longer reach the server just to bounce off the same check
 * with a generic 400.
 */
function ColorContrastNotice({
  fgKey,
  colors,
}: Readonly<{ fgKey: ThemeColorKey; colors: Partial<Record<ThemeColorKey, string>> }>) {
  const { setValue } = useFormContext<AgentDraftFormValues>();

  const failing = getContrastFailures(colors).find((r) => r.fgKey === fgKey);
  if (!failing) return null;

  return (
    <p className="text-error mt-1 text-xs">
      {format(t.agents.detail.draft.contrastFailing, {
        ratio: failing.ratio.toFixed(2),
        against: t.agents.detail.draft[`color${capitalize(failing.bgKey)}Label`],
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

function ThemeColorsSection({
  disabled,
  colorsByKey,
}: Readonly<{ disabled: boolean; colorsByKey: Partial<Record<ThemeColorKey, string>> }>) {
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
              description={t.agents.detail.draft[`color${capitalize(key)}Description`]}
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

/**
 * A named, collapsible group of draft fields. Collapsing is presentational
 * only — React Hook Form keeps every field's value in its internal state
 * regardless of mount/unmount (no `shouldUnregister` is set anywhere in
 * `useAgentDraftForm`), so a value entered in a section, then collapsed,
 * still submits correctly.
 */
function DraftSection({
  title,
  description,
  defaultOpen,
  children,
}: Readonly<{ title: string; description?: string; defaultOpen: boolean; children: ReactNode }>) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="border-border bg-card rounded-xl border px-5 py-4"
    >
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 text-left">
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{title}</span>
          {description && (
            <span className="text-muted-foreground mt-0.5 block text-xs">{description}</span>
          )}
        </span>
        <ChevronDown
          className="text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-5 space-y-6">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function DraftForm({
  agent,
  draft,
  canManage,
  onDirtyChange,
}: Readonly<{
  agent: Agent;
  draft: AgentVersionDetail;
  canManage: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}>) {
  const { form, isPending, submit, resetToOrgDefault, isResettingToOrgDefault } = useAgentDraftForm(
    agent.id,
    draft,
    agent.enabled_languages
  );
  const { register } = form;
  const isDirty = form.formState.isDirty;

  // This tab's content is unmounted by Radix the moment another tab is
  // selected, taking every unsaved field with it, so the detail view has to
  // know about pending edits from out here to be able to warn first.
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Unmount is also how "discard" is carried out, so clear the flag on the way
  // out or the warning would outlive the form it belongs to.
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  useBeforeUnloadWarning(isDirty);
  const watchedColors = useWatch({ control: form.control });
  const humanHandoffEnabled = watchedColors.human_handoff_enabled !== false;
  const leadCaptureEnabled = watchedColors.lead_capture_enabled !== false;
  const colorsByKey = Object.fromEntries(
    THEME_COLOR_FIELD_KEYS.map((key) => [
      key,
      (watchedColors as Record<string, string>)[`color_${key}`],
    ])
  ) as Partial<Record<ThemeColorKey, string>>;
  const hasContrastFailure = getContrastFailures(colorsByKey).length > 0;

  return (
    <FormProvider {...form}>
      <form onSubmit={submit}>
        <div className="space-y-4">
          <p className="border-border text-muted-foreground rounded-md border border-dashed px-3 py-2 text-xs">
            {t.agents.detail.draft.livePreviewNote}
          </p>

          <DraftSection
            title={t.agents.detail.draft.basicsHeading}
            description={t.agents.detail.draft.basicsDescription}
            defaultOpen
          >
            <div>
              <label className={fieldLabelCls} htmlFor="instructions">
                {t.agents.detail.draft.instructionsLabel}
              </label>
              <p className={fieldDescriptionCls}>{t.agents.detail.draft.instructionsDescription}</p>
              <textarea
                id="instructions"
                rows={6}
                placeholder={t.agents.detail.draft.instructionsPlaceholder}
                disabled={!canManage}
                {...register('instructions')}
                className={fieldInputCls}
              />
            </div>

            <RHFTextField<AgentDraftFormValues>
              name="display_name"
              label={t.agents.detail.draft.displayNameLabel}
              description={t.agents.detail.draft.displayNameDescription}
              placeholder={agent.name}
              disabled={!canManage}
            />

            <RHFSwitchField<AgentDraftFormValues>
              name="disclosure_enabled"
              label={t.agents.detail.draft.disclosureEnabledLabel}
              description={t.agents.detail.draft.disclosureEnabledDescription}
              disabled={!canManage}
            />
          </DraftSection>

          {agent.enabled_languages.map((lang) => (
            <DraftSection
              key={lang}
              title={format(t.agents.detail.draft.localizedTextTitle, {
                language: lang.toUpperCase(),
              })}
              description={t.agents.detail.draft.localizedTextDescription}
              defaultOpen
            >
              <RHFTextField<AgentDraftFormValues>
                name={`localized_text.${lang}.greeting`}
                label={t.agents.detail.draft.greetingLabel}
                description={t.agents.detail.draft.greetingDescription}
                placeholder={t.agents.detail.draft.greetingPlaceholder}
                disabled={!canManage}
                required
              />
              <div>
                <label className={fieldLabelCls} htmlFor={`fallback_message-${lang}`}>
                  {t.agents.detail.draft.fallbackMessageLabel}
                </label>
                <p className={fieldDescriptionCls}>
                  {t.agents.detail.draft.fallbackMessageDescription}
                </p>
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
                <p className={fieldDescriptionCls}>
                  {t.agents.detail.draft.disclosureTextDescription}
                </p>
                <textarea
                  id={`disclosure_text-${lang}`}
                  rows={2}
                  placeholder={t.agents.detail.draft.disclosureTextPlaceholder}
                  disabled={!canManage}
                  {...register(`localized_text.${lang}.disclosure_text`)}
                  className={fieldInputCls}
                />
              </div>
              <div>
                <label className={fieldLabelCls} htmlFor={`unsupported_language_message-${lang}`}>
                  {t.agents.detail.draft.unsupportedLanguageMessageLabel}
                </label>
                <p className={fieldDescriptionCls}>
                  {t.agents.detail.draft.unsupportedLanguageMessageDescription}
                </p>
                <textarea
                  id={`unsupported_language_message-${lang}`}
                  rows={2}
                  placeholder={t.agents.detail.draft.unsupportedLanguageMessagePlaceholder}
                  disabled={!canManage}
                  {...register(`localized_text.${lang}.unsupported_language_message`)}
                  className={fieldInputCls}
                />
              </div>
              <div>
                <label className={fieldLabelCls} htmlFor={`consent_text-${lang}`}>
                  {t.agents.detail.draft.consentTextLabel}
                </label>
                <p className={fieldDescriptionCls}>
                  {t.agents.detail.draft.consentTextDescription}
                </p>
                <textarea
                  id={`consent_text-${lang}`}
                  rows={2}
                  placeholder={t.agents.detail.draft.consentTextPlaceholder}
                  disabled={!canManage}
                  {...register(`localized_text.${lang}.consent_text`)}
                  className={fieldInputCls}
                />
              </div>
              <div>
                <label className={fieldLabelCls} htmlFor={`thank_you_text-${lang}`}>
                  {t.agents.detail.draft.thankYouTextLabel}
                </label>
                <p className={fieldDescriptionCls}>
                  {t.agents.detail.draft.thankYouTextDescription}
                </p>
                <textarea
                  id={`thank_you_text-${lang}`}
                  rows={2}
                  placeholder={t.agents.detail.draft.thankYouTextPlaceholder}
                  disabled={!canManage}
                  {...register(`localized_text.${lang}.thank_you_text`)}
                  className={fieldInputCls}
                />
              </div>
            </DraftSection>
          ))}

          <DraftSection title={t.agents.detail.draft.themeTitle} defaultOpen>
            {canManage && (
              <div className="flex items-start justify-end gap-4">
                <div className="text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isResettingToOrgDefault}
                    onClick={() => void resetToOrgDefault()}
                  >
                    {t.agents.detail.draft.resetToOrgDefault}
                  </Button>
                  <p className="text-muted-foreground mt-1 max-w-52 text-xs">
                    {t.agents.detail.draft.resetToOrgDefaultConfirmDescription}
                  </p>
                </div>
              </div>
            )}

            <ThemeColorsSection disabled={!canManage} colorsByKey={colorsByKey} />

            <div>
              <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                {t.agents.detail.draft.themeTypographyHeading}
              </h4>
              <RHFSelectField<AgentDraftFormValues>
                name="typography_font_family"
                label={t.agents.detail.draft.typographyFontFamilyLabel}
                description={t.agents.detail.draft.typographyFontFamilyDescription}
                options={optionsFromMap(t.agents.detail.draft.typographyFontFamilyOptions)}
                placeholder={t.agents.detail.draft.useDefault}
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
                  description={t.agents.detail.draft.widgetPositionDescription}
                  options={optionsFromMap(t.agents.detail.draft.widgetPositionOptions)}
                  placeholder={t.agents.detail.draft.useDefault}
                  disabled={!canManage}
                />
                <RHFSelectField<AgentDraftFormValues>
                  name="widget_launcher_shape"
                  label={t.agents.detail.draft.widgetLauncherShapeLabel}
                  description={t.agents.detail.draft.widgetLauncherShapeDescription}
                  options={optionsFromMap(t.agents.detail.draft.widgetLauncherShapeOptions)}
                  placeholder={t.agents.detail.draft.useDefault}
                  disabled={!canManage}
                />
                <RHFSelectField<AgentDraftFormValues>
                  name="widget_mode"
                  label={t.agents.detail.draft.widgetModeLabel}
                  description={t.agents.detail.draft.widgetModeDescription}
                  options={optionsFromMap(t.agents.detail.draft.widgetModeOptions)}
                  placeholder={t.agents.detail.draft.useDefault}
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
                  description={t.agents.detail.draft.logoLogoUrlDescription}
                  placeholder={t.agents.detail.draft.logoLogoUrlPlaceholder}
                  disabled={!canManage}
                />
                <RHFTextField<AgentDraftFormValues>
                  name="logo_favicon_url"
                  label={t.agents.detail.draft.logoFaviconUrlLabel}
                  description={t.agents.detail.draft.logoFaviconUrlDescription}
                  placeholder={t.agents.detail.draft.logoFaviconUrlPlaceholder}
                  disabled={!canManage}
                />
              </div>
            </div>
          </DraftSection>

          <DraftSection title={t.agents.detail.draft.behaviorRuntimeHeading} defaultOpen={false}>
            <div>
              <p className="text-muted-foreground -mt-2 text-xs">
                {t.agents.detail.draft.behaviorRuntimeDescription}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <RHFTextField<AgentDraftFormValues>
                  name="groundedness_threshold"
                  type="number"
                  label={t.agents.detail.draft.groundednessThresholdLabel}
                  description={t.agents.detail.draft.groundednessThresholdDescription}
                  placeholder={t.agents.detail.draft.groundednessThresholdPlaceholder}
                  disabled={!canManage}
                />
                <RHFSelectField<AgentDraftFormValues>
                  name="unsupported_language_behavior"
                  label={t.agents.detail.draft.unsupportedLanguageBehaviorLabel}
                  description={t.agents.detail.draft.unsupportedLanguageBehaviorDescription}
                  options={optionsFromMap(t.agents.detail.draft.unsupportedLanguageBehaviorOptions)}
                  placeholder={t.agents.detail.draft.useDefault}
                  disabled={!canManage}
                />
                <RHFTextField<AgentDraftFormValues>
                  name="retrieval_context_turns"
                  type="number"
                  label={t.agents.detail.draft.retrievalContextTurnsLabel}
                  description={t.agents.detail.draft.retrievalContextTurnsDescription}
                  placeholder={t.agents.detail.draft.retrievalContextTurnsPlaceholder}
                  disabled={!canManage}
                />
                <RHFTextField<AgentDraftFormValues>
                  name="max_history_messages"
                  type="number"
                  label={t.agents.detail.draft.maxHistoryMessagesLabel}
                  description={t.agents.detail.draft.maxHistoryMessagesDescription}
                  placeholder={t.agents.detail.draft.maxHistoryMessagesPlaceholder}
                  disabled={!canManage}
                />
              </div>
              <RHFStringListField<AgentDraftFormValues>
                name="moderation_self_harm_categories"
                label={t.agents.detail.draft.moderationCategoriesLabel}
                description={t.agents.detail.draft.moderationCategoriesDescription}
                itemPlaceholder={t.agents.detail.draft.moderationCategoriesPlaceholder}
                addLabel={t.agents.detail.draft.addListItem}
                removeLabel={t.agents.detail.draft.removeListItem}
                disabled={!canManage}
                maxItems={20}
                className="mt-4"
              />
              <RHFSwitchField<AgentDraftFormValues>
                name="send_information_email_enabled"
                label={t.agents.detail.draft.sendInformationEmailEnabledLabel}
                description={t.agents.detail.draft.sendInformationEmailEnabledDescription}
                disabled={!canManage}
              />
            </div>
          </DraftSection>

          <DraftSection title={t.agents.detail.draft.handoffHeading} defaultOpen={false}>
            <p className="text-muted-foreground -mt-2 text-xs">
              {t.agents.detail.draft.handoffDescription}
            </p>
            <RHFSwitchField<AgentDraftFormValues>
              name="human_handoff_enabled"
              label={t.agents.detail.draft.humanHandoffEnabledLabel}
              description={t.agents.detail.draft.humanHandoffEnabledDescription}
              disabled={!canManage}
            />
            <RHFStringListField<AgentDraftFormValues>
              name="handoff_trigger_phrases"
              label={t.agents.detail.draft.handoffTriggerPhrasesLabel}
              description={t.agents.detail.draft.handoffTriggerPhrasesDescription}
              itemPlaceholder={t.agents.detail.draft.handoffTriggerPhrasePlaceholder}
              addLabel={t.agents.detail.draft.addListItem}
              removeLabel={t.agents.detail.draft.removeListItem}
              disabled={!canManage || !humanHandoffEnabled}
            />
          </DraftSection>

          <DraftSection title={t.agents.detail.draft.qualificationHeading} defaultOpen={false}>
            <p className="text-muted-foreground -mt-2 text-xs">
              {t.agents.detail.draft.qualificationDescription}
            </p>
            <RHFSwitchField<AgentDraftFormValues>
              name="lead_capture_enabled"
              label={t.agents.detail.draft.leadCaptureEnabledLabel}
              description={t.agents.detail.draft.leadCaptureEnabledDescription}
              disabled={!canManage}
            />
            <RHFStringListField<AgentDraftFormValues>
              name="qualification_trigger_phrases"
              label={t.agents.detail.draft.qualificationTriggerPhrasesLabel}
              description={t.agents.detail.draft.qualificationTriggerPhrasesDescription}
              itemPlaceholder={t.agents.detail.draft.qualificationTriggerPhrasePlaceholder}
              addLabel={t.agents.detail.draft.addListItem}
              removeLabel={t.agents.detail.draft.removeListItem}
              disabled={!canManage || !leadCaptureEnabled}
            />
            <RHFCheckboxGroupField<AgentDraftFormValues>
              name="qualification_required_fields"
              label={t.agents.detail.draft.qualificationRequiredFieldsLabel}
              description={t.agents.detail.draft.qualificationRequiredFieldsDescription}
              options={QUALIFIABLE_FIELD_OPTIONS}
              disabled={!canManage}
            />
            <RHFCheckboxGroupField<AgentDraftFormValues>
              name="qualification_form_required_fields"
              label={t.agents.detail.draft.qualificationFormRequiredFieldsLabel}
              description={t.agents.detail.draft.qualificationFormRequiredFieldsDescription}
              options={QUALIFIABLE_FIELD_OPTIONS}
              disabled={!canManage || !leadCaptureEnabled}
            />
            <RHFObjectListField<AgentDraftFormValues>
              name="qualification_questions"
              label={t.agents.detail.draft.qualificationQuestionsLabel}
              description={t.agents.detail.draft.qualificationQuestionsDescription}
              emptyLabel={t.agents.detail.draft.qualificationQuestionsEmpty}
              columns={QUALIFICATION_QUESTION_COLUMNS}
              emptyRow={{ field: QUALIFIABLE_LEAD_FIELDS[0], weight: MIN_QUESTION_WEIGHT }}
              addLabel={t.agents.detail.draft.qualificationAddQuestion}
              removeLabel={t.agents.detail.draft.qualificationRemoveQuestion}
              maxItems={MAX_QUALIFICATION_QUESTIONS}
              disabled={!canManage}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <RHFTextField<AgentDraftFormValues>
                name="qualification_qualified_threshold"
                type="number"
                label={t.agents.detail.draft.qualificationQualifiedThresholdLabel}
                description={t.agents.detail.draft.qualificationQualifiedThresholdDescription}
                disabled={!canManage}
              />
              <RHFTextField<AgentDraftFormValues>
                name="qualification_partial_threshold"
                type="number"
                label={t.agents.detail.draft.qualificationPartialThresholdLabel}
                description={t.agents.detail.draft.qualificationPartialThresholdDescription}
                disabled={!canManage}
              />
            </div>
          </DraftSection>

          <DraftSection title={t.agents.detail.draft.advancedHeading} defaultOpen={false}>
            <p className="text-muted-foreground -mt-2 text-xs">
              {t.agents.detail.draft.advancedDescription}
            </p>
            <RHFStringListField<AgentDraftFormValues>
              name="suggested_questions"
              label={t.agents.detail.draft.suggestedQuestionsLabel}
              description={t.agents.detail.draft.suggestedQuestionsDescription}
              itemPlaceholder={t.agents.detail.draft.suggestedQuestionsPlaceholder}
              addLabel={t.agents.detail.draft.addListItem}
              removeLabel={t.agents.detail.draft.removeListItem}
              disabled={!canManage}
              maxItems={6}
            />
            <RHFStringListField<AgentDraftFormValues>
              name="prohibited_claims"
              label={t.agents.detail.draft.prohibitedClaimsLabel}
              description={t.agents.detail.draft.prohibitedClaimsDescription}
              itemPlaceholder={t.agents.detail.draft.prohibitedClaimsPlaceholder}
              addLabel={t.agents.detail.draft.addListItem}
              removeLabel={t.agents.detail.draft.removeListItem}
              disabled={!canManage}
            />
            <RHFTextareaField<AgentDraftFormValues>
              name="behavior_config_advanced"
              label={t.agents.detail.draft.behaviorConfigAdvancedLabel}
              description={t.agents.detail.draft.behaviorConfigAdvancedDescription}
              placeholder={t.agents.detail.draft.configPlaceholder}
              disabled={!canManage}
              rows={4}
              className="font-mono text-xs"
            />
          </DraftSection>

          {/* Sticky, because the form is long: an edit to the instructions at
              the top used to mean scrolling past every section to find Save. */}
          {canManage && (
            <div className="border-border bg-card sticky bottom-0 z-10 -mx-4 border-t px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isPending || hasContrastFailure || !isDirty}>
                  {isPending ? t.agents.detail.draft.saving : t.agents.detail.draft.save}
                </Button>
                {isDirty && !isPending && (
                  <>
                    <Button type="button" variant="ghost" onClick={() => form.reset()}>
                      {t.agents.detail.draft.discardChanges}
                    </Button>
                    <p className="text-muted-foreground text-xs">
                      {t.agents.detail.draft.unsavedChanges}
                    </p>
                  </>
                )}
              </div>
              {hasContrastFailure && (
                <p className="text-error mt-2 text-xs">
                  {t.agents.detail.draft.saveBlockedByContrast}
                </p>
              )}
            </div>
          )}
        </div>

        <WidgetPreview defaultLanguage={agent.default_language} agentName={agent.name} />
      </form>
    </FormProvider>
  );
}

export function AgentDraftTab({ agent, onDirtyChange }: Props) {
  const { draft, isLoading, isNotFound, createDraft, isCreatingDraft } = useAgentDraft(agent.id);
  const { can } = usePermissions();
  const canManage = can('agent', 'manage');

  const handleStartEditing = async () => {
    try {
      await createDraft();
    } catch {
      toast.error(t.agents.toast.draftCreateFailed);
    }
  };

  function renderBody() {
    if (isLoading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      );
    }
    if (isNotFound || !draft) {
      return (
        <EmptyState
          icon={PencilLine}
          title={t.agents.detail.draft.noDraftYet}
          action={
            canManage ? (
              <Button onClick={handleStartEditing} disabled={isCreatingDraft}>
                {t.agents.detail.draft.startEditing}
              </Button>
            ) : undefined
          }
        />
      );
    }
    return (
      <DraftForm agent={agent} draft={draft} canManage={canManage} onDirtyChange={onDirtyChange} />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.agents.detail.draft.title}</CardTitle>
        <p className="text-muted-foreground text-sm">{t.agents.detail.draft.description}</p>
      </CardHeader>
      <CardContent>{renderBody()}</CardContent>
    </Card>
  );
}
