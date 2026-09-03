import type { Metadata } from 'next';
import { Suspense } from 'react';

import { t } from '@/locales';

import AuthHeroShell from '../../components/AuthHeroShell';
import MfaVerifyForm from '../../components/MfaVerifyForm';

export const metadata: Metadata = { title: t.auth.mfaFlow.backupCodeLabel };

export default function LoginBackupCodePage() {
  return (
    <AuthHeroShell title={t.auth.mfaFlow.title}>
      <Suspense>
        <MfaVerifyForm mode="backup-code" />
      </Suspense>
    </AuthHeroShell>
  );
}
