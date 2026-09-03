import type { AuthEnvelope } from '@/services/profile';

export const SESSIONS_LIST_ENDPOINT = '/api/v1/auth/sessions/';

export function sessionRevokeEndpoint(jti: string): string {
  return `/api/v1/auth/sessions/${encodeURIComponent(jti)}/`;
}

export interface SessionRow {
  jti: string;
  created_at: string;
  expires_at: string;
  user_agent: string;
  ip_address: string | null;
  is_current: boolean;
}

export type { AuthEnvelope };
