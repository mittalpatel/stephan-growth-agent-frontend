'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { leadDetailEndpoint, leadDetailKey } from '@/services/leads';
import type { ApiResponse } from '@/types/api';
import type { Lead } from '@/types/lead';

/** One lead, with its collected fields and linked conversation summary. */
export function useLeadDetail(leadId: string | null) {
  const query = useAuthQuery<ApiResponse<Lead>>(
    leadDetailKey(leadId ?? ''),
    leadDetailEndpoint(leadId ?? ''),
    { enabled: Boolean(leadId) }
  );

  return {
    lead: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
