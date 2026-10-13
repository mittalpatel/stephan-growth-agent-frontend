import type { Metadata } from 'next';
import { Suspense } from 'react';

import { t } from '@/locales';

import SignIn from '../components/SignIn';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return { title: t.auth.signInTitle };
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <SignIn />
    </Suspense>
  );
}
