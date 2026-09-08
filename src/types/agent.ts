/**
 * Agent DTOs — mirrors `apps/agents/api/v1/serializers/agents.py` field for
 * field. Names match the backend exactly (`snake_case`, not camelCase); see
 * `src/types/project.ts` for why that matters.
 */

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
  instructions: string;
  behavior_config: Record<string, unknown>;
  localized_text: Record<string, LocalizedText>;
  theme_config: Record<string, unknown>;
  qualification_config: Record<string, unknown>;
  knowledge_index_version: string | null;
  published_at: string | null;
  notes: string;
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
  instructions: string;
  behavior_config: Record<string, unknown>;
  localized_text: Record<string, LocalizedText>;
  theme_config: Record<string, unknown>;
  qualification_config: Record<string, unknown>;
  notes: string;
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

/** Shape of the `POST /agents/{id}/keys/` response only, the one place the raw secret is ever returned. */
export type AgentDeploymentKeyIssued = AgentDeploymentKey & { secret: string };
