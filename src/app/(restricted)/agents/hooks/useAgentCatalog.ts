'use client';

import { useMemo } from 'react';

import { useAgentOptions } from '@/app/(restricted)/hooks/useAgentOptions';
import {
  AGENT_TYPE_CATEGORIES,
  AGENT_TYPE_ROADMAP,
  type AgentTypeCategory,
} from '@/constants/agentTypes';
import { useQueryParams } from '@/hooks/useQueryParams';
import type { AgentListItem } from '@/types/agent';

import { useAgentTypes } from './useAgentTypes';

/** URL namespace, matching `useAgentsList`'s. Written as `agents_category`. */
const NAMESPACE = 'agents';
const CATEGORY_PARAM = 'category';

/** The category tab bar's own value for "don't filter". Not a category. */
export const ALL_CATEGORIES = 'all';

export type CatalogCategory = typeof ALL_CATEGORIES | AgentTypeCategory;

/**
 * One card on the `/agents` marketplace: an agent kind, plus this
 * organization's provisioned agent of that kind when it has one.
 */
export type AgentCatalogEntry = {
  slug: string;
  name: string;
  description: string;
  category: AgentTypeCategory | null;
  capabilities: readonly string[];
  /** The backend serves this type (`AgentType.is_available`). */
  isAvailable: boolean;
  /**
   * This organization's live agent of this kind, or `null` when the type
   * isn't available yet. Only a card with one is openable: the detail route
   * resolves through `GET /agents/by-type/<slug>/`, which 404s otherwise.
   */
  agent: AgentListItem | null;
};

/**
 * The `/agents` marketplace: all four predefined agent kinds in one grid,
 * matching the `ai-agents-platform` reference's single marketplace page
 * rather than the split catalog/roster pages this app had before.
 *
 * Three sources, because no single one has the whole picture:
 *
 * - `useAgentTypes()` supplies the four kinds and which are available,
 *   itself merging the live catalog with the local roadmap constant.
 * - `useAgentOptions()` supplies this organization's provisioned agents,
 *   matched to their kind by `agent_type.slug`. An org gets exactly one live
 *   agent per available type (`AgentService.provision_defaults`), so this is
 *   a lookup, not a grouping.
 * - `AGENT_TYPE_ROADMAP` supplies category and capabilities, which no API
 *   exposes (`AgentTypeSerializer` serializes neither).
 */
export function useAgentCatalog() {
  const types = useAgentTypes();
  const provisioned = useAgentOptions();
  const { getParam, setParam } = useQueryParams(NAMESPACE);

  const requested = getParam(CATEGORY_PARAM);
  const category: CatalogCategory = AGENT_TYPE_CATEGORIES.some((known) => known === requested)
    ? (requested as AgentTypeCategory)
    : ALL_CATEGORIES;

  const entries = useMemo<AgentCatalogEntry[]>(() => {
    const agentBySlug = new Map(
      provisioned.agents
        .filter((agent): agent is AgentListItem & { agent_type: { slug: string } } =>
          Boolean(agent.agent_type?.slug)
        )
        .map((agent) => [agent.agent_type.slug, agent])
    );

    return types.agentTypes.map((type) => {
      const roadmap = AGENT_TYPE_ROADMAP.find((entry) => entry.slug === type.slug);
      return {
        slug: type.slug,
        name: type.name,
        /*
         * Not `type.description`: the backend's `AgentType.description` is
         * engineering commentary ("Sprint 1's Agent 1..."), not marketing
         * copy, and the served type is the one card where that text would
         * actually reach a user. The roadmap's copy is what was written to
         * match the reference's card text; only a future backend-only type
         * with no roadmap entry falls back to the raw backend description.
         */
        description: roadmap?.description ?? type.description,
        category: roadmap?.category ?? null,
        capabilities: roadmap?.capabilities ?? [],
        isAvailable: type.is_available,
        agent: agentBySlug.get(type.slug) ?? null,
      };
    });
  }, [types.agentTypes, provisioned.agents]);

  const visible = useMemo(
    () =>
      category === ALL_CATEGORIES
        ? entries
        : entries.filter((entry) => entry.category === category),
    [entries, category]
  );

  return {
    entries: visible,
    category,
    onCategoryChange: (next: CatalogCategory) =>
      setParam(CATEGORY_PARAM, next === ALL_CATEGORIES ? null : next),
    isLoading: types.isLoading || provisioned.isLoading,
    isError: types.isError,
    refetch: types.refetch,
  };
}
