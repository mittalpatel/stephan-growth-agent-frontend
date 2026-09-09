import { z } from 'zod';

import {
  APPROVED_FONT_FAMILIES,
  MAX_HISTORY_MESSAGES_CEILING,
  MAX_MODERATION_CATEGORIES,
  MAX_RETRIEVAL_CONTEXT_TURNS,
  MAX_SUGGESTED_QUESTION_LENGTH,
  MAX_SUGGESTED_QUESTIONS,
  UNSUPPORTED_LANGUAGE_BEHAVIORS,
  WIDGET_LAUNCHER_SHAPES,
  WIDGET_MODES,
  WIDGET_POSITIONS,
} from '@/lib/constants/agentTheme';
import { HEX_COLOR_RE } from '@/lib/contrast';
import { isValidHostname } from '@/lib/hostname';
import { t } from '@/locales';

/** Every field here is optional in `theme_config`/`behavior_config`, so an
 * empty string (the `RHFSelectField` placeholder option, or a color never
 * set) must validate — only a non-empty value is checked against the
 * backend's allowlist/hex regex. */
const optionalHexColor = () =>
  z.string().refine((value) => value === '' || HEX_COLOR_RE.test(value), {
    message: t.agents.detail.draft.colorMustBeHex,
  });

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.string().refine((value) => value === '' || (values as readonly string[]).includes(value), {
    message: t.agents.validation.invalidSelection,
  });

/** `''` (untouched `RHFTextField` `type="number"` input) or a coerced number
 * in `[min, max]`. Kept distinct from a bare `z.coerce.number().optional()`
 * for the same reason `websiteDiscoverSchema` is (`src/lib/schemas/knowledge.ts`):
 * `z.coerce.number()` alone turns `''` into `0`, which would silently submit
 * a value for a field nobody touched — and `0` is a real, in-range value for
 * `groundedness_threshold` that must survive as `0`, not "unset". */
const optionalNumber = (min: number, max: number, message: string) =>
  z.union([z.literal(''), z.coerce.number().min(min, message).max(max, message)]).optional();

/** Shared shape for the four repeatable-string-list fields (suggested
 * questions, prohibited claims, voice terminology/prohibited phrases) — see
 * `RHFStringListField`'s doc comment for why each row is `{ value: string }`
 * rather than a plain string. Mirrors the backend's `_is_string_list` guard:
 * every row must be a non-blank string once trimmed. */
const stringListField = (maxItemLength?: number) =>
  z.array(
    z.object({
      value: z
        .string()
        .trim()
        .min(1, t.agents.validation.listItemRequired)
        .max(maxItemLength ?? Infinity, t.agents.validation.listItemTooLong),
    })
  );

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

const localizedTextEntrySchema = z.object({
  greeting: z.string(),
  fallback_message: z.string(),
  disclosure_text: z.string(),
  /** Optional (2026-09-09): `AgentService._assert_localization_complete`
   * never requires this, even when `unsupported_language_behavior` is
   * `polite_decline` — an empty value falls back to
   * `DEFAULT_UNSUPPORTED_LANGUAGE_MESSAGE` server-side, both at publish-check
   * time and in the live chat reply (`ChatRuntimeService
   * ._handle_unsupported_language`). This field just lets an operator
   * override that default per language. */
  unsupported_language_message: z.string(),
});

/** Parses to a plain object, or fails with a single message on the field —
 * mirrors `AgentVersionUpdateSerializer.validate_behavior_config`'s /
 * `validate_qualification_config`'s "must be a JSON object" guard, run
 * client-side before the request goes out. */
const jsonObjectField = (invalidMessage: string) =>
  z.string().transform((value, ctx) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value || '{}');
    } catch {
      ctx.addIssue({ code: 'custom', message: invalidMessage });
      return z.NEVER;
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      ctx.addIssue({ code: 'custom', message: invalidMessage });
      return z.NEVER;
    }
    return parsed as Record<string, unknown>;
  });

/**
 * Full agent-draft form — mirrors `AgentVersionUpdateSerializer`'s fields,
 * with `theme_config`/`behavior_config`'s newly-validated nested keys
 * (branch `config-theme-validation-2026-09-08`) hoisted into flat, typed
 * form fields the same way the pre-existing `theme_primary_color` convention
 * already did for the old flat shape. See `useAgentDraftForm.ts` for how
 * these get reassembled into the nested `theme_config`/`behavior_config`
 * bodies the backend actually reads, and why the field names below
 * therefore do *not* match the backend serializer's field names 1:1 (a
 * pre-existing, documented exception to that rule — backend field errors
 * for these are bound by hand in the submit handler, not through
 * `applyApiError`'s automatic name matching).
 *
 * `behavior_config_advanced`/`qualification_config` stay raw JSON: as of
 * 2026-09-09 the runtime-consumed behavior keys (`groundedness_threshold`,
 * `retrieval_context_turns`, `max_history_messages`,
 * `moderation_self_harm_categories`, `unsupported_language_behavior`) are
 * real, validated fields below, not part of this JSON blob any more — only
 * `qualification_config` and any org-cascaded/unrecognized key (e.g.
 * `voice.tone`) still have no fixed shape worth building
 * real inputs for.
 */
