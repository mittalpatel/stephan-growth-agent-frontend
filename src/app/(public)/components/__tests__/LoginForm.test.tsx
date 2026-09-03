import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { t } from '@/locales';

import LoginForm from '../LoginForm';

const toggleShowPassword = vi.fn();

// One mock path only. The original carried two `vi.mock` calls for the same hook
// — `'../hooks/useLoginForm'` and `'../../hooks/useLoginForm'` — because the
// first was wrong and got left behind rather than removed. Specifiers are
// resolved relative to the *test* file, so only the second ever applied.
vi.mock('../../hooks/useLoginForm', () => ({
  useLoginForm: () => ({
    form: {
      register: (name: string) => ({ name, onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() }),
      formState: { errors: {} },
    },
    isLoading: false,
    showPassword: false,
    toggleShowPassword,
    onSubmit: vi.fn((e) => e?.preventDefault?.()),
  }),
}));

describe('LoginForm', () => {
  it('renders labelled email and password inputs', () => {
    render(<LoginForm />);
    // By label, not placeholder: the label is what a screen reader announces,
    // so asserting on it also asserts the field is accessible.
    expect(screen.getByLabelText(t.auth.emailPlaceholder)).toBeInTheDocument();
    expect(screen.getByLabelText(t.auth.passwordPlaceholder)).toBeInTheDocument();
  });

  it('renders the submit button with the idle label', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: t.auth.signInButton })).toBeInTheDocument();
  });

  it('links to the forgot-password flow', () => {
    render(<LoginForm />);
    expect(screen.getByRole('link', { name: t.auth.forgotPassword })).toHaveAttribute(
      'href',
      '/forgot-password'
    );
  });

  it('exposes the password toggle by accessible name and calls the handler', async () => {
    render(<LoginForm />);
    const toggle = screen.getByRole('button', { name: t.auth.showPassword });
    await userEvent.click(toggle);
    expect(toggleShowPassword).toHaveBeenCalled();
  });

  it('masks the password field until the toggle is used', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(t.auth.passwordPlaceholder)).toHaveAttribute('type', 'password');
  });
});
