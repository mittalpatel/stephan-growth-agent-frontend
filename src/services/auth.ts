import type { AuthEnvelope } from '@/services/profile';

export const FORGOT_PASSWORD_ENDPOINT = '/api/v1/auth/forgot-password/';
export const VERIFY_RESET_OTP_ENDPOINT = '/api/v1/auth/verify-reset-otp/';
export const RESET_PASSWORD_ENDPOINT = '/api/v1/auth/reset-password/';
export const VALIDATE_INVITE_ENDPOINT = '/api/v1/auth/validate-invite/';
export const REGISTER_ENDPOINT = '/api/v1/auth/register/';
export const PUBLIC_SIGNUP_ENDPOINT = '/api/v1/auth/public-signup/';
export const PUBLIC_SIGNUP_VERIFY_ENDPOINT = '/api/v1/auth/public-signup/verify/';
export const PUBLIC_SIGNUP_RESEND_ENDPOINT = '/api/v1/auth/public-signup/resend/';

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  new_password: string;
  confirm_password: string;
}

export interface ValidateInvitePayload {
  email: string;
  token: string;
}

export interface RegisterPayload {
  email: string;
  token: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface PublicSignupPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface VerifyPublicSignupOtpPayload {
  email: string;
  otp: string;
}

export interface ResendPublicSignupOtpPayload {
  email: string;
}

export type AuthActionResponse = AuthEnvelope<null>;

/**
 * `POST /auth/public-signup/` returns `data: null` when the backend still
 * requires OTP verification (`SIGNUP_OTP_VERIFICATION_ENABLED=true`), or a
 * truthy session payload when it activates the account immediately
 * (`SIGNUP_OTP_VERIFICATION_ENABLED=false`, the backend default). The
 * frontend has no visibility into that flag and must not infer it - it
 * branches on which shape a given response actually is.
 */
export type PublicSignupResponse = AuthEnvelope<Record<string, unknown> | null>;
