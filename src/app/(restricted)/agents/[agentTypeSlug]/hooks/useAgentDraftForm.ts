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
  ThemeConfig,
} from '@/types/agent';
import type { ApiResponse } from '@/types/api';
import { t } from '@/locales';

type LocalizedTextFormValues = Record<
  string,
  { greeting: string; fallback_message: string; disclosure_text: string }
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
    color_accent: colors.accent ?? '',
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
    widget_panel_size: widget.panel_size ?? '',
    widget_shadow: widget.shadow ?? '',
    widget_mode: widget.mode ?? '',
    widget_mobile_layout: widget.mobile_layout ?? '',
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
 * Everything else the runtime reads directly (`groundedness_threshold`,
 * retrieval/history tuning, moderation categories,
 * `unsupported_language_behavior`) stays in the raw-JSON advanced field —
 * stripped of the keys this form now handles as real inputs, so the two
 * representations never fight over the same data. */
function behaviorFieldsFromConfig(behavior: BehaviorConfig & Record<string, unknown>) {
  const voice = behavior.voice ?? {};
  const rest = { ...behavior };
  delete rest.voice;
  delete rest.suggested_questions;
  delete rest.prohibited_claims;
  return {
    voice_answer_length: voice.answer_length ?? '',
    voice_formality: voice.formality ?? '',
    voice_terminology: toRows(voice.terminology),
    voice_prohibited_phrases: toRows(voice.prohibited_phrases),
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
    accent: values.color_accent,
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
    panel_size: values.widget_panel_size,
    shadow: values.widget_shadow,
    mode: values.widget_mode,
    mobile_layout: values.widget_mobile_layout,
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

function buildVoicePayload(values: AgentDraftSubmitValues): BehaviorConfig['voice'] | undefined {
  const hasVoice =
    values.voice_answer_length ||
    values.voice_formality ||
    values.voice_terminology.length > 0 ||
    values.voice_prohibited_phrases.length > 0;
  if (!hasVoice) return undefined;
  return {
    ...(values.voice_answer_length && { answer_length: values.voice_answer_length }),
    ...(values.voice_formality && { formality: values.voice_formality }),
    ...(values.voice_terminology.length && { terminology: fromRows(values.voice_terminology) }),
    ...(values.voice_prohibited_phrases.length && {
      prohibited_phrases: fromRows(values.voice_prohibited_phrases),
    }),
  };
}

/** Reassembles this form's flat + advanced-JSON behavior fields into the
 * full `behavior_config` object. The advanced JSON (already parsed and
 * shape-checked by the schema's `jsonObjectField`) supplies every
 * runtime-only key; the structured fields layer on top. */
function buildBehaviorConfigPayload(
  values: AgentDraftSubmitValues
): BehaviorConfig & Record<string, unknown> {
  const voice = buildVoicePayload(values);
  return {
    ...values.behavior_config_advanced,
    ...(voice && { voice }),
    suggested_questions: fromRows(values.suggested_questions),
    prohibited_claims: fromRows(values.prohibited_claims),
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
 * Editing the full draft config: instructions, disclosure, every
 * `enabled_languages` entry's required localized text, the full nested
 * `theme_config`/`behavior_config` shape validated server-side by
 * `ThemeValidationService` (branch `config-theme-validation-2026-09-08`),
 * `notes`, and `qualification_config` plus the runtime-only behavior keys as
 * raw JSON (see `behaviorFieldsFromConfig`'s docstring on why those stay
 * freeform).
 */
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
      localized_text: buildLocalizedTextDefaults(enabledLanguages, {}),
      notes: '',
      ...themeFieldsFromConfig({}),
      ...behaviorFieldsFromConfig({}),
      qualification_config: '{}',
    },
  });

  // Reset once the draft loads (or enabled_languages changes) so the form
  // reflects the server's current values instead of staying blank.
  useEffect(() => {
    if (!draft) return;
    form.reset({
      instructions: draft.instructions,
      disclosure_enabled: draft.disclosure_enabled,
      localized_text: buildLocalizedTextDefaults(enabledLanguages, draft.localized_text),
      notes: draft.notes,
      ...themeFieldsFromConfig(draft.theme_config),
      ...behaviorFieldsFromConfig(draft.behavior_config),
      qualification_config: JSON.stringify(draft.qualification_config ?? {}, null, 2),
    });
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

    try {
      await mutateAsync({
        url: agentDraftEndpoint(agentId),
        method: 'patch',
        body: {
          instructions: values.instructions,
          disclosure_enabled: values.disclosure_enabled,
          localized_text: values.localized_text,
          theme_config,
          behavior_config,
          qualification_config: values.qualification_config,
          notes: values.notes,
        },
      });
      toast.success(t.agents.toast.draftSaved);
      void queryClient.invalidateQueries({ queryKey: agentDraftKey(agentId) });
    } catch (error) {
      bindContrastErrors(error, values, form.setError);
      applyApiError<AgentDraftFormValues>(error, {
        setError: form.setError,
        fields: ['instructions', 'behavior_config_advanced', 'qualification_config', 'notes'],
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
