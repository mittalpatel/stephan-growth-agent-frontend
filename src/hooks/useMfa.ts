'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { t } from '@/locales';
import {
  MFA_CONFIRM_ENDPOINT,
  MFA_DISABLE_ENDPOINT,
  MFA_RECOVERY_CODES_REGENERATE_ENDPOINT,
  MFA_SETUP_ENDPOINT,
  MFA_STATUS_ENDPOINT,
  type AuthEnvelope,
  type MfaEnrollResponse,
  type MfaRecoveryCodesResponse,
  type MfaStatus,
} from '@/services/mfa';

const copy = t.userProfile.mfa;

const MFA_STATUS_KEY = ['mfa', 'status'];

/**
 * Product MFA: status, enrollment, confirm, disable, recovery-code regeneration.
 *
 * `pendingSecret`/`pendingRecoveryCodes` exist only in this hook's state —
 * never in the TanStack cache, a query key, or the URL — mirroring
 * `RevealSecretDialog`'s reveal-once guarantee for API keys: once the dialog
 * that reads them is dismissed, nothing in the running app still holds the
 * value, matching what the backend guarantees (no endpoint can return either
 * one a second time).
 */
export function useMfa() {
  const statusQuery = useAuthQuery<AuthEnvelope<MfaStatus>>(MFA_STATUS_KEY, MFA_STATUS_ENDPOINT);
  const enabled = statusQuery.data?.data.enabled ?? false;

  const [pendingSecret, setPendingSecret] = useState<MfaEnrollResponse | null>(null);
  const [pendingRecoveryCodes, setPendingRecoveryCodes] = useState<string[] | null>(null);

  const enrollMutation = useAuthMutation<AuthEnvelope<MfaEnrollResponse>>();
  const confirmMutation = useAuthMutation<AuthEnvelope<MfaRecoveryCodesResponse>>();
  const disableMutation = useAuthMutation<AuthEnvelope<null>>();
  const regenerateMutation = useAuthMutation<AuthEnvelope<MfaRecoveryCodesResponse>>();

  async function startEnroll() {
    try {
      const envelope = await enrollMutation.mutateAsync({ url: MFA_SETUP_ENDPOINT });
      setPendingSecret(envelope.data);
    } catch (err) {
      applyApiError(err, { fallbackMessage: copy.enrollFailed });
    }
  }

  async function confirmEnroll(token: string) {
    try {
      const envelope = await confirmMutation.mutateAsync({
        url: MFA_CONFIRM_ENDPOINT,
        body: { token },
      });
      setPendingSecret(null);
      setPendingRecoveryCodes(envelope.data.recovery_codes);
      toast.success(copy.enabled);
      await statusQuery.refetch();
      return true;
    } catch (err) {
      applyApiError(err, { fallbackMessage: copy.invalidCode });
      return false;
    }
  }

  function cancelEnroll() {
    setPendingSecret(null);
  }

  async function disable(token: string) {
    try {
      await disableMutation.mutateAsync({ url: MFA_DISABLE_ENDPOINT, body: { token } });
      toast.success(copy.disabled);
      await statusQuery.refetch();
      return true;
    } catch (err) {
      applyApiError(err, { fallbackMessage: copy.disableFailed });
      return false;
    }
  }

  async function regenerateRecoveryCodes() {
    try {
      const envelope = await regenerateMutation.mutateAsync({
        url: MFA_RECOVERY_CODES_REGENERATE_ENDPOINT,
      });
      setPendingRecoveryCodes(envelope.data.recovery_codes);
    } catch (err) {
      applyApiError(err, { fallbackMessage: copy.regenerateFailed });
    }
  }

  function dismissRecoveryCodes() {
    setPendingRecoveryCodes(null);
  }

  return {
    isLoading: statusQuery.isLoading,
    enabled,
    startEnroll,
    isEnrolling: enrollMutation.isPending,
    pendingSecret,
    confirmEnroll,
    isConfirming: confirmMutation.isPending,
    cancelEnroll,
    disable,
    isDisabling: disableMutation.isPending,
    regenerateRecoveryCodes,
    isRegenerating: regenerateMutation.isPending,
    pendingRecoveryCodes,
    dismissRecoveryCodes,
  };
}
