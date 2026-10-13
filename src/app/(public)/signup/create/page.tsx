import type { Metadata } from 'next';

import { t } from '@/locales';

import PublicSignupForm from '../../components/PublicSignupForm';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return { title: t.auth.publicSignupFlow.title };
}

export default function PublicSignupPage() {
  return <PublicSignupForm />;
}
