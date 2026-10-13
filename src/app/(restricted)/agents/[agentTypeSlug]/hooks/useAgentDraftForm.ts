'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { useForm, type UseFormSetError } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { checkContrast } from '@/lib/contrast';
import { format } from '@/lib/i18n';
import {
  AGENT_BY_TYPE_KEY,
  agentDraftEndpoint,
  agentDraftKey,
  agentThemeDefaultsEndpoint,
  agentThemeDefaultsKey,
} from '@/services/agents';
import {
  agentDraftUpdateSchema,
  type AgentDraftFormValues,
  type AgentDraftSubmitValues,
} from '@/lib/schemas/agent';
import type {
  AgentDraftUpdateInput,
  AgentVersionDetail,
  BehaviorConfig,
  LocalizedText,
  QualificationConfig,
  ThemeConfig,
} from '@/types/agent';
import type { ApiResponse } from '@/types/api';
import { t } from '@/locales';

type LocalizedTextFormValues = Record<
  string,
  {
    greeting: string;
    fallback_message: string;
    disclosure_text: string;
    unsupported_language_message: string;
    consent_text: string;
    thank_you_text: string;
  }
>;

type ThemeDefaultsResponse = { theme_config: ThemeConfig; behavior_config: BehaviorConfig };

function buildLocalizedTextDefaults(
  languages: string[],
  existing: Record<string, LocalizedText>
): LocalizedTextFormValues {
  return Object.fromEntries(
    languages.map((lang) => [
      lang,
      {
        greeting: existing[lang]?.greeting ?? '',
        fallback_message: existing[lang]?.fallback_message ?? '',
        disclosure_text: existing[lang]?.disclosure_text ?? '',
        unsupported_language_message: existing[lang]?.unsupported_language_message ?? '',
        consent_text: existing[lang]?.consent_text ?? '',
        thank_you_text: existing[lang]?.thank_you_text ?? '',
      },
    ])
  );
}

/** `RHFStringListField` needs `{ value: string }[]`; the wire format is
 * `string[]`. Converted only at this read/submit boundary. */
function toRows(values: string[] | undefined): { value: string }[] {
  return (values ?? []).map((value) => ({ value }));
}
function fromRows(rows: { value: string }[] | undefined): string[] {
  return (rows ?? []).map((row) => row.value.trim()).filter(Boolean);
}

/**
 * `theme_config.launcher_position` (the pre-existing flat convention, still
 * free text like `bottom-right`) predates `theme_config.widget.position`
 * (the new enum, `bottom_right`). A draft saved by the old UI has the value
 * in the old key with hyphens; this affordance lets it still pre-select the
 * matching new enum option instead of the field silently appearing unset.
 */
function legacyPositionToEnum(value: string | undefined): string {
  return typeof value === 'string' ? value.replaceAll('-', '_') : '';
}

function colorFieldsFromConfig(theme: ThemeConfig & Record<string, unknown>) {
  const colors = theme.colors ?? {};
  const legacyPrimary = typeof theme.primary_color === 'string' ? theme.primary_color : '';
  return {
    color_primary: colors.primary ?? legacyPrimary,
    color_secondary: colors.secondary ?? '',
    color_background: colors.background ?? '',
    color_surface: colors.surface ?? '',
    color_text: colors.text ?? '',
    color_success: colors.success ?? '',
    color_warning: colors.warning ?? '',
    color_error: colors.error ?? '',
  };
}

function widgetFieldsFromConfig(theme: ThemeConfig & Record<string, unknown>) {
  const widget = theme.widget ?? {};
  const legacyPosition =
    typeof theme.launcher_position === 'string' ? theme.launcher_position : undefined;
  return {
    widget_position: widget.position ?? legacyPositionToEnum(legacyPosition),
    widget_launcher_shape: widget.launcher_shape ?? '',
    widget_mode: widget.mode ?? '',
  };
}

/** Splits a stored/cascaded `theme_config` into this form's flat fields,
 * falling back to the pre-existing flat `*_color`/`logo_url`/
 * `launcher_position` keys a draft saved by the old UI still has. */
function themeFieldsFromConfig(theme: ThemeConfig & Record<string, unknown>) {
  const logo = theme.logo ?? {};
  const legacyLogoUrl = typeof theme.logo_url === 'string' ? theme.logo_url : '';
  return {
    ...colorFieldsFromConfig(theme),
    typography_font_family: theme.typography?.font_family ?? '',
    ...widgetFieldsFromConfig(theme),
    logo_logo_url: logo.logo_url ?? legacyLogoUrl,
    logo_favicon_url: logo.favicon_url ?? '',
  };
}

