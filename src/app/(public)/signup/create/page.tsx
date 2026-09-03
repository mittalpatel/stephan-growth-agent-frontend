import type { Metadata } from 'next';

import { t } from '@/locales';

import PublicSignupForm from '../../components/PublicSignupForm';

export const metadata: Metadata = { title: t.auth.publicSignupFlow.title };

export default function PublicSignupPage() {
  return <PublicSignupForm />;
}
