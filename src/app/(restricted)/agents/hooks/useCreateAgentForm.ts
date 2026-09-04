'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import { agentCreateSchema, type AgentCreateFormValues } from '@/lib/schemas/agent';
import { AGENTS_ENDPOINT } from '@/services/agents';
import type { Agent, AgentCreateInput } from '@/types/agent';
import type { ApiResponse } from '@/types/api';
import { t } from '@/locales';

type Options = Readonly<{
  onSuccess: () => void;
}>;

/**
 * Owns the "new agent" mutation. `enabled_languages_input` is a comma-separated
 * text field on the form; it's split into `AgentCreateInput.enabled_languages`
 * here rather than in the schema so the schema's output type stays identical to
 * its input type (see `src/lib/schemas/project.ts`'s note on why).
 */
export function useCreateAgentForm({ onSuccess }: Options) {
  const { mutateAsync, isPending } = useAuthMutation<ApiResponse<Agent>, AgentCreateInput>();

  const form = useForm<AgentCreateFormValues>({
    resolver: zodResolver(agentCreateSchema),
    defaultValues: {
      name: '',
      human_inbox_email: '',
      default_language: 'en',
      enabled_languages_input: 'en',
    },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      const enabled_languages = values.enabled_languages_input
        .split(',')
        .map((lang) => lang.trim())
        .filter(Boolean);

      await mutateAsync({
        url: AGENTS_ENDPOINT,
        body: {
          name: values.name,
          human_inbox_email: values.human_inbox_email,
          default_language: values.default_language,
          enabled_languages,
        },
      });
      toast.success(t.agents.toast.created);
      form.reset();
      onSuccess();
    } catch (error) {
      applyApiError<AgentCreateFormValues>(error, {
        setError: form.setError,
        fields: ['name', 'human_inbox_email', 'default_language'],
      });
    }
  });

  return { form, isPending, submit };
}