/** Splits a stored/cascaded `behavior_config` into this form's flat fields.
 * As of 2026-09-09 this covers every key `ThemeValidationService
 * .validate_behavior_config` validates — `groundedness_threshold`,
 * `retrieval_context_turns`, `max_history_messages`,
 * `moderation_self_harm_categories`, `unsupported_language_behavior` — all
 * stripped from the raw-JSON advanced field so the two representations
 * never fight over the same data. Anything else (e.g. an org-cascaded
 * `voice.tone`) stays in the advanced field, unvalidated. */
function behaviorFieldsFromConfig(behavior: BehaviorConfig & Record<string, unknown>) {
  const rest = { ...behavior };
  delete rest.groundedness_threshold;
  delete rest.retrieval_context_turns;
  delete rest.max_history_messages;
  delete rest.moderation_self_harm_categories;
  delete rest.unsupported_language_behavior;
  delete rest.handoff_trigger_phrases;
  delete rest.lead_capture_enabled;
  delete rest.human_handoff_enabled;
  delete rest.send_information_email_enabled;
  delete rest.suggested_questions;
  delete rest.prohibited_claims;
  return {
    groundedness_threshold: behavior.groundedness_threshold ?? '',
    retrieval_context_turns: behavior.retrieval_context_turns ?? '',
    max_history_messages: behavior.max_history_messages ?? '',
    moderation_self_harm_categories: toRows(behavior.moderation_self_harm_categories),
    unsupported_language_behavior: behavior.unsupported_language_behavior ?? '',
    handoff_trigger_phrases: toRows(behavior.handoff_trigger_phrases),
    lead_capture_enabled: behavior.lead_capture_enabled ?? true,
    human_handoff_enabled: behavior.human_handoff_enabled ?? true,
    send_information_email_enabled: behavior.send_information_email_enabled ?? true,
    suggested_questions: toRows(behavior.suggested_questions),
    prohibited_claims: toRows(behavior.prohibited_claims),
    behavior_config_advanced: JSON.stringify(rest, null, 2),
  };
}

/** Drops every empty-string value — the shape an unset `RHFSelectField`
 * (its placeholder option) or a never-filled-in color field leaves behind.
 * An unset key is omitted entirely rather than sent as `""`, so it neither
 * fails the backend's hex/enum check nor overwrites an existing merged
 * value with a blank (`AgentService.update_draft` merges by key presence). */
function omitEmpty<T extends Record<string, string>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value)) as Partial<T>;
}

/** Reassembles this form's flat theme fields into the nested shape
 * `ThemeValidationService` validates. */
function buildThemeConfigPayload(values: AgentDraftSubmitValues): ThemeConfig {
  const colors = omitEmpty({
    primary: values.color_primary,
    secondary: values.color_secondary,
    background: values.color_background,
    surface: values.color_surface,
    text: values.color_text,
    success: values.color_success,
    warning: values.color_warning,
    error: values.color_error,
  });
  const widget = omitEmpty({
    position: values.widget_position,
    launcher_shape: values.widget_launcher_shape,
    mode: values.widget_mode,
  });
  const logo = omitEmpty({
    logo_url: values.logo_logo_url,
    favicon_url: values.logo_favicon_url,
  });
  return {
    colors,
    ...(values.typography_font_family && {
      typography: { font_family: values.typography_font_family },
    }),
    widget,
    ...(Object.keys(logo).length > 0 && { logo }),
  };
}

/** The runtime-consumed behavior keys `ThemeValidationService
 * .validate_behavior_config` validates as of 2026-09-09, omitting whichever
 * of the five the operator left unset — same "touch only what's set" rule
 * `buildThemeConfigPayload`'s `omitEmpty` follows, just written out here
 * since these span numbers, an enum, and a list rather than one flat string
 * map `omitEmpty` is typed for. */