export const agentDraftUpdateSchema = z.object({
  instructions: z.string(),
  disclosure_enabled: z.boolean(),
  localized_text: z.record(z.string(), localizedTextEntrySchema),
  /** Blank means "fall back to Agent.name" server-side — distinct from a
   * whitespace-only string, which `AgentVersionUpdateSerializer
   * .validate_display_name` rejects rather than silently storing a name
   * nobody would recognize. */
  display_name: z.string().refine((value) => value === '' || value.trim().length > 0, {
    message: t.agents.detail.draft.displayNameBlank,
  }),

  // theme_config.colors.*
  color_primary: optionalHexColor(),
  color_secondary: optionalHexColor(),
  color_background: optionalHexColor(),
  color_surface: optionalHexColor(),
  color_text: optionalHexColor(),
  color_success: optionalHexColor(),
  color_warning: optionalHexColor(),
  color_error: optionalHexColor(),
  // theme_config.typography.font_family
  typography_font_family: optionalEnum(APPROVED_FONT_FAMILIES),
  // theme_config.widget.*
  widget_position: optionalEnum(WIDGET_POSITIONS),
  widget_launcher_shape: optionalEnum(WIDGET_LAUNCHER_SHAPES),
  widget_mode: optionalEnum(WIDGET_MODES),
  // theme_config.logo.*
  logo_logo_url: z.string(),
  logo_favicon_url: z.string(),

  // behavior_config.* — the runtime-consumed keys ThemeValidationService
  // validates as of 2026-09-09 (`apps.runtime.services.chat_runtime_service`).
  // Sanity ceilings on the two integer fields and the category list are
  // client-only guards; the backend enforces no upper bound, only a `>= 1`
  // floor on the integers.
  groundedness_threshold: optionalNumber(0, 1, t.agents.detail.draft.groundednessThresholdRange),
  retrieval_context_turns: optionalNumber(
    1,
    MAX_RETRIEVAL_CONTEXT_TURNS,
    t.agents.detail.draft.retrievalContextTurnsRange
  ),
  max_history_messages: optionalNumber(
    1,
    MAX_HISTORY_MESSAGES_CEILING,
    t.agents.detail.draft.maxHistoryMessagesRange
  ),
  moderation_self_harm_categories: stringListField().max(
    MAX_MODERATION_CATEGORIES,
    t.agents.validation.listTooLong
  ),
  unsupported_language_behavior: optionalEnum(UNSUPPORTED_LANGUAGE_BEHAVIORS),
  // behavior_config.suggested_questions / .prohibited_claims
  suggested_questions: stringListField(MAX_SUGGESTED_QUESTION_LENGTH).max(
    MAX_SUGGESTED_QUESTIONS,
    t.agents.detail.draft.suggestedQuestionsTooMany
  ),
  prohibited_claims: stringListField(),

  behavior_config_advanced: jsonObjectField(t.agents.detail.draft.configMustBeObject),
  qualification_config: jsonObjectField(t.agents.detail.draft.configMustBeObject).superRefine(
    (value, ctx) => {
      // Mirrors `AgentVersionUpdateSerializer.validate_qualification_config`'s
      // `trigger_phrases` guard: a list of non-blank strings, when present.
      // An explicit `null` counts as absent, exactly as the backend's
      // `value.get("trigger_phrases") is not None` check does.
      const triggerPhrases = value.trigger_phrases;
      if (
        triggerPhrases !== undefined &&
        triggerPhrases !== null &&
        (!Array.isArray(triggerPhrases) ||
          !triggerPhrases.every((phrase) => typeof phrase === 'string' && phrase.trim().length > 0))
      ) {
        ctx.addIssue({ code: 'custom', message: t.agents.detail.draft.triggerPhraseInvalid });
      }
    }
  ),
});

// `behavior_config_advanced`/`qualification_config` are `z.string().transform(...)`,
// so the schema's input type (what RHF actually holds while the user types)
// and output type (what `handleSubmit` hands the submit callback, post-parse)
// differ for those two fields. `useForm<AgentDraftFormValues>` must use the
// input type or every raw-JSON textarea would be typed as the parsed object
// it becomes only after validation.
export type AgentDraftFormValues = z.input<typeof agentDraftUpdateSchema>;
export type AgentDraftSubmitValues = z.output<typeof agentDraftUpdateSchema>;
