'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { getAxiosError } from '@/lib/helper';
import { agentDraftEndpoint, agentDraftKey } from '@/services/agents';
import type { AgentVersionDetail, LocalizedText } from '@/types/agent';
import type { ApiResponse } from '@/types/api';
import { t } from '@/locales';

export type AgentDraftFormValues = {
  instructions: string;
  disclosure_enabled: boolean;
  greeting: string;
  fallback_message: string;
  disclosure_text: string;
};

/**
 * Editing the draft's instructions and the *default language*'s required
 * localized text (`greeting`/`fallback_message`/`disclosure_text` — the three
 * `AgentService.publish()` checks before allowing a publish). Sprint 1's UI
 * scope: a full per-language editor over every `enabled_languages` entry is
 * left for a later pass; this covers the one language every agent has.
 */
export function useAgentDraftForm(
  agentId: string,
  draft: AgentVersionDetail | undefined,
  defaultLanguage: string
) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useAuthMutation<
    ApiResponse<AgentVersionDetail>,
    Partial<{
      instructions: string;
      disclosure_enabled: boolean;
      localized_text: Record<string, LocalizedText>;
    }>
  >();

  const form = useForm<AgentDraftFormValues>({
    defaultValues: {
      instructions: '',
      disclosure_enabled: true,
      greeting: '',
      fallback_message: '',
      disclosure_text: '',
    },
  });

  // Reset once the draft loads (or the default language changes) so the form
  // reflects the server's current values instead of staying blank.
  useEffect(() => {
    if (!draft) return;
    const localized = draft.localized_text[defaultLanguage];
    form.reset({
      instructions: draft.instructions,
      disclosure_enabled: draft.disclosure_enabled,
      greeting: localized?.greeting ?? '',
      fallback_message: localized?.fallback_message ?? '',
      disclosure_text: localized?.disclosure_text ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, defaultLanguage]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({
        url: agentDraftEndpoint(agentId),
        method: 'patch',
        body: {
          instructions: values.instructions,
          disclosure_enabled: values.disclosure_enabled,
          localized_text: {
            ...draft?.localized_text,
            [defaultLanguage]: {
              ...draft?.localized_text[defaultLanguage],
              greeting: values.greeting,
              fallback_message: values.fallback_message,
              disclosure_text: values.disclosure_text,
            },
          },
        },
      });
      toast.success(t.agents.toast.draftSaved);
      void queryClient.invalidateQueries({ queryKey: agentDraftKey(agentId) });
    } catch (error) {
      toast.error(getAxiosError(error));
    }
  });

  return { form, isPending, submit };
}
