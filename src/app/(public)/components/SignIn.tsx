'use client';

import { Suspense } from 'react';

import { t } from '@/locales';

import AuthHeroShell from './AuthHeroShell';
import LoginForm from './LoginForm';

/** The login page — credentials only, no social sign-in. */
export default function SignIn() {
  return (
    <AuthHeroShell title={t.auth.signInTitle} subtitle={t.auth.signInSubtitle}>
      {/* Reads search params (callbackUrl), so it needs the boundary. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthHeroShell>
  );
}
