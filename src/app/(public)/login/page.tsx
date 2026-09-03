import type { Metadata } from 'next';
import { Suspense } from 'react';

import { t } from '@/locales';

import SignIn from '../components/SignIn';

export const metadata: Metadata = { title: t.auth.signInTitle };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <SignIn />
    </Suspense>
  );
}
