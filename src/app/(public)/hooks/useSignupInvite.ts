'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axiosPublic from '@/client/axiosPublic';
import { getErrorCode } from '@/lib/helper';
import { VALIDATE_INVITE_ENDPOINT } from '@/services/auth';
import type { AuthActionResponse } from '@/services/auth';

export type InviteStatus =
  | 'loading'
  | 'valid'
  | 'invalid'
  | 'expired'
  | 'used'
  | 'missing'
  | 'error';

// Maps the backend's stable `errors.code` (see getErrorCode) to the invite
// state the page renders. Falls back to 'invalid' for any unrecognized code
// so an unexpected backend value still shows a safe, actionable state.
const CODE_TO_STATUS: Record<string, InviteStatus> = {
  invite_invalid: 'invalid',
  invite_expired: 'expired',
  invite_used: 'used',
};

export function useSignupInvite() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  // 'missing' is derived straight from the URL, not fetched — no need to
  // route it through state/effect just to land on the same render.
  const hasParams = Boolean(token && email);
  const [status, setStatus] = useState<InviteStatus>(hasParams ? 'loading' : 'missing');

  useEffect(() => {
    if (!token || !email) return;
    let cancelled = false;
    axiosPublic
      .get<AuthActionResponse>(VALIDATE_INVITE_ENDPOINT, { params: { token, email } })
      .then(() => {
        if (!cancelled) setStatus('valid');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const code = getErrorCode(err);
        setStatus((code && CODE_TO_STATUS[code]) || 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [token, email]);

  return { status: hasParams ? status : 'missing', token, email };
}
