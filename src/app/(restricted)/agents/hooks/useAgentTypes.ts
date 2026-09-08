'use client';

import { useMemo } from 'react';

import { AGENT_TYPE_ROADMAP } from '@/constants/agentTypes';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { AGENT_TYPES_ENDPOINT, AGENT_TYPES_KEY } from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { AgentType } from '@/types/agent';

/**
 * One card on the `/agents` catalog. Not a DTO: `AgentType` rows only
 * exist for types the backend serves, and three of the four entries here are
 * filled in locally, so this deliberately drops `id` (which those three have
 * no real value for) and is keyed by `slug` instead.
 */
export type AgentTypeCatalogEntry = {
  slug: string;
  name: string;
  description: string;
  is_available: boolean;
};

/**
 * The platform's four predefined agent kinds, for the informational
 * `/agents` marketplace.
 *
 * `GET /agents/types/` returns only rows the backend marks `is_available`
 * (today just Website Sales & Support) and accepts no parameter to widen
 * that, so the response alone can never show the roadmap the product is sold
 * on. This merges it against `AGENT_TYPE_ROADMAP` by slug: anything the
 * backend returns wins on name, description, and availability; anything it
 * doesn't renders from the local roadmap as not yet available. A type the
 * backend serves that the roadmap has never heard of (a future fifth kind) is
 * appended rather than dropped, so the API can always outgrow this list.
 */
export function useAgentTypes() {
  const query = useAuthQuery<ApiResponse<AgentType[]>>(AGENT_TYPES_KEY, AGENT_TYPES_ENDPOINT);

  const served = query.data?.data;

  const agentTypes = useMemo<AgentTypeCatalogEntry[]>(() => {
    const bySlug = new Map((served ?? []).map((type) => [type.slug, type]));

    const fromRoadmap = AGENT_TYPE_ROADMAP.map((entry) => {
      const type = bySlug.get(entry.slug);
      return type
        ? { slug: type.slug, name: type.name, description: type.description, is_available: true }
        : { ...entry, is_available: false };
    });

    const unlisted = (served ?? [])
      .filter((type) => !AGENT_TYPE_ROADMAP.some((entry) => entry.slug === type.slug))
      .map((type) => ({
        slug: type.slug,
        name: type.name,
        description: type.description,
        is_available: true,
      }));

    return [...fromRoadmap, ...unlisted];
  }, [served]);

  return {
    agentTypes,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
