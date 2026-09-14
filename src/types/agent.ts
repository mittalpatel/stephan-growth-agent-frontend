/**
 * Agent DTOs — mirrors `apps/agents/api/v1/serializers/agents.py` field for
 * field. Names match the backend exactly (`snake_case`, not camelCase); see
 * `src/types/project.ts` for why that matters.
 */

import type { ThemeColorKey } from '@/lib/constants/agentTheme';

/** Mirrors `AgentStatus` in `apps/agents/constants.py`. */
export type AgentStatus = 'active' | 'paused' | 'archived';

/** Mirrors `AgentVersionStatus` in `apps/agents/constants.py`. */
export type AgentVersionStatus = 'draft' | 'published' | 'archived';

/** Mirrors `UnsupportedLanguageBehavior` in `apps/agents/constants.py`. */
export type UnsupportedLanguageBehavior =
  | 'answer_in_default_language'
  | 'polite_decline'
  | 'escalate_to_human';

/**
 * One language's localized text, keyed by `LocalizedTextKey` in
 * `apps/agents/constants.py`. The first three are required by
 * `AgentService.publish()`'s guard once that language is in
 * `Agent.enabled_languages`; the rest are optional.
 */
export type LocalizedText = {
  greeting: string;
  fallback_message: string;
  disclosure_text: string;
  unsupported_language_message?: string;
  human_requested_confirmation?: string;
  information_email_sent_confirmation?: string;
};

/**
 * Shape of `AgentVersion.theme_config`, validated server-side by
 * `apps.agents.services.theme_validation_service.ThemeValidationService`
 * (branch `config-theme-validation-2026-09-08`). Every key at every level is
 * optional — a legacy or partial draft still validates, and PATCHing one
 * nested key merges into the stored config rather than replacing it (see
 * `AgentService.update_draft`). Colors are validated as hex; the enum-typed
 * fields are validated against `src/lib/constants/agentTheme.ts`'s
 * mirrored allowlists, which are themselves sourced from
 * `apps/agents/theme_schema.py`.
 *
 * `*_color`-suffixed top-level keys (the pre-existing convention this schema
 * superseded) are not modeled here — they stay reachable only through the
 * `Record<string, unknown>` fallback a caller doing something unusual would
 * need to cast to, since no current UI writes them anymore.
 */
export type ThemeConfig = {
  colors?: Partial<Record<ThemeColorKey, string>>;
  typography?: { font_family?: string };
  widget?: {
    position?: string;
    launcher_shape?: string;
    mode?: string;
  };
  /** `favicon_url` is still an accepted, unvalidated key (the backend never
   * enforced its shape), but as of 2026-09-09 `ThemeCascadeService` no
   * longer populates it from `OrganizationBranding.favicon_url` — "Reset to
   * org default" will no longer fill an unset one. */
  logo?: { logo_url?: string; favicon_url?: string };
};

/**
 * Shape of `AgentVersion.behavior_config`'s named, validated keys (see
 * `apps/agents/behavior_schema.py` and `ThemeValidationService
 * .validate_behavior_config`). The dedicated `voice.answer_length`/
 * `formality`/`terminology`/`prohibited_phrases` controls were removed
 * 2026-09-09 as unused config surface — nothing in `apps.runtime` ever read
 * them. Replaced by the keys the runtime actually consumes
 * (`apps.runtime.constants`), now validated for the first time.
 */
export type BehaviorConfig = {
  groundedness_threshold?: number;
  retrieval_context_turns?: number;
  max_history_messages?: number;
  moderation_self_harm_categories?: string[];
  unsupported_language_behavior?: string;
  suggested_questions?: string[];
  prohibited_claims?: string[];
};

/** The `Lead` fields a qualification rule may reference. Mirrors
 * `apps.agents.qualification_schema.QUALIFIABLE_LEAD_FIELDS` (no `email`,
 * which every lead already has). */
export type QualifiableLeadField = 'name' | 'phone' | 'interest_note';

/**
 * Shape of `AgentVersion.qualification_config`'s named, validated keys (see
 * `apps/agents/qualification_schema.py` and `ThemeValidationService
 * .validate_qualification_config`, added 2026-09-14). Every key is optional,
 * and an agent version with none of them set never qualifies a lead above
 * `unqualified` rather than passing everyone.
 *
 * Scoring is a flat weighted-points list, not a decision tree, and is
 * deliberately rule-based rather than LLM-scored (the client's scope puts AI
 * lead scoring in Level 2).
 *
 * The index signature is load-bearing: `cooldown_minutes` and any
 * org-cascaded key still pass through the backend unvalidated, so a form
 * that reassembles this object must carry unrecognized keys across a save
 * instead of dropping them.
 */
