import { z } from 'zod';

import { t } from '@/locales';

/**
 * Create validation for an agent — field names match `AgentCreateSerializer`
 * exactly (see `src/lib/schemas/project.ts` for why that's load-bearing).
 */
export const agentCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, t.agents.validation.nameRequired)
    .max(200, t.agents.validation.nameTooLong),
  human_inbox_email: z.string().trim().email(t.agents.validation.emailInvalid),
  default_language: z
    .string()
    .trim()
    .min(2, t.agents.validation.languageRequired)
    .max(10, t.agents.validation.languageRequired),
  enabled_languages_input: z.string().trim().min(1, t.agents.validation.languagesRequired),
});

export type AgentCreateFormValues = z.infer<typeof agentCreateSchema>;

/** Update validation — mirrors `AgentWriteSerializer`'s editable fields. */
export const agentUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, t.agents.validation.nameRequired)
    .max(200, t.agents.validation.nameTooLong),
  human_inbox_email: z.string().trim().email(t.agents.validation.emailInvalid),
  status: z.enum(['active', 'paused', 'archived']),
});

export type AgentUpdateFormValues = z.infer<typeof agentUpdateSchema>;

/** Mirrors `AllowedDomainWriteSerializer`'s only field. */
export const agentDomainCreateSchema = z.object({
  hostname: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, t.agents.settings.domains.validation.hostnameRequired)
    .max(255, t.agents.settings.domains.validation.hostnameTooLong),
});

export type AgentDomainCreateFormValues = z.infer<typeof agentDomainCreateSchema>;
