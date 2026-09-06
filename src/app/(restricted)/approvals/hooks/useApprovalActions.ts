'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { getAxiosError } from '@/lib/helper';
import {
  APPROVALS_LIST_KEY,
  approvalApproveEndpoint,
  approvalDetailKey,
  approvalRejectEndpoint,
} from '@/services/approvals';
import type { ApiResponse } from '@/types/api';
import type { Approval } from '@/types/approval';
import { t } from '@/locales';

/**
 * Approve/reject one approval — mirrors `useLeadActions`.
 *
 * The two halves report errors differently on purpose. Approve is
 * fire-and-forget, so it toasts from `onError` and exposes `mutate` (which
 * never rejects) rather than `mutateAsync` — nothing awaits it, and an
 * un-awaited `mutateAsync` leaves an unhandled rejection behind. Reject is
 * awaited by its dialog (which closes only on success) and therefore carries
 * no `onError` of its own: the dialog's `catch` → `applyApiError` is the
 * single error surface, so a failure produces one toast, not two.
 */
export function useApprovalActions(approvalId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: approvalDetailKey(approvalId) });
    void queryClient.invalidateQueries({ queryKey: [APPROVALS_LIST_KEY] });
  };

  const approveMutation = useAuthMutation<ApiResponse<Approval>, undefined>({
    onSuccess: () => {
      toast.success(t.approvals.toast.approved);
      invalidate();
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  const rejectMutation = useAuthMutation<ApiResponse<Approval>, { rejection_reason: string }>({
    onSuccess: () => {
      toast.success(t.approvals.toast.rejected);
      invalidate();
    },
  });

  return {
    approve: () => approveMutation.mutate({ url: approvalApproveEndpoint(approvalId) }),
    isApproving: approveMutation.isPending,
    reject: (rejection_reason: string) =>
      rejectMutation.mutateAsync({
        url: approvalRejectEndpoint(approvalId),
        body: { rejection_reason },
      }),
    isRejecting: rejectMutation.isPending,
  };
}
