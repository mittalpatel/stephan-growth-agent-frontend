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

/** Approve/reject one approval — mirrors `useLeadActions`. */
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
    onError: (error) => toast.error(getAxiosError(error)),
  });

  return {
    approve: () => approveMutation.mutateAsync({ url: approvalApproveEndpoint(approvalId) }),
    isApproving: approveMutation.isPending,
    reject: (rejection_reason: string) =>
      rejectMutation.mutateAsync({
        url: approvalRejectEndpoint(approvalId),
        body: { rejection_reason },
      }),
    isRejecting: rejectMutation.isPending,
  };
}