export type QualificationConfig = {
  /** Gates `suggest_lead_capture`: when set, the agent only offers capture
   * after a visitor message matches one of these. Unset means unconditional. */
  trigger_phrases?: string[];
  /** Any of these still blank forces `unqualified`, whatever the score. */
  required_fields?: QualifiableLeadField[];
  /** Each present field adds its `weight` to the lead's score. A field may
   * appear at most once. */
  questions?: { field: QualifiableLeadField; weight: number }[];
  /** Both thresholds or neither: with only one set the backend scores every
   * lead `unqualified` regardless. */
  scoring?: { qualified_threshold?: number; partial_threshold?: number };
  [key: string]: unknown;
};

/**
 * Row shape from `GET /api/v1/agents/types/` and the `agent_type` embed on
 * `AgentListItem`/`Agent`. Platform-wide catalog, not tenant data — see
 * `AgentTypeSelector` in the backend. `capabilities` are not serialized here;
 * there is currently no API surfacing `AgentTypeCapability` rows.
 */
export type AgentType = {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_available: boolean;
};

/** Row shape from `GET /api/v1/agents/` — narrower than the detail on purpose. */
export type AgentListItem = {
  id: string;
  name: string;
  slug: string;
  status: AgentStatus;
  agent_type: AgentType;
  human_inbox_email: string;
  created_at: string;
  updated_at: string;
};

/** Embedded draft/published summary on `AgentSerializer`. */
export type AgentVersionSummary = {
  id: string;
  version_number: number;
  status: AgentVersionStatus;
  published_at: string | null;
};

/** Full record shape from the detail endpoint and every write response. */
export type Agent = {
  id: string;
  name: string;
  slug: string;
  status: AgentStatus;
  agent_type: AgentType;
  default_language: string;
  enabled_languages: string[];
  human_inbox_email: string;
  published_version: AgentVersionSummary | null;
  draft_version: AgentVersionSummary | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Full version shape — what `PATCH /agents/{id}/draft/` returns. */
export type AgentVersionDetail = {
  id: string;
  agent: string;
  version_number: number;
  status: AgentVersionStatus;
  disclosure_enabled: boolean;
  /** Widget-facing bot name shown in the chat header, distinct from
   * `Agent.name` (the internal record label). Falls back to `Agent.name`
   * when blank. Added 2026-09-09; `notes` was removed the same commit. */
  display_name: string;
  instructions: string;
  behavior_config: BehaviorConfig & Record<string, unknown>;
  localized_text: Record<string, LocalizedText>;
  theme_config: ThemeConfig & Record<string, unknown>;
  qualification_config: QualificationConfig;
  knowledge_index_version: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Body for `PATCH /api/v1/agents/{id}/` — mirrors `AgentWriteSerializer`. */
export type AgentUpdateInput = Partial<{
  name: string;
  slug: string;
  status: AgentStatus;
  default_language: string;
  enabled_languages: string[];
  human_inbox_email: string;
}>;

/** Body for `PATCH /agents/{id}/draft/` — mirrors `AgentVersionUpdateSerializer`. */
export type AgentDraftUpdateInput = Partial<{
  disclosure_enabled: boolean;
  display_name: string;
  instructions: string;
  behavior_config: BehaviorConfig & Record<string, unknown>;
  localized_text: Record<string, LocalizedText>;
  theme_config: ThemeConfig & Record<string, unknown>;
  qualification_config: QualificationConfig;
}>;

/** Body for `POST /agents/{id}/rollback/`. */
export type AgentRollbackInput = { target_version_id: string };

/** Body for `POST /agents/{id}/draft/test/`. */
export type AgentTestAskInput = { question: string };

export type AgentTestAskCitation = {
  source_title: string;
  source_url: string;
  excerpt: string;
  page_number: number | null;
};

/** Response shape of `POST /agents/{id}/draft/test/`. */
export type AgentTestAskResult = {
  answer: string;
  citations: AgentTestAskCitation[];
  confidence_decision: 'answered' | 'clarify' | 'fallback' | 'handoff';
};

/**
 * A hostname permitted to load an agent's public widget. Listed via
 * `GET /agents/{id}/domains/` (gated `agent:view`; writes need
 * `agent:manage`), which landed 2026-09-07 — see
 * `context/app/(restricted)/agents/[agentId]/settings/page.md`.
 */
export type AllowedDomain = {
  id: string;
  agent: string;
  hostname: string;
  created_at: string;
};

/** Never carries the raw secret, only `key_prefix` and revocation state. */
export type AgentDeploymentKey = {
  id: string;
  agent: string;
  key_prefix: string;
  revoked_at: string | null;
  created_at: string;
};

/**
 * Shape of the `POST /agents/{id}/embed-code/` response. The raw secret only
 * ever appears embedded inside `embed_snippet`, never as its own field.
 */
export type AgentEmbedCode = {
  key_prefix: string;
  embed_snippet: string;
  created_at: string;
};
