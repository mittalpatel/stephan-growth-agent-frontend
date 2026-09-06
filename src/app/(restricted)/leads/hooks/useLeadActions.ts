'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { getAxiosError } from '@/lib/helper';
import { LEADS_LIST_KEY, leadDetailKey, leadStatusEndpoint } from '@/services/leads';
import type { ApiResponse } from '@/types/api';
import type { Lead, LeadStatus } from '@/types/lead';
import { t } from '@/locales';

/** Change a lead's status, one legal transition at a time (`useLeadDetail`'s sibling). */
export function useLeadActions(leadId: string) {
  const queryClient = useQueryClient();

  const changeStatusMutation = useAuthMutation<ApiResponse<Lead>, { status: LeadStatus }>({
    onSuccess: () => {
      toast.success(t.leads.toast.statusChanged);
      void queryClient.invalidateQueries({ queryKey: leadDetailKey(leadId) });
      void queryClient.invalidateQueries({ queryKey: [LEADS_LIST_KEY] });
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  const changeStatus = (status: LeadStatus) =>
    changeStatusMutation.mutateAsync({
      url: leadStatusEndpoint(leadId),
      method: 'patch',
      body: { status },
    });

  return { changeStatus, isChangingStatus: changeStatusMutation.isPending };
}
