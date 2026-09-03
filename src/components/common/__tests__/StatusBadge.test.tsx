import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders the label verbatim', () => {
    render(<StatusBadge label="Ready to ship" />);
    expect(screen.getByText('Ready to ship')).toBeInTheDocument();
  });

  it('defaults to the neutral tone when none is given', () => {
    render(<StatusBadge label="Draft" />);
    expect(screen.getByText('Draft')).toHaveClass('bg-muted');
  });

  it('applies the requested tone', () => {
    render(<StatusBadge label="Active" tone="success" />);
    expect(screen.getByText('Active')).toHaveClass('bg-success');
  });

  it('resolves every tone to a token class, never a literal colour', () => {
    // Guards the dark-mode rule: a tone that resolved to e.g. `bg-emerald-50`
    // would render correctly in light mode and be unreadable in dark.
    const tones = ['neutral', 'success', 'warning', 'danger', 'info'] as const;
    for (const tone of tones) {
      const { unmount } = render(<StatusBadge label={tone} tone={tone} />);
      const className = screen.getByText(tone).className;
      expect(className).not.toMatch(/bg-(emerald|amber|red|blue|green|violet|gray|neutral)-\d+/);
      unmount();
    }
  });

  it('merges a caller className without dropping the tone', () => {
    render(<StatusBadge label="Active" tone="success" className="ml-2" />);
    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('ml-2');
    expect(badge).toHaveClass('bg-success');
  });
});
