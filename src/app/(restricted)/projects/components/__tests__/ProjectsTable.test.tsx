import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { t } from '@/locales';
import type { ProjectListItem } from '@/types/project';

import { ProjectsTable } from '../ProjectsTable';

function makeProject(overrides: Partial<ProjectListItem> = {}): ProjectListItem {
  return {
    id: '2f1c9a3e-0000-4000-8000-000000000001',
    name: 'Reference project',
    status: 'active',
    category: 'standard',
    owner_email: 'owner@example.com',
    created_at: '2026-01-15T10:30:00Z',
    updated_at: '2026-01-16T10:30:00Z',
    ...overrides,
  };
}

describe('ProjectsTable', () => {
  it('renders one linked row per project', () => {
    render(<ProjectsTable projects={[makeProject(), makeProject({ id: 'b', name: 'Second' })]} />);
    expect(screen.getByRole('link', { name: 'Reference project' })).toHaveAttribute(
      'href',
      '/projects/2f1c9a3e-0000-4000-8000-000000000001'
    );
    expect(screen.getByRole('link', { name: 'Second' })).toBeInTheDocument();
  });

  it('renders translated status and category, never the raw API value', () => {
    render(<ProjectsTable projects={[makeProject({ status: 'archived', category: 'legacy' })]} />);
    expect(screen.getByText(t.projects.status.archived)).toBeInTheDocument();
    expect(screen.getByText(t.projects.category.legacy)).toBeInTheDocument();
    expect(screen.queryByText('archived')).not.toBeInTheDocument();
  });

  it('falls back to the not-available string for a missing owner', () => {
    render(<ProjectsTable projects={[makeProject({ owner_email: '' })]} />);
    expect(screen.getByText(t.common.notAvailable)).toBeInTheDocument();
  });

  it('renders headers and no rows for an empty list', () => {
    render(<ProjectsTable projects={[]} />);
    expect(screen.getByText(t.projects.columns.name)).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});
