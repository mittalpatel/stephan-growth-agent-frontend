import type { Metadata } from 'next';
import { t } from '@/locales';
import { LegalDocument } from '../components/LegalDocument';

export const metadata: Metadata = { title: 'Aviso de Privacidad' };

export default function PrivacyPolicyPage() {
  const { title, subtitle, sections } = t.legal.privacyPolicy;
  return <LegalDocument title={title} subtitle={subtitle} sections={sections} />;
}
