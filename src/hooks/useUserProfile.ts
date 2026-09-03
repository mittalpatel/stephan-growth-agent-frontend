'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { PROFILE_ENDPOINT, type AuthEnvelope } from '@/services/profile';
import type { UserProfile } from '@/types/user';

export function useUserProfile(enabled = true) {
  return useAuthQuery<AuthEnvelope<UserProfile>, UserProfile>(['user-profile'], PROFILE_ENDPOINT, {
    enabled,
    select: (res) => res.data,
  });
}
