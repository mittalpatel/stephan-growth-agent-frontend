import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AgentsGrid } from '../AgentsGrid';
import type { AgentCatalogEntry } from '../../hooks/useAgentCatalog';

const AGENT = {
  id: '3f9a2c1e-0000-4000-8000-0000000000aa',
  name: 'test',
  slug: 'test',
  status: 'active' as const,
  agent_type: {
    id: 'e1c6f0a2-0000-4000-8000-000000000001',
    slug: 'website_sales_support',
    name: 'Website Sales & Support',
    description: 'Served by the backend.',
    is_available: true,
  },
  human_inbox_email: 'sales@acme.test',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

function entry(overrides: Partial<AgentCatalogEntry> = {}): AgentCatalogEntry {
  return {
    slug: 'website_sales_support',
    name: 'Website Sales & Support',
    description: 'Grounded sales and support conversations.',
    category: 'sales',
    capabilities: ['Website knowledge'],
    isAvailable: true,
    agent: AGENT,
    ...overrides,
  };
}

describe('AgentsGrid', () => {
  it('links a provisioned agent to its detail page, by type slug', () => {
    render(<AgentsGrid entries={[entry()]} />);

    const link = screen.getByRole('link', { name: /open agent/i });
    expect(link).toHaveAttribute('href', '/agents/website_sales_support');
  });

  it('shows the agent status on a provisioned card', () => {
    render(<AgentsGrid entries={[entry()]} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('offers no link for a shipped kind this organization has no agent of', () => {
    render(<AgentsGrid entries={[entry({ agent: null })]} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Not set up')).toBeInTheDocument();
  });

  it('offers no link for a kind the backend has not shipped', () => {
    render(<AgentsGrid entries={[entry({ agent: null, isAvailable: false })]} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
