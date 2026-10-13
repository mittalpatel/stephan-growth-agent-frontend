import type { Metadata } from 'next';
import { t } from '@/locales';
import { LegalDocument } from '../components/LegalDocument';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return { title: t.legal.termsAndConditions.title };
}

export default function TermsConditionsPage() {
  const { title, subtitle, sections } = t.legal.termsAndConditions;
  return <LegalDocument title={title} subtitle={subtitle} sections={sections} />;
}
