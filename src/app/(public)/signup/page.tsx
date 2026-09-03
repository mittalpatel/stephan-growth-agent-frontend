import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { t } from '@/locales';

import SignupForm from '../components/SignupForm';

export const metadata: Metadata = { title: t.auth.signupFlow.title };

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-muted/40 flex min-h-screen items-center justify-center">
          <Spinner className="text-muted-foreground size-8" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
