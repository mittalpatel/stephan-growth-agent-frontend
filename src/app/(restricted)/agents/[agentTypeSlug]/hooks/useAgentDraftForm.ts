'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import { agentDraftEndpoint, agentDraftKey } from '@/services/agents';
import type { AgentVersionDetail, LocalizedText } from '@/types/agent';
import type { ApiResponse } from '@/types/api';
import { t } from '@/locales';

type LocalizedTextFormValues = Record<
  string,
  { greeting: string; fallback_message: string; disclosure_text: string }
>;

export type AgentDraftFormValues = {
  instructions: string;
  disclosure_enabled: boolean;
  localized_text: LocalizedTextFormValues;
  theme_primary_color: string;
  theme_logo_url: string;
  theme_launcher_position: string;
  notes: string;
  /** Raw JSON text — `behavior_config`/`qualification_config` are genuinely
   * freeform on the backend (only validated as "must be an object"), so
   * there's no fixed field set to build real inputs for. Field name matches
   * the backend's error key exactly, so a `config_must_be_object` failure
   * binds inline via `applyApiError` without a mapping table. */
  behavior_config: string;
  qualification_config: string;
};

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

/**
 * Editing the full draft config: instructions, disclosure, every
 * `enabled_languages` entry's required localized text, `theme_config`'s
 * three named keys (`primary_color`/`logo_url`/`launcher_position`),
 * `notes`, and `behavior_config`/`qualification_config` as raw JSON (see
 * `AgentDraftFormValues`'s docstring on why those two stay freeform).
 */
export function useAgentDraftForm(
  agentId: string,
  draft: AgentVersionDetail | undefined,
  enabledLanguages: string[]
) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useAuthMutation<
    ApiResponse<AgentVersionDetail>,
    Partial<{
      instructions: string;
      disclosure_enabled: boolean;
      localized_text: Record<string, LocalizedText>;
      theme_config: Record<string, unknown>;
      behavior_config: Record<string, unknown>;
      qualification_config: Record<string, unknown>;
      notes: string;
    }>
  >();

  const form = useForm<AgentDraftFormValues>({
    defaultValues: {
      instructions: '',
      disclosure_enabled: true,
      localized_text: buildLocalizedTextDefaults(enabledLanguages, {}),
      theme_primary_color: '',
      theme_logo_url: '',
      theme_launcher_position: '',
      notes: '',
      behavior_config: '{}',
      qualification_config: '{}',
    },
  });

  // Reset once the draft loads (or enabled_languages changes) so the form
  // reflects the server's current values instead of staying blank.
  useEffect(() => {
    if (!draft) return;
    const theme = draft.theme_config as Record<string, unknown>;
    form.reset({
      instructions: draft.instructions,
      disclosure_enabled: draft.disclosure_enabled,
      localized_text: buildLocalizedTextDefaults(enabledLanguages, draft.localized_text),
      theme_primary_color: typeof theme.primary_color === 'string' ? theme.primary_color : '',
      theme_logo_url: typeof theme.logo_url === 'string' ? theme.logo_url : '',
      theme_launcher_position:
        typeof theme.launcher_position === 'string' ? theme.launcher_position : '',
      notes: draft.notes,
      behavior_config: JSON.stringify(draft.behavior_config ?? {}, null, 2),
      qualification_config: JSON.stringify(draft.qualification_config ?? {}, null, 2),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, enabledLanguages.join(',')]);

  const submit = form.handleSubmit(async (values) => {
    let behaviorConfig: Record<string, unknown>;
    let qualificationConfig: Record<string, unknown>;
    try {
      behaviorConfig = JSON.parse(values.behavior_config || '{}');
      if (
        typeof behaviorConfig !== 'object' ||
        behaviorConfig === null ||
        Array.isArray(behaviorConfig)
      ) {
        throw new Error('not an object');
      }
    } catch {
      form.setError('behavior_config', { message: t.agents.detail.draft.configMustBeObject });
      return;
    }
    try {
      qualificationConfig = JSON.parse(values.qualification_config || '{}');
      if (
        typeof qualificationConfig !== 'object' ||
        qualificationConfig === null ||
        Array.isArray(qualificationConfig)
      ) {
        throw new Error('not an object');
      }
    } catch {
      form.setError('qualification_config', { message: t.agents.detail.draft.configMustBeObject });
      return;
    }
    // Mirrors `AgentVersionUpdateSerializer.validate_qualification_config`'s
    // `trigger_phrases` guard: a list of non-blank strings, when present.
    // An explicit `null` counts as absent, exactly as the backend's
    // `value.get("trigger_phrases") is not None` check does — rejecting it
    // here would block a save the server would have accepted.
    const triggerPhrases = qualificationConfig.trigger_phrases;
    if (
      triggerPhrases !== undefined &&
      triggerPhrases !== null &&
      (!Array.isArray(triggerPhrases) ||
        !triggerPhrases.every((phrase) => typeof phrase === 'string' && phrase.trim().length > 0))
    ) {
      form.setError('qualification_config', {
        message: t.agents.detail.draft.triggerPhraseInvalid,
      });
      return;
    }

    // Mirrors the backend's `theme_config.*_color` hex guard.
    const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
    if (values.theme_primary_color && !HEX_COLOR.test(values.theme_primary_color)) {
      form.setError('theme_primary_color', { message: t.agents.detail.draft.colorMustBeHex });
      return;
    }

    const theme_config: Record<string, string> = {};
    if (values.theme_primary_color) theme_config.primary_color = values.theme_primary_color;
    if (values.theme_logo_url) theme_config.logo_url = values.theme_logo_url;
    if (values.theme_launcher_position)
      theme_config.launcher_position = values.theme_launcher_position;

    try {
      await mutateAsync({
        url: agentDraftEndpoint(agentId),
        method: 'patch',
        body: {
          instructions: values.instructions,
          disclosure_enabled: values.disclosure_enabled,
          localized_text: values.localized_text,
          theme_config,
          behavior_config: behaviorConfig,
          qualification_config: qualificationConfig,
          notes: values.notes,
        },
      });
      toast.success(t.agents.toast.draftSaved);
      void queryClient.invalidateQueries({ queryKey: agentDraftKey(agentId) });
    } catch (error) {
      applyApiError<AgentDraftFormValues>(error, {
        setError: form.setError,
        fields: ['instructions', 'behavior_config', 'qualification_config', 'notes'],
      });
    }
  });

  return { form, isPending, submit };
}
