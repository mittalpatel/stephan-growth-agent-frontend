import type { AuthEnvelope } from '@/services/profile';

export const MFA_STATUS_ENDPOINT = '/api/v1/auth/mfa/status/';
export const MFA_SETUP_ENDPOINT = '/api/v1/auth/mfa/setup/';
export const MFA_CONFIRM_ENDPOINT = '/api/v1/auth/mfa/confirm/';
export const MFA_DISABLE_ENDPOINT = '/api/v1/auth/mfa/disable/';
export const MFA_RECOVERY_CODES_REGENERATE_ENDPOINT = '/api/v1/auth/mfa/recovery-codes/regenerate/';

export interface MfaStatus {
  enabled: boolean;
}

export interface MfaEnrollResponse {
  qrcode_data_uri: string;
  secret: string;
}

export interface MfaConfirmPayload {
  token: string;
}

export interface MfaRecoveryCodesResponse {
  recovery_codes: string[];
}

export type { AuthEnvelope };
