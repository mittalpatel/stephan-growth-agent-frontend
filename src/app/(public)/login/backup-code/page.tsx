import type { Metadata } from 'next';
import { Suspense } from 'react';

import { t } from '@/locales';

import AuthHeroShell from '../../components/AuthHeroShell';
import MfaVerifyForm from '../../components/MfaVerifyForm';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return { title: t.auth.mfaFlow.backupCodeLabel };
}

export default function LoginBackupCodePage() {
  return (
    <AuthHeroShell title={t.auth.mfaFlow.title}>
      <Suspense>
        <MfaVerifyForm mode="backup-code" />
      </Suspense>
    </AuthHeroShell>
  );
}
