import { MessagesSquare, PenLine, Radar, Workflow, type LucideIcon } from 'lucide-react';

import { t } from '@/locales';

/**
 * Slugs of the platform's four predefined agent kinds, in the product's own
 * priority order. Mirrors `AgentTypeSlug` in the backend's
 * `apps/agents/constants.py`, which seeds exactly these four rows, and is
 * what `/agents/[agentTypeSlug]` resolves through
 * `GET /agents/by-type/<slug>/`.
 */
export const AGENT_TYPE_SLUGS = [
  'website_sales_support',
  'sevo',
  'content_strategy',
  'lead_outreach',
] as const;

export type AgentTypeSlug = (typeof AGENT_TYPE_SLUGS)[number];

export function isAgentTypeSlug(value: string): value is AgentTypeSlug {
  return AGENT_TYPE_SLUGS.some((slug) => slug === value);
}

/**
 * Card icon per agent kind. Not locale data (a component reference, not
 * copy) and not backend data either: `AgentType` carries no icon field.
 * Mirrors the icons the `ai-agents-platform` reference picks for each.
 */
export const AGENT_TYPE_ICONS: Record<AgentTypeSlug, LucideIcon> = {
  website_sales_support: MessagesSquare,
  sevo: Radar,
  content_strategy: PenLine,
  lead_outreach: Workflow,
};

/**
 * The icon tile's colour per agent kind, as a full utility pair so Tailwind
 * can see the class names (a template-built `bg-chart-${n}/10` compiles to
 * nothing).
 *
 * The reference gives each agent its own accent hex; these are the four chart
 * tokens, which are the same four hues already tuned for both themes and for
 * colour-blind separation. Purely decorative — the card's name and status
 * badge carry every meaning the colour hints at.
 */
export const AGENT_TYPE_ACCENTS: Record<AgentTypeSlug, string> = {
  website_sales_support: 'bg-chart-1/10 text-chart-1',
  sevo: 'bg-chart-4/10 text-chart-4',
  content_strategy: 'bg-chart-2/15 text-chart-2',
  lead_outreach: 'bg-chart-5/10 text-chart-5',
};

/** Fallback tile colour for a served type this build has no entry for. */
export const AGENT_TYPE_ACCENT_FALLBACK = 'bg-muted text-muted-foreground';

/**
 * The category tab each agent kind sits under on `/agents`. The reference
 * filters its marketplace by these four; the backend has no category field,
 * so the grouping lives here.
 */
export const AGENT_TYPE_CATEGORIES = ['sales', 'growth', 'marketing', 'automation'] as const;

export type AgentTypeCategory = (typeof AGENT_TYPE_CATEGORIES)[number];

/**
 * Capability keys the backend declares, mirroring ``AgentCapabilityKey`` in
 * `apps/agents/constants.py`. These are identifiers, not copy: the human
 * labels live in `t.agents.capabilities`, keyed by these exact values.
 */
export const AGENT_CAPABILITY_KEYS = [
  'supports_website_knowledge',
  'supports_pdf_knowledge',
  'supports_lead_capture',
  'supports_human_handoff',
] as const;

export type AgentCapabilityKey = (typeof AGENT_CAPABILITY_KEYS)[number];

/**
 * The capabilities the backend actually seeds per agent kind, mirroring
 * `AGENT_TYPE_SEED_DATA` in `apps/agents/seed_data.py` row for row.
 *
 * Only Website Sales & Support has any: the other three seed
 * `"capabilities": []`, because no runtime behaviour exists for them yet.
 * Nothing invented belongs in this map — if the backend doesn't declare it,
 * it goes in `plannedCapabilities` and reads as roadmap copy instead.
 *
 * `AgentTypeCapability` rows exist in the database but no serializer, view or
 * URL returns them (they appear in the model, the seed, the migrations, the
 * admin and its tests, and nowhere else), so this is the only way the
 * frontend can know them. When `AgentTypeSerializer` starts nesting
 * `capabilities`, read them from the response and delete this map: the keys
 * already match, so the labels keep working untouched.
 */
export const AGENT_TYPE_CAPABILITY_KEYS: Record<AgentTypeSlug, readonly AgentCapabilityKey[]> = {
  website_sales_support: [
    'supports_website_knowledge',
    'supports_pdf_knowledge',
    'supports_lead_capture',
    'supports_human_handoff',
  ],
  sevo: [],
  content_strategy: [],
  lead_outreach: [],
};

/** Which marketplace tab each agent type sits under. A code value, so not in the catalog. */
const CATEGORY_BY_SLUG: Record<AgentTypeSlug, AgentTypeCategory> = {
  website_sales_support: 'sales',
  sevo: 'growth',
  content_strategy: 'marketing',
  lead_outreach: 'automation',
};

/**
 * The four-agent roadmap, as the frontend's own copy of the catalog.
 *
 * This duplicates backend seed data, which is normally the wrong call. It
 * exists because `GET /agents/types/` returns only rows the backend marks
 * `is_available` (one, today) and takes no parameter to ask for the rest, so
 * three of the four agents the product is built around are not reachable
 * through any API. `useAgentTypes()` merges this against the live response by
 * slug, always preferring the backend's own name and description where it
 * returns one, so the duplication only ever fills the gap the API leaves.
 *
 * `capabilities` is derived, not authored, and the two sources never mix:
 *
 * - A kind the backend declares capabilities for renders those, labelled
 *   from `t.agents.capabilities`. That is the real product surface.
 * - A kind it declares none for falls back to `plannedCapabilities`, which is
 *   roadmap copy for something not built yet.
 *
 * Delete the matching entry the moment the backend starts serving that type.
 * The `ai-agents-platform` reference frontend carries the same four-agent
 * catalog locally, in its own `data/agents` module, for the same reason.
 */
export const AGENT_TYPE_ROADMAP: ReadonlyArray<{
  slug: AgentTypeSlug;
  name: string;
  description: string;
  category: AgentTypeCategory;
  capabilities: readonly string[];
  workflow: readonly string[];
  /** The commercial level above this one, as copy for `AgentUpgradeCard`. */
  upgrade: {
    title: string;
    bullets: readonly string[];
    cta: string;
  };
}> = AGENT_TYPE_SLUGS.map((slug) => {
  const declared = AGENT_TYPE_CAPABILITY_KEYS[slug];
  // Getters: this table is built once at load, but its text must be read per
  // render, in the viewer's language (ADR-0019).
  return {
    slug,
    category: CATEGORY_BY_SLUG[slug],
    get name() {
      return t.agents.types.roadmap[slug].name;
    },
    get description() {
      return t.agents.types.roadmap[slug].description;
    },
    get capabilities() {
      return declared.length > 0
        ? declared.map((key) => t.agents.capabilities[key])
        : t.agents.types.roadmap[slug].plannedCapabilities;
    },
    get workflow() {
      return t.agents.types.roadmap[slug].workflow;
    },
    get upgrade() {
      return t.agents.types.roadmap[slug].upgrade;
    },
  };
});
