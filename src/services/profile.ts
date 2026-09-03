export const PROFILE_ENDPOINT = '/api/v1/auth/profile/';
/**
 * Same-origin route that changes the password.
 *
 * Deliberately not the backend endpoint. Changing the password revokes every
 * outstanding refresh token — including this session's — so the backend returns a
 * replacement pair. Calling it from the browser would hand client JavaScript a
 * fresh, multi-day refresh token; the route makes the call server-side and writes
 * both tokens into the httpOnly cookie instead.
 */
export const CHANGE_PASSWORD_ROUTE = '/api/auth/change-password';

export interface UpdateProfilePayload {
  first_name: string;
  last_name: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// All /api/v1/auth/* endpoints respond with this envelope.
export interface AuthEnvelope<T> {
  success: boolean;
  message: string | null;
  data: T;
  meta: unknown;
  errors: Record<string, string[]> | null;
}
