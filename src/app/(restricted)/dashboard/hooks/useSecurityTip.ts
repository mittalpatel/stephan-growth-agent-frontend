'use client';

import { useState, useSyncExternalStore } from 'react';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { MFA_STATUS_KEY } from '@/hooks/useMfa';
import { MFA_STATUS_ENDPOINT, type AuthEnvelope, type MfaStatus } from '@/services/mfa';

const DISMISSED_KEY = 'yb-security-tip-dismissed';

const NEVER_CHANGES = () => () => {};

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * A dismissible dashboard tip pointing at two-step verification. Client
 * testing (29 Sep 2026) flagged "no 2FA" at signup; it already exists on the
 * profile page but nothing led a new account there. Hidden once 2FA is on or
 * the tip is dismissed (a per-browser convenience, so storage failing just
 * shows it again).
 */
export function useSecurityTip() {
  const statusQuery = useAuthQuery<AuthEnvelope<MfaStatus>>(MFA_STATUS_KEY, MFA_STATUS_ENDPOINT);
  // Hidden while server-rendering so a dismissed tip never flashes.
  const storedDismissed = useSyncExternalStore(NEVER_CHANGES, readDismissed, () => true);
  const [dismissedNow, setDismissedNow] = useState(false);

  const dismiss = () => {
    setDismissedNow(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Storage blocked: the tip simply returns on the next visit.
    }
  };

  const enabled = statusQuery.data?.data.enabled;
  return {
    show: enabled === false && !storedDismissed && !dismissedNow,
    dismiss,
  };
}
