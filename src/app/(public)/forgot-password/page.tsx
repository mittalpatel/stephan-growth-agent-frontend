import type { Metadata } from 'next';

import { t } from '@/locales';

import ForgotPasswordForm from '../components/ForgotPasswordForm';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return { title: t.auth.forgotPasswordFlow.title };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