function buildBehaviorRuntimeFieldsPayload(
  values: AgentDraftSubmitValues
): Partial<BehaviorConfig> {
  const fields: Partial<BehaviorConfig> = {};
  if (values.groundedness_threshold !== '' && values.groundedness_threshold !== undefined) {
    fields.groundedness_threshold = values.groundedness_threshold;
  }
  if (values.retrieval_context_turns !== '' && values.retrieval_context_turns !== undefined) {
    fields.retrieval_context_turns = values.retrieval_context_turns;
  }
  if (values.max_history_messages !== '' && values.max_history_messages !== undefined) {
    fields.max_history_messages = values.max_history_messages;
  }
  const moderationCategories = fromRows(values.moderation_self_harm_categories);
  if (moderationCategories.length) fields.moderation_self_harm_categories = moderationCategories;
  if (values.unsupported_language_behavior) {
    fields.unsupported_language_behavior = values.unsupported_language_behavior;
  }
  const handoffTriggerPhrases = fromRows(values.handoff_trigger_phrases);
  if (handoffTriggerPhrases.length) fields.handoff_trigger_phrases = handoffTriggerPhrases;
  // Tool toggles are always sent explicitly, so switching one back on persists
  // `true` over a stored `false` (the backend merges by key presence).
  fields.lead_capture_enabled = values.lead_capture_enabled;
  fields.human_handoff_enabled = values.human_handoff_enabled;
  fields.send_information_email_enabled = values.send_information_email_enabled;
  return fields;
}

/** Reassembles this form's flat + advanced-JSON behavior fields into the
 * full `behavior_config` object. The advanced JSON (already parsed and
 * shape-checked by the schema's `jsonObjectField`) supplies every
 * unrecognized/org-cascaded key; the structured fields layer on top. */
function buildBehaviorConfigPayload(
  values: AgentDraftSubmitValues
): BehaviorConfig & Record<string, unknown> {
  return {
    ...values.behavior_config_advanced,
    ...buildBehaviorRuntimeFieldsPayload(values),
    suggested_questions: fromRows(values.suggested_questions),
    prohibited_claims: fromRows(values.prohibited_claims),
  };
}

/** Splits a stored `qualification_config` into this form's flat fields.
 * Unrecognized keys (`cooldown_minutes`, anything org-cascaded) are not
 * represented in the form at all — unlike `behavior_config`, which parks
 * them in a raw-JSON field, they are carried across a save straight from the
 * loaded draft by `buildQualificationConfigPayload`. One less textarea for a
 * key no operator edits by hand. */
function qualificationFieldsFromConfig(qualification: QualificationConfig) {
  const scoring = qualification.scoring ?? {};
  return {
    qualification_trigger_phrases: toRows(qualification.trigger_phrases),
    qualification_required_fields: qualification.required_fields ?? [],
    // Unset falls back to `required_fields` on the backend, so seed it the
    // same way: saving an untouched form keeps the widget form unchanged.
    qualification_form_required_fields:
      qualification.form_required_fields ?? qualification.required_fields ?? [],
    qualification_questions: qualification.questions ?? [],
    qualification_qualified_threshold: scoring.qualified_threshold ?? '',
    qualification_partial_threshold: scoring.partial_threshold ?? '',
  };
}

/**
 * Reassembles the flat qualification fields into the nested shape
 * `ThemeValidationService.validate_qualification_config` validates.
 *
 * `stored` is spread in first so keys the form doesn't model survive the
 * round trip. Without it, saving the draft from this form would silently
 * drop an agent's `cooldown_minutes` — the backend merges `qualification_config`
 * by key presence, but only among the keys actually sent.
 *
 * Each key is omitted rather than sent empty when unset, matching
 * `buildThemeConfigPayload`'s rule. `scoring` in particular must be all or
 * nothing: sending one threshold is a config the backend rejects, and
 * sending `{}` would read as "scoring configured" while scoring nobody.
 */
function buildQualificationConfigPayload(
  values: AgentDraftSubmitValues,
  stored: QualificationConfig
): QualificationConfig {
  // Same shape as `behaviorFieldsFromConfig`: strip the keys the form owns,
  // keep whatever else was stored.
  const rest = { ...stored };
  delete rest.trigger_phrases;
  delete rest.required_fields;
  delete rest.form_required_fields;
  delete rest.questions;
  delete rest.scoring;

  const qualified = values.qualification_qualified_threshold;
  const partial = values.qualification_partial_threshold;
  const hasThresholds =
    qualified !== '' && qualified !== undefined && partial !== '' && partial !== undefined;

  return {
    ...rest,
    trigger_phrases: fromRows(values.qualification_trigger_phrases),
    required_fields: values.qualification_required_fields,
    form_required_fields: values.qualification_form_required_fields,
    questions: values.qualification_questions,
    ...(hasThresholds && {
      scoring: {
        qualified_threshold: Number(qualified),
        partial_threshold: Number(partial),
      },
    }),
  };
}

