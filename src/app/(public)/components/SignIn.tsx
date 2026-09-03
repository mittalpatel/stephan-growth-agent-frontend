'use client';

import { Suspense } from 'react';

import { t } from '@/locales';

import AuthHeroShell from './AuthHeroShell';
import LoginForm from './LoginForm';
import SocialLoginButtons from './SocialLoginButtons';

/**
 * The login page. `SocialLoginButtons` renders nothing when no provider is
 * configured (`NEXT_PUBLIC_SOCIAL_PROVIDERS` empty) — the template ships
 * credentials-only by default; social login is a config change, not a code
 * change, once `src/lib/auth/oidcProviders.ts`'s env vars are set. See
 * `integrations/README.md` on the backend for the account-resolution side.
 */
export default function SignIn() {
  return (
    <AuthHeroShell title={t.auth.signInTitle} subtitle={t.auth.signInSubtitle}>
      {/* Both read search params (callbackUrl), so both need the boundary. */}
      <Suspense>
        <SocialLoginButtons />
        <LoginForm />
      </Suspense>
    </AuthHeroShell>
  );
}
