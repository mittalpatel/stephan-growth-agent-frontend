import type { Metadata } from 'next';
import { Suspense } from 'react';

import { t } from '@/locales';

import AuthHeroShell from '../../components/AuthHeroShell';
import MfaVerifyForm from '../../components/MfaVerifyForm';

export const metadata: Metadata = { title: t.auth.mfaFlow.title };

export default function LoginOtpPage() {
  return (
    <AuthHeroShell title={t.auth.mfaFlow.title}>
      {/* useMfaVerifyForm reads the `challenge` search param (the social-login
          MFA hand-off — see its own comment), so it needs a boundary. */}
      <Suspense>
        <MfaVerifyForm mode="otp" />
      </Suspense>
    </AuthHeroShell>
  );
}
