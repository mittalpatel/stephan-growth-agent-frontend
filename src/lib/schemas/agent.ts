import { z } from 'zod';

import { isValidHostname } from '@/lib/hostname';
import { t } from '@/locales';

/**
 * Update validation — mirrors `AgentWriteSerializer`'s editable fields.
 * There is no create schema: an organization's agents are a fixed,
 * auto-provisioned roster (backend 2026-09-07 removed `POST /agents/`
 * entirely, along with `AgentCreateSerializer`).
 */
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

/**
 * Mirrors `AllowedDomainWriteSerializer`'s only field. `allowLocalhost` is
 * the one-off `is_valid_hostname()` grants this call site for local widget
 * testing (`src/lib/hostname.ts`) — org custom domains don't get it.
 */
export const agentDomainCreateSchema = z.object({
  hostname: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, t.agents.settings.domains.validation.hostnameRequired)
    .max(255, t.agents.settings.domains.validation.hostnameTooLong)
    .refine((value) => isValidHostname(value, { allowLocalhost: true }), {
      message: t.agents.settings.domains.validation.hostnameInvalid,
    }),
});

export type AgentDomainCreateFormValues = z.infer<typeof agentDomainCreateSchema>;
