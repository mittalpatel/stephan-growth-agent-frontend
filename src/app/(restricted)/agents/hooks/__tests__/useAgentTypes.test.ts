import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { AGENT_TYPE_SLUGS } from '@/constants/agentTypes';

import { useAgentTypes } from '../useAgentTypes';

let typesData: { data: unknown[] } | undefined;

vi.mock('@/hooks/useAuthQuery', () => ({
  useAuthQuery: () => ({
    data: typesData,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

const websiteSalesSupport = {
  id: 'e1c6f0a2-0000-4000-8000-000000000001',
  slug: 'website_sales_support',
  name: 'Website Sales & Support',
  description: 'Served by the backend.',
  is_available: true,
};

describe('useAgentTypes', () => {
  beforeEach(() => {
    typesData = { data: [websiteSalesSupport] };
  });

  it('shows all four predefined agent types, in roadmap order', () => {
    const { result } = renderHook(() => useAgentTypes());

    expect(result.current.agentTypes.map((type) => type.slug)).toEqual([...AGENT_TYPE_SLUGS]);
  });

  it('marks only the types the backend serves as available', () => {
    const { result } = renderHook(() => useAgentTypes());

    const availability = Object.fromEntries(
      result.current.agentTypes.map((type) => [type.slug, type.is_available])
    );
    expect(availability).toEqual({
      website_sales_support: true,
      sevo: false,
      content_strategy: false,
      lead_outreach: false,
    });
  });

  it("prefers the backend's own copy over the local roadmap's", () => {
    const { result } = renderHook(() => useAgentTypes());

    const served = result.current.agentTypes.find((type) => type.slug === 'website_sales_support');
    expect(served?.description).toBe('Served by the backend.');
  });

  it('falls back to the local roadmap copy for types the backend never returns', () => {
    const { result } = renderHook(() => useAgentTypes());

    const sevo = result.current.agentTypes.find((type) => type.slug === 'sevo');
    expect(sevo?.name).toBe('SEvO');
    expect(sevo?.description).not.toHaveLength(0);
  });

  it('still lists the whole roadmap when the backend serves nothing', () => {
    typesData = { data: [] };
    const { result } = renderHook(() => useAgentTypes());

    expect(result.current.agentTypes).toHaveLength(AGENT_TYPE_SLUGS.length);
    expect(result.current.agentTypes.every((type) => !type.is_available)).toBe(true);
  });

  it('appends a served type the roadmap has never heard of rather than dropping it', () => {
    typesData = {
      data: [
        websiteSalesSupport,
        {
          id: 'e1c6f0a2-0000-4000-8000-000000000009',
          slug: 'future_agent',
          name: 'Future Agent',
          description: 'A fifth kind, shipped after this roadmap was written.',
          is_available: true,
        },
      ],
    };
    const { result } = renderHook(() => useAgentTypes());

    expect(result.current.agentTypes).toHaveLength(AGENT_TYPE_SLUGS.length + 1);
    expect(result.current.agentTypes.at(-1)).toMatchObject({
      slug: 'future_agent',
      is_available: true,
    });
  });
});
