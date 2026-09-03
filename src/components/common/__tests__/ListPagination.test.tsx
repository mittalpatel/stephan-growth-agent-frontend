import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListPagination } from '../ListPagination';

const defaultProps = {
  currentPage: 1,
  totalPages: 5,
  limit: 20,
  limitOptions: [10, 20, 50],
  onPageChange: vi.fn(),
  onLimitChange: vi.fn(),
};

describe('ListPagination', () => {
  it('renders without crashing', () => {
    render(<ListPagination {...defaultProps} />);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('renders page numbers', () => {
    render(<ListPagination {...defaultProps} currentPage={1} totalPages={5} />);
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  it('calls onPageChange when next is clicked', async () => {
    const onPageChange = vi.fn();
    render(<ListPagination {...defaultProps} onPageChange={onPageChange} currentPage={2} />);
    const nextBtns = screen.getAllByRole('button', { name: /next|siguiente/i });
    await userEvent.click(nextBtns[0]);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange when prev is clicked', async () => {
    const onPageChange = vi.fn();
    render(<ListPagination {...defaultProps} onPageChange={onPageChange} currentPage={3} />);
    const prevBtns = screen.getAllByRole('button', { name: /prev|anterior/i });
    await userEvent.click(prevBtns[0]);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables prev on first page', () => {
    render(<ListPagination {...defaultProps} currentPage={1} />);
    const prevBtns = screen.getAllByRole('button', { name: /prev|anterior/i });
    prevBtns.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('disables next on last page', () => {
    render(<ListPagination {...defaultProps} currentPage={5} totalPages={5} />);
    const nextBtns = screen.getAllByRole('button', { name: /next|siguiente/i });
    nextBtns.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('calls onLimitChange when select changes', async () => {
    const onLimitChange = vi.fn();
    render(<ListPagination {...defaultProps} onLimitChange={onLimitChange} />);
    const select = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(select, '50');
    expect(onLimitChange).toHaveBeenCalledWith(50);
  });

  it('renders all limit options in select', () => {
    render(<ListPagination {...defaultProps} limitOptions={[10, 25, 100]} />);
    const options = screen.getAllByRole('option');
    const values = options.map((o) => o.textContent);
    expect(values).toContain('10');
    expect(values).toContain('25');
    expect(values).toContain('100');
  });
});