/**
 * A contrast-check failure comes back as `errors.theme_config` shaped as
 * `{ [colorKey]: { ratio, passes_aa_normal_text, suggested_fallback } }` —
 * see `ThemeValidationService._assert_colors_pass_contrast` and
 * `_run_application_error_as_validation_error`. `applyApiError`'s generic
 * field binder only reads string/string[] error values, so this nested
 * shape is bound by hand, the same way this file's predecessor already
 * hand-bound `triggerPhraseInvalid`. Mutates `error.response.data.errors` in
 * place to remove the keys it handled, so the remaining, ordinary
 * field-keyed errors still flow through `applyApiError` normally afterward.
 */
function bindContrastErrors(
  error: unknown,
  values: AgentDraftSubmitValues,
  setError: UseFormSetError<AgentDraftFormValues>
): void {
  if (!(error instanceof AxiosError)) return;
  const data = error.response?.data as { errors?: Record<string, unknown> } | undefined;
  if (!data?.errors) return;
  const themeConfigError = data.errors.theme_config;
  if (!themeConfigError || typeof themeConfigError !== 'object' || Array.isArray(themeConfigError))
    return;

  for (const [colorKey, detail] of Object.entries(themeConfigError as Record<string, unknown>)) {
    if (!detail || typeof detail !== 'object') continue;
    const { ratio, suggested_fallback: suggestedFallback } = detail as {
      ratio?: number;
      suggested_fallback?: string | null;
    };
    const field = `color_${colorKey}` as keyof AgentDraftFormValues;
    const currentColor = (values as unknown as Record<string, string>)[`color_${colorKey}`];
    const fallback =
      suggestedFallback ??
      checkContrast(currentColor || '#000000', values.color_background || '#ffffff')
        .suggestedFallback ??
      '';
    setError(field, {
      message: format(t.agents.detail.draft.contrastFailing, {
        ratio: String(ratio ?? '?'),
        against: fallback,
      }),
    });
  }
  delete data.errors.theme_config;
}

/**
 * `validate_qualification_config` raises against nested keys (`scoring`,
 * `questions`), but `_run_application_error_as_validation_error` flattens
 * every one of them onto the `qualification_config` serializer field. This
 * form no longer has a field by that name, so the message would otherwise
 * vanish into a toast.
 *
 * Bound onto `qualification_questions`: the schema here mirrors every rule
 * the backend checks, so anything that still comes back is either a rule
 * added server-side since, or one of the `questions` cases whose bounds
 * (`MAX_QUALIFICATION_QUESTIONS`, the weight range) are the likeliest to
 * drift. Same mutate-then-delete contract as `bindContrastErrors` so the
 * remaining errors still reach `applyApiError`.
 */
function bindQualificationError(
  error: unknown,
  setError: UseFormSetError<AgentDraftFormValues>
): void {
  if (!(error instanceof AxiosError)) return;
  const data = error.response?.data as { errors?: Record<string, unknown> } | undefined;
  if (!data?.errors) return;
  const detail = data.errors.qualification_config;
  // `ApplicationError.errors` can be a structured payload rather than a
  // message. Leave anything that isn't readable text alone, so it falls
  // through to the generic error toast instead of rendering as
  // "[object Object]" under a field.
  const parts = Array.isArray(detail) ? detail : [detail];
  const message = parts.filter((item) => typeof item === 'string').join(' ');
  if (!message) return;
  setError('qualification_questions', { message });
  delete data.errors.qualification_config;
}

/**
 * Editing the full draft config: instructions, disclosure, `display_name`
 * (the widget-facing bot name, added 2026-09-09, replacing the removed
 * `notes` field), every `enabled_languages` entry's required localized
 * text, and the full nested `theme_config`/`behavior_config` shape
 * validated server-side by `ThemeValidationService` — including, as of
 * 2026-09-09, the runtime-consumed behavior keys (`groundedness_threshold`,
 * `retrieval_context_turns`, `max_history_messages`,
 * `moderation_self_harm_categories`, `unsupported_language_behavior`), and,
 * as of 2026-09-14, the full `qualification_config` rule set. Only
 * unrecognized/org-cascaded behavior keys stay raw JSON (see
 * `behaviorFieldsFromConfig`'s docstring on why those stay freeform);
 * `qualification_config`'s equivalents are carried through untouched by
 * `buildQualificationConfigPayload` rather than being exposed at all.
 */
/**
 * A saved version as this form's flat values. Shared with the embed step's
 * widget preview, which renders the published version through the same
 * `WidgetPreview` the draft tab uses.
 */
