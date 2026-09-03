import type { Metadata } from 'next';
import { t } from '@/locales';
import { LegalDocument } from '../components/LegalDocument';

export const metadata: Metadata = { title: 'Términos y Condiciones de Uso' };

export default function TermsConditionsPage() {
  const { title, subtitle, sections } = t.legal.termsAndConditions;
  return <LegalDocument title={title} subtitle={subtitle} sections={sections} />;
}
