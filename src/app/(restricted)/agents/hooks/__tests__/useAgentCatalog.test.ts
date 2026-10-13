import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { AGENT_TYPE_SLUGS } from '@/constants/agentTypes';

import { useAgentCatalog } from '../useAgentCatalog';

let servedTypes: unknown[] = [];
let provisionedAgents: unknown[] = [];
let categoryParam: string | null = null;
const setParam = vi.fn();

vi.mock('@/hooks/useAuthQuery', () => ({
  useAuthQuery: () => ({
    data: { data: servedTypes },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/app/(restricted)/hooks/useAgentOptions', () => ({
  useAgentOptions: () => ({ agents: provisionedAgents, isLoading: false, isError: false }),
}));

vi.mock('@/hooks/useQueryParams', () => ({
  useQueryParams: () => ({ getParam: () => categoryParam, setParam }),
}));

const WEBSITE_SALES_TYPE = {
  id: 'e1c6f0a2-0000-4000-8000-000000000001',
  slug: 'website_sales_support',
  name: 'Website Sales & Support',
  description: 'Served by the backend.',
  is_available: true,
};

const WEBSITE_SALES_AGENT = {
  id: '3f9a2c1e-0000-4000-8000-0000000000aa',
  name: "Acme's sales agent",
  slug: 'acme-sales',
  status: 'active',
  agent_type: WEBSITE_SALES_TYPE,
  human_inbox_email: 'sales@acme.test',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

describe('useAgentCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    servedTypes = [WEBSITE_SALES_TYPE];
    provisionedAgents = [WEBSITE_SALES_AGENT];
    categoryParam = null;
  });

  it('lists all four agent kinds, in roadmap order', () => {
    const { result } = renderHook(() => useAgentCatalog());

    expect(result.current.entries.map((entry) => entry.slug)).toEqual([...AGENT_TYPE_SLUGS]);
  });

  it('attaches the provisioned agent only to the kind it belongs to', () => {
    const { result } = renderHook(() => useAgentCatalog());

    const linked = result.current.entries.filter((entry) => entry.agent !== null);
    expect(linked).toHaveLength(1);
    expect(linked[0]?.slug).toBe('website_sales_support');
    expect(linked[0]?.agent?.id).toBe(WEBSITE_SALES_AGENT.id);
  });

  it("keeps the provisioned agent's real status, rather than assuming active", () => {
    // A paused or archived agent must not render as running on the card.
    provisionedAgents = [{ ...WEBSITE_SALES_AGENT, status: 'paused' }];
    const { result } = renderHook(() => useAgentCatalog());

    const sales = result.current.entries.find((entry) => entry.slug === 'website_sales_support');
    expect(sales?.agent?.status).toBe('paused');
  });

  it('separates a shipped-but-unprovisioned kind from an unshipped one', () => {
    // The org has no agent of a type the backend does serve: a provisioning
    // gap the card must not render as "Coming soon", which would read as
    // "not built yet" and hide something an admin can actually fix.
    provisionedAgents = [];
    const { result } = renderHook(() => useAgentCatalog());

    const sales = result.current.entries.find((entry) => entry.slug === 'website_sales_support');
    expect(sales).toMatchObject({ isAvailable: true, agent: null });

    const sevo = result.current.entries.find((entry) => entry.slug === 'sevo');
    expect(sevo).toMatchObject({ isAvailable: false, agent: null });
  });

  it('leaves unshipped kinds unlinked so their cards render without a route', () => {
    const { result } = renderHook(() => useAgentCatalog());

    const sevo = result.current.entries.find((entry) => entry.slug === 'sevo');
    expect(sevo?.agent).toBeNull();
    expect(sevo?.isAvailable).toBe(false);
  });

  it('carries the local category the API does not expose', () => {
    const { result } = renderHook(() => useAgentCatalog());

    const sales = result.current.entries.find((entry) => entry.slug === 'website_sales_support');
    expect(sales?.category).toBe('sales');
  });

  it('shows exactly the capabilities the backend declares for a shipped kind', () => {
    // `AGENT_TYPE_SEED_DATA` seeds four for this type and no others. Anything
    // extra here would be advertising a capability the product never declared,
    // which is what this assertion exists to catch.
    const { result } = renderHook(() => useAgentCatalog());

    const sales = result.current.entries.find((entry) => entry.slug === 'website_sales_support');
    expect(sales?.capabilities).toEqual([
      'Website knowledge',
      'PDF knowledge',
      'Lead capture',
      'Handoff to a human',
    ]);
  });

  it('falls back to roadmap copy for a kind the backend declares none for', () => {
    const { result } = renderHook(() => useAgentCatalog());

    const sevo = result.current.entries.find((entry) => entry.slug === 'sevo');
    expect(sevo?.capabilities.length).toBeGreaterThan(0);
  });

  it('hides the category filter, and ignores a category in the URL, at four kinds', () => {
    categoryParam = 'growth';
    const { result } = renderHook(() => useAgentCatalog());

    expect(result.current.showCategoryFilter).toBe(false);
    expect(result.current.entries).toHaveLength(4);
  });

  it('ignores a category the catalog has never heard of', () => {
    categoryParam = 'not-a-category';
    const { result } = renderHook(() => useAgentCatalog());

    expect(result.current.category).toBe('all');
    expect(result.current.entries).toHaveLength(AGENT_TYPE_SLUGS.length);
  });

  it('clears the URL param rather than writing "all" to it', () => {
    const { result } = renderHook(() => useAgentCatalog());

    result.current.onCategoryChange('all');
    expect(setParam).toHaveBeenCalledWith('category', null);

    result.current.onCategoryChange('sales');
    expect(setParam).toHaveBeenCalledWith('category', 'sales');
  });
});
