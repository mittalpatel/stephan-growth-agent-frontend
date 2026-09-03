'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';

import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { t } from '@/locales';
import {
  organizationNotificationPreferencesEndpoint,
  organizationNotificationPreferencesKey,
  type NotificationChannel,
  type NotificationEventType,
  type NotificationPreferences,
} from '@/services/notifications';
import type { ApiResponse } from '@/types/api';

export function useNotificationPreferences() {
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? '';

  const query = useAuthQuery<ApiResponse<NotificationPreferences>>(
    organizationNotificationPreferencesKey(organizationId),
    organizationNotificationPreferencesEndpoint(organizationId),
    { enabled: Boolean(organizationId) }
  );

  const { mutateAsync: mutate, isPending } =
    useAuthMutation<ApiResponse<NotificationPreferences>>();

  const setPreference = useCallback(
    async (eventType: NotificationEventType, channel: NotificationChannel, enabled: boolean) => {
      try {
        await mutate({
          url: organizationNotificationPreferencesEndpoint(organizationId),
          method: 'patch',
          body: { event_type: eventType, channel, enabled },
        });
        toast.success(t.notifications.preferences.updated);
        await query.refetch();
      } catch (error) {
        applyApiError(error, { fallbackMessage: t.notifications.preferences.updateFailed });
      }
    },
    [mutate, organizationId, query]
  );

  return {
    preferences: query.data?.data ?? {},
    isLoading: query.isLoading,
    isSaving: isPending,
    setPreference,
  };
}
