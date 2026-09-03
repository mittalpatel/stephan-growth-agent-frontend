'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { safeRedirect } from '@/lib/auth/safeRedirect';
import { t } from '@/locales';

import { clearMfaChallenge, readMfaChallenge, saveMfaChallenge } from './mfaChallengeStorage';

export type MfaVerifyMode = 'otp' | 'backup-code';

function schemaFor(mode: MfaVerifyMode) {
  const message =
    mode === 'backup-code'
      ? t.auth.mfaFlow.validation.backupCodeLength
      : t.auth.mfaFlow.validation.codeLength;
  return z.object({ code: z.string().trim().min(6, { error: message }) });
}

export type MfaCodeFormValues = z.infer<ReturnType<typeof schemaFor>>;

/**
 * Whether a challenge is currently in `sessionStorage`, as three states rather
 * than two: `null` is "not read yet" (the server render, and the first client
 * render before the read effect has run), `true`/`false` are a real answer
 * from the browser. Returned with a `refresh` so the URL-challenge hand-off
 * below can re-read after it writes.
 *
 * The third state is the point. A `false` here sends the user back to
 * `/login`, so "we haven't looked yet" must never be indistinguishable from
 * "we looked and there is nothing". An earlier version returned a plain
 * boolean from `useSyncExternalStore` with a `false` server snapshot, on the
 * assumption that React would resync to the real client value before any
 * effect could act on it. It does not, at least not reliably: on a *full page
 * load* of `/login/otp` — a refresh mid-flow, or a bookmark — the redirect
 * effect fired on the pre-resync `false` and bounced the user back to
 * `/login`, discarding a perfectly valid challenge and forcing them to enter
 * their password again. Verified against a production build, not just dev.
 * The normal path in (`router.push` from the password step) never hit it,
 * which is why it survived: there is no hydration pass on a soft navigation.
 */
function useHasStoredChallenge(): [boolean | null, () => void] {
  const [hasChallenge, setHasChallenge] = useState<boolean | null>(null);
  const refresh = useCallback(() => setHasChallenge(Boolean(readMfaChallenge())), []);
  useEffect(() => {
    // Cannot be a lazy `useState` initializer instead: `readMfaChallenge`
    // touches `sessionStorage`, which doesn't exist during SSR, and this
    // effect's entire purpose (see the doc comment above) is resyncing to the
    // real client value *after* the SSR-safe `null` has already rendered —
    // exactly the server/client resync case the lint rule's own guidance
    // carves out, not a derived-state anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);
  return [hasChallenge, refresh];
}

/**
 * Shared verify-code submission for both `/login/otp` and `/login/backup-code`
 * — same field, same backend check either way (a TOTP code, then a recovery
 * code — see apps/users/services/mfa_service.py:verify_code). `mode` only
 * affects validation copy and which "wrong code" message is shown: the
 * backend's `mfa_invalid_code` wording ("check the time on your device")
 * is TOTP-specific and would be actively misleading on the recovery-code
 * page, so that one case is re-worded per `mode` rather than shown verbatim.
 */
export function useMfaVerifyForm(mode: MfaVerifyMode) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasChallenge, refreshHasChallenge] = useHasStoredChallenge();

  const form = useForm<MfaCodeFormValues>({
    resolver: zodResolver(schemaFor(mode)),
    defaultValues: { code: '' },
  });

  // A social-login (OIDC) sign-in that hit an MFA-enrolled account has no
  // client-side step to call `saveMfaChallenge` from — the browser lands here
  // via a server-issued redirect straight from authOptions.ts's `signIn`
  // callback, which can only pass data through the URL. Move it into the same
  // sessionStorage hand-off the credentials flow uses, then strip it from the
  // URL immediately — it's a one-time hand-off, not a place this token should
  // linger in browser history.
  const urlChallenge = searchParams.get('challenge');
  useEffect(() => {
    if (!urlChallenge) return;
    saveMfaChallenge(urlChallenge, null);
    // The mount read above already ran against empty storage; without this the
    // form would sit at `ready === false` forever on the social-login path.
    refreshHasChallenge();
    router.replace(mode === 'backup-code' ? '/login/backup-code' : '/login/otp');
  }, [urlChallenge, router, mode, refreshHasChallenge]);

  // No challenge in storage means this page was reached directly (a reload
  // after the tab-scoped storage cleared, a bookmark, back-button after
  // finishing) rather than via the password step — nothing to verify against,
  // so start over there instead of rendering a dead form.
  //
  // Strictly `=== false`: `null` means the read hasn't happened yet, and
  // treating that as "no challenge" is exactly the bug described on
  // `useHasStoredChallenge`. Skipped while a `urlChallenge` hand-off is in
  // flight (the effect above), which writes storage and re-reads.
  useEffect(() => {
    if (hasChallenge === false && !urlChallenge) router.replace('/login');
  }, [hasChallenge, urlChallenge, router]);

  const onSubmit = form.handleSubmit(
    useCallback(
      async (values: MfaCodeFormValues) => {
        if (isLoading) return;
        const stored = readMfaChallenge();
        if (!stored) {
          router.replace('/login');
          return;
        }
        try {
          setIsLoading(true);
          const response = await signIn('credentials', {
            mfaChallenge: stored.challenge,
            mfaCode: values.code.trim(),
            redirect: false,
          });

          if (response?.ok) {
            clearMfaChallenge();
            router.push(safeRedirect(stored.callbackUrl));
            return;
          }

          const error = response?.error ?? '';
          // A dead challenge (expired/already consumed) or an account
          // lockout — either way nothing left to retry, so start over at
          // credentials. See authOptions.ts:MFA_FATAL_CODES.
          if (error.startsWith('MFA_FATAL::')) {
            clearMfaChallenge();
            toast.error(error.replace('MFA_FATAL::', '').trim());
            router.push('/login');
            return;
          }
          // A plain wrong code, or a transient rate limit — the challenge is
          // still live, so stay on this page and let them try again.
          if (error.startsWith('MFA_RETRY::')) {
            // Split on the first '::' only — the trailing message is
            // free-form translated text and could itself contain the
            // separator.
            const rest = error.slice('MFA_RETRY::'.length);
            const sepIndex = rest.indexOf('::');
            const errorCode = sepIndex === -1 ? rest : rest.slice(0, sepIndex);
            const msg = sepIndex === -1 ? '' : rest.slice(sepIndex + 2);
            const message =
              errorCode === 'mfa_invalid_code'
                ? mode === 'backup-code'
                  ? t.auth.mfaFlow.backupCodeInvalid
                  : t.auth.mfaFlow.codeInvalid
                : msg || t.auth.validation.signInError;
            form.setError('code', { message });
            form.setValue('code', '');
            return;
          }
          toast.error(error || t.auth.validation.signInError);
        } finally {
          setIsLoading(false);
        }
      },
      [form, isLoading, mode, router]
    )
  );

  function backToLogin() {
    clearMfaChallenge();
    router.push('/login');
  }

  return { form, isLoading, ready: hasChallenge === true, onSubmit, backToLogin };
}