export function versionToFormValues(
  version: AgentVersionDetail,
  enabledLanguages: string[]
): AgentDraftFormValues {
  return {
    instructions: version.instructions,
    disclosure_enabled: version.disclosure_enabled,
    display_name: version.display_name,
    localized_text: buildLocalizedTextDefaults(enabledLanguages, version.localized_text),
    ...themeFieldsFromConfig(version.theme_config),
    ...behaviorFieldsFromConfig(version.behavior_config),
    ...qualificationFieldsFromConfig(version.qualification_config ?? {}),
  };
}

export function useAgentDraftForm(
  agentId: string,
  draft: AgentVersionDetail | undefined,
  enabledLanguages: string[]
) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useAuthMutation<
    ApiResponse<AgentVersionDetail>,
    AgentDraftUpdateInput
  >();

  const themeDefaultsQuery = useAuthQuery<ApiResponse<ThemeDefaultsResponse>>(
    agentThemeDefaultsKey(agentId),
    agentThemeDefaultsEndpoint(agentId),
    { enabled: false }
  );

  const form = useForm<AgentDraftFormValues, unknown, AgentDraftSubmitValues>({
    resolver: zodResolver(agentDraftUpdateSchema),
    defaultValues: {
      instructions: '',
      disclosure_enabled: true,
      display_name: '',
      localized_text: buildLocalizedTextDefaults(enabledLanguages, {}),
      ...themeFieldsFromConfig({}),
      ...behaviorFieldsFromConfig({}),
      ...qualificationFieldsFromConfig({}),
    },
  });

  // Reset once the draft loads (or enabled_languages changes) so the form
  // reflects the server's current values instead of staying blank.
  useEffect(() => {
    if (!draft) return;
    form.reset(versionToFormValues(draft, enabledLanguages));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, enabledLanguages.join(',')]);

  /** "Reset to org default" — fetches the live cascade preview and applies
   * it over the current (possibly edited) form state, per-key: an
   * already-set field is left alone rather than blown away, matching
   * `ThemeCascadeService.resolve`'s own "fill only what's unset" rule. */
  const resetToOrgDefault = async () => {
    const result = await themeDefaultsQuery.refetch();
    const data = result.data?.data;
    if (!data) {
      toast.error(t.agents.detail.draft.resetToOrgDefaultFailed);
      return;
    }
    const defaults = {
      ...themeFieldsFromConfig(data.theme_config),
      ...behaviorFieldsFromConfig(data.behavior_config),
    };
    const current = form.getValues();
    for (const [key, value] of Object.entries(defaults)) {
      const typedKey = key as keyof AgentDraftFormValues;
      const existing = current[typedKey];
      const isUnset = existing === '' || (Array.isArray(existing) && existing.length === 0);
      if (isUnset) form.setValue(typedKey, value as never, { shouldDirty: true });
    }
  };

  const submit = form.handleSubmit(async (values: AgentDraftSubmitValues) => {
    const theme_config = buildThemeConfigPayload(values);
    const behavior_config = buildBehaviorConfigPayload(values);
    const qualification_config = buildQualificationConfigPayload(
      values,
      draft?.qualification_config ?? {}
    );

    try {
      await mutateAsync({
        url: agentDraftEndpoint(agentId),
        method: 'patch',
        body: {
          instructions: values.instructions,
          disclosure_enabled: values.disclosure_enabled,
          display_name: values.display_name,
          localized_text: values.localized_text,
          theme_config,
          behavior_config,
          qualification_config,
        },
      });
      toast.success(t.agents.toast.draftSaved);
      // `handleSubmit` leaves `isDirty` set, and the unsaved-changes guard
      // reads it — without this the warning outlives the save it belongs to.
      // Re-baselining on the submitted values rather than waiting for the
      // refetch keeps that independent of TanStack's structural sharing, which
      // can hand back the identical object and never re-run the reset effect.
      form.reset(form.getValues());
      void queryClient.invalidateQueries({ queryKey: agentDraftKey(agentId) });
      // The agent's `draft_version` summary (Publish tab, setup checklist)
      // lives on the by-type query, not the draft one, so it needs its own
      // refetch or Publish keeps reporting "No unpublished changes".
      void queryClient.invalidateQueries({ queryKey: [AGENT_BY_TYPE_KEY] });
    } catch (error) {
      bindContrastErrors(error, values, form.setError);
      bindQualificationError(error, form.setError);
      applyApiError<AgentDraftFormValues>(error, {
        setError: form.setError,
        fields: ['instructions', 'display_name', 'behavior_config_advanced'],
      });
    }
  });

  return {
    form,
    isPending,
    submit,
    resetToOrgDefault,
    isResettingToOrgDefault: themeDefaultsQuery.isFetching,
  };
}
