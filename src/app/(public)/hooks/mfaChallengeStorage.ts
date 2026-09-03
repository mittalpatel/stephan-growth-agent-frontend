/**
 * Carries the MFA challenge token across the full-page navigation between
 * `/login`, `/login/otp`, and `/login/backup-code`.
 *
 * `sessionStorage`, not a query param or `localStorage`: a query param lands
 * in browser history and the `Referer` header of anything the page then
 * fetches; `localStorage` would outlive the tab. `sessionStorage` is cleared
 * when the tab closes and never leaves the browser — the closest equivalent
 * to "in memory" that survives a real page navigation. The challenge is
 * short-lived and single-use on the backend regardless (see
 * `apps/users/tokens.py:MFAChallengeToken`), so this is a hand-off, not a
 * second place the token durably lives.
 */

const STORAGE_KEY = 'auth:mfaChallenge';

interface StoredChallenge {
  challenge: string;
  callbackUrl: string | null;
}

export function saveMfaChallenge(challenge: string, callbackUrl: string | null): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ challenge, callbackUrl }));
  } catch {
    // Private-browsing/storage-blocked: the otp/backup-code page's own guard
    // (no stored challenge) sends the user back to /login, which is the
    // correct fallback rather than a crash.
  }
}

export function readMfaChallenge(): StoredChallenge | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredChallenge>;
    return typeof parsed.challenge === 'string'
      ? { challenge: parsed.challenge, callbackUrl: parsed.callbackUrl ?? null }
      : null;
  } catch {
    return null;
  }
}

export function clearMfaChallenge(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage never worked.
  }
}
