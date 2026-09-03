import type { Metadata } from 'next';

import { t } from '@/locales';

import ForgotPasswordForm from '../components/ForgotPasswordForm';

export const metadata: Metadata = { title: t.auth.forgotPasswordFlow.title };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
