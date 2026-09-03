import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No results found" />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders the optional description', () => {
    render(<EmptyState title="Nothing here" description="Try widening your search." />);
    expect(screen.getByText('Try widening your search.')).toBeInTheDocument();
  });

  it('omits the description element when none is given', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.queryByText('Try widening your search.')).not.toBeInTheDocument();
  });

  it('renders the action so an empty state is never a dead end', () => {
    render(<EmptyState title="Nothing here" action={<button type="button">Create one</button>} />);
    expect(screen.getByRole('button', { name: 'Create one' })).toBeInTheDocument();
  });
});
