import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { t } from '@/locales';

import MfaVerifyForm from '../MfaVerifyForm';

const backToLogin = vi.fn();

function mockHook(overrides: Partial<ReturnType<typeof baseHook>> = {}) {
  return { ...baseHook(), ...overrides };
}

function baseHook() {
  return {
    form: {
      register: (name: string) => ({ name, onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() }),
      watch: () => '',
      setValue: vi.fn(),
      formState: { errors: {} },
    },
    isLoading: false,
    ready: true,
    onSubmit: vi.fn((e?: { preventDefault?: () => void }) => e?.preventDefault?.()),
    backToLogin,
  };
}

let hookReturn = mockHook();
vi.mock('../../hooks/useMfaVerifyForm', () => ({
  useMfaVerifyForm: () => hookReturn,
}));

describe('MfaVerifyForm', () => {
  it('renders nothing while not ready (no stored challenge yet)', () => {
    hookReturn = mockHook({ ready: false });
    const { container } = render(<MfaVerifyForm mode="otp" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the authenticator-app copy and a numeric keypad in otp mode', () => {
    hookReturn = mockHook();
    render(<MfaVerifyForm mode="otp" />);
    expect(screen.getByLabelText(t.auth.mfaFlow.codeLabel)).toHaveAttribute(
      'inputmode',
      'numeric'
    );
    expect(
      screen.getByRole('link', { name: t.auth.mfaFlow.useBackupCode })
    ).toHaveAttribute('href', '/login/backup-code');
  });

  it('shows the recovery-code copy and a text keyboard in backup-code mode', () => {
    hookReturn = mockHook();
    render(<MfaVerifyForm mode="backup-code" />);
    expect(screen.getByLabelText(t.auth.mfaFlow.backupCodeLabel)).toHaveAttribute(
      'inputmode',
      'text'
    );
    expect(
      screen.getByRole('link', { name: t.auth.mfaFlow.useAuthenticatorInstead })
    ).toHaveAttribute('href', '/login/otp');
  });
});
