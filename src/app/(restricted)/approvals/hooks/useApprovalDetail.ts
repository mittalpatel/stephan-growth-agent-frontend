'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { approvalDetailEndpoint, approvalDetailKey } from '@/services/approvals';
import type { ApiResponse } from '@/types/api';
import type { Approval } from '@/types/approval';

export function useApprovalDetail(approvalId: string | null) {
  const query = useAuthQuery<ApiResponse<Approval>>(
    approvalDetailKey(approvalId ?? ''),
    approvalDetailEndpoint(approvalId ?? ''),
    { enabled: Boolean(approvalId) }
  );

  return {
    approval: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
